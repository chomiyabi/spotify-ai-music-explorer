// DSL Workflow Engine - YAML-based workflow execution for Dify-style processing
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import ivm from 'isolated-vm';

// Core workflow types
interface WorkflowMetadata {
  name: string;
  description: string;
  version: string;
  author?: string;
  tags?: string[];
  dify?: {
    api_url?: string;
    timeout?: number;
  };
}

interface WorkflowInput {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  default?: any;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    enum?: any[];
  };
  example?: any;
}

interface WorkflowStep {
  id: string;
  type: 'start' | 'end' | 'code' | 'llm' | 'http' | 'condition' | 'loop' | 'parallel';
  name?: string;
  description?: string;
  depends_on?: string[];
  config?: any;
  outputs?: Record<string, string>;
  error_handling?: {
    on_error?: 'fail' | 'skip' | 'retry' | 'fallback';
    retry_count?: number;
    fallback_step?: string;
  };
}

interface WorkflowOutput {
  source: string;
  type?: string;
  description?: string;
}

interface WorkflowDefinition {
  metadata: WorkflowMetadata;
  inputs: Record<string, WorkflowInput>;
  workflow: {
    steps: WorkflowStep[];
  };
  outputs: Record<string, WorkflowOutput>;
}

interface ExecutionContext {
  inputs: Record<string, any>;
  stepResults: Record<string, any>;
  variables: Record<string, any>;
  startTime: Date;
  currentStep?: string;
}

interface StepResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  retryCount: number;
}

interface ExecutionResult {
  success: boolean;
  outputs?: Record<string, any>;
  error?: string;
  executionTime: number;
  stepResults: Record<string, StepResult>;
  metadata: {
    workflowName: string;
    executedAt: string;
    totalSteps: number;
    completedSteps: number;
  };
}

class DSLWorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executionHistory: ExecutionResult[] = [];

  // ワークフローをファイルから読み込み
  async loadWorkflowFromFile(filePath: string): Promise<WorkflowDefinition> {
    try {
      const absolutePath = path.resolve(filePath);
      const fileContent = fs.readFileSync(absolutePath, 'utf8');
      const workflow = yaml.load(fileContent) as WorkflowDefinition;
      
      // 基本的な構造検証
      this.validateWorkflowStructure(workflow);
      
      // ワークフローを登録
      this.workflows.set(workflow.metadata.name, workflow);
      
      console.log(`Workflow loaded: ${workflow.metadata.name} v${workflow.metadata.version}`);
      return workflow;
    } catch (error: any) {
      throw new Error(`Failed to load workflow from ${filePath}: ${error.message}`);
    }
  }

  // ワークフロー構造の基本検証
  private validateWorkflowStructure(workflow: WorkflowDefinition): void {
    if (!workflow.metadata?.name) {
      throw new Error('Workflow metadata.name is required');
    }
    if (!workflow.inputs) {
      throw new Error('Workflow inputs are required');
    }
    if (!workflow.workflow?.steps || !Array.isArray(workflow.workflow.steps)) {
      throw new Error('Workflow steps are required and must be an array');
    }
    if (!workflow.outputs) {
      throw new Error('Workflow outputs are required');
    }

    // ステップIDの重複チェック
    const stepIds = workflow.workflow.steps.map(step => step.id);
    const uniqueIds = new Set(stepIds);
    if (stepIds.length !== uniqueIds.size) {
      throw new Error('Duplicate step IDs found in workflow');
    }

    // 依存関係の検証
    const stepIdSet = new Set(stepIds);
    for (const step of workflow.workflow.steps) {
      if (step.depends_on) {
        for (const depId of step.depends_on) {
          if (!stepIdSet.has(depId)) {
            throw new Error(`Step ${step.id} depends on non-existent step: ${depId}`);
          }
        }
      }
    }
  }

  // ワークフローの実行
  async executeWorkflow(workflowName: string, inputs: Record<string, any>): Promise<ExecutionResult> {
    const startTime = new Date();
    const workflow = this.workflows.get(workflowName);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowName}`);
    }

    console.log(`Starting workflow execution: ${workflowName}`);

    // 実行コンテキストの初期化
    const context: ExecutionContext = {
      inputs: this.validateAndProcessInputs(workflow, inputs),
      stepResults: {},
      variables: {
        ...inputs,
        sys: {
          current_time: new Date().toISOString(),
          workflow_name: workflowName,
          execution_id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      },
      startTime
    };

    const stepResults: Record<string, StepResult> = {};
    let completedSteps = 0;

    try {
      // ステップの実行順序を決定（依存関係に基づく）
      const executionOrder = this.resolveExecutionOrder(workflow.workflow.steps);
      
      // 各ステップを順次実行
      for (const step of executionOrder) {
        context.currentStep = step.id;
        const stepStartTime = Date.now();
        
        console.log(`Executing step: ${step.id} (${step.type})`);
        
        try {
          const result = await this.executeStep(step, context);
          const duration = Date.now() - stepStartTime;
          
          stepResults[step.id] = {
            success: true,
            data: result,
            duration,
            retryCount: 0
          };
          
          // ステップ結果をコンテキストに追加
          context.stepResults[step.id] = result;
          context.variables[step.id] = result;
          
          completedSteps++;
          
        } catch (error: any) {
          const duration = Date.now() - stepStartTime;
          
          // エラーハンドリング
          const handled = await this.handleStepError(step, error, context);
          
          stepResults[step.id] = {
            success: !handled.shouldFail,
            error: error.message,
            duration,
            retryCount: handled.retryCount || 0,
            data: handled.fallbackData
          };
          
          if (handled.shouldFail) {
            throw new Error(`Step ${step.id} failed: ${error.message}`);
          }
          
          // フォールバックデータがある場合は続行
          if (handled.fallbackData) {
            context.stepResults[step.id] = handled.fallbackData;
            context.variables[step.id] = handled.fallbackData;
            completedSteps++;
          }
        }
      }

      // 出力値の解決
      const outputs = this.resolveOutputs(workflow.outputs, context);
      const executionTime = Date.now() - startTime.getTime();

      const result: ExecutionResult = {
        success: true,
        outputs,
        executionTime,
        stepResults,
        metadata: {
          workflowName: workflow.metadata.name,
          executedAt: startTime.toISOString(),
          totalSteps: workflow.workflow.steps.length,
          completedSteps
        }
      };

      this.executionHistory.push(result);
      console.log(`Workflow completed successfully: ${workflowName} (${executionTime}ms)`);
      
      return result;

    } catch (error: any) {
      const executionTime = Date.now() - startTime.getTime();
      
      const result: ExecutionResult = {
        success: false,
        error: error.message,
        executionTime,
        stepResults,
        metadata: {
          workflowName: workflow.metadata.name,
          executedAt: startTime.toISOString(),
          totalSteps: workflow.workflow.steps.length,
          completedSteps
        }
      };

      this.executionHistory.push(result);
      console.error(`Workflow failed: ${workflowName} - ${error.message}`);
      
      return result;
    }
  }

  // 入力値の検証と処理
  private validateAndProcessInputs(
    workflow: WorkflowDefinition, 
    inputs: Record<string, any>
  ): Record<string, any> {
    const processedInputs: Record<string, any> = {};
    
    for (const [inputName, inputDef] of Object.entries(workflow.inputs)) {
      const value = inputs[inputName];
      
      // 必須チェック
      if (inputDef.required && (value === undefined || value === null)) {
        if (inputDef.default !== undefined) {
          processedInputs[inputName] = inputDef.default;
        } else {
          throw new Error(`Required input missing: ${inputName}`);
        }
      } else if (value !== undefined) {
        // バリデーション
        this.validateInputValue(inputName, value, inputDef);
        processedInputs[inputName] = value;
      } else if (inputDef.default !== undefined) {
        processedInputs[inputName] = inputDef.default;
      }
    }
    
    return processedInputs;
  }

  // 入力値のバリデーション
  private validateInputValue(name: string, value: any, definition: WorkflowInput): void {
    // 型チェック
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (definition.type === 'integer' && actualType === 'number' && !Number.isInteger(value)) {
      throw new Error(`Input ${name} must be an integer`);
    } else if (definition.type !== 'integer' && definition.type !== actualType) {
      throw new Error(`Input ${name} must be of type ${definition.type}, got ${actualType}`);
    }

    // バリデーションルールの適用
    if (definition.validation) {
      const validation = definition.validation;
      
      if (typeof value === 'string') {
        if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
          throw new Error(`Input ${name} does not match required pattern`);
        }
        if (validation.minLength && value.length < validation.minLength) {
          throw new Error(`Input ${name} is too short (min: ${validation.minLength})`);
        }
        if (validation.maxLength && value.length > validation.maxLength) {
          throw new Error(`Input ${name} is too long (max: ${validation.maxLength})`);
        }
      }
      
      if (typeof value === 'number') {
        if (validation.minimum && value < validation.minimum) {
          throw new Error(`Input ${name} is too small (min: ${validation.minimum})`);
        }
        if (validation.maximum && value > validation.maximum) {
          throw new Error(`Input ${name} is too large (max: ${validation.maximum})`);
        }
      }
      
      if (validation.enum && !validation.enum.includes(value)) {
        throw new Error(`Input ${name} must be one of: ${validation.enum.join(', ')}`);
      }
    }
  }

  // ステップ実行順序の解決（依存関係に基づく）
  private resolveExecutionOrder(steps: WorkflowStep[]): WorkflowStep[] {
    const resolved: WorkflowStep[] = [];
    const remaining = [...steps];
    const processing = new Set<string>();

    while (remaining.length > 0) {
      const readySteps = remaining.filter(step => {
        if (processing.has(step.id)) return false;
        return !step.depends_on || step.depends_on.every(depId => 
          resolved.some(resolvedStep => resolvedStep.id === depId)
        );
      });

      if (readySteps.length === 0) {
        throw new Error('Circular dependency detected in workflow steps');
      }

      for (const step of readySteps) {
        resolved.push(step);
        processing.add(step.id);
        const index = remaining.indexOf(step);
        remaining.splice(index, 1);
      }
    }

    return resolved;
  }

  // 個別ステップの実行
  private async executeStep(step: WorkflowStep, context: ExecutionContext): Promise<any> {
    switch (step.type) {
      case 'start':
        return { started_at: new Date().toISOString() };
        
      case 'end':
        return { completed_at: new Date().toISOString() };
        
      case 'code':
        return this.executeCodeStep(step, context);
        
      case 'llm':
        return this.executeLLMStep(step, context);
        
      case 'http':
        return this.executeHttpStep(step, context);
        
      default:
        throw new Error(`Unsupported step type: ${step.type}`);
    }
  }

  // コードステップの実行
  private async executeCodeStep(step: WorkflowStep, context: ExecutionContext): Promise<any> {
    const config = step.config;
    if (!config?.code) {
      throw new Error(`Code step ${step.id} is missing code configuration`);
    }

    const language = config.language || 'python3';
    const code = config.code;
    const timeout = config.timeout || 30000;

    if (language === 'python3') {
      return this.executePythonCode(code, context, timeout);
    } else if (language === 'javascript') {
      return this.executeJavaScriptCode(code, context, timeout);
    } else {
      throw new Error(`Unsupported code language: ${language}`);
    }
  }

  // Python コードの実行（簡易実装 - 実際にはより安全な実行環境が必要）
  private async executePythonCode(
    code: string, 
    context: ExecutionContext, 
    timeout: number
  ): Promise<any> {
    // この実装は簡易版です。本番環境では、より安全な Python 実行環境
    // （Docker コンテナ、サンドボックス環境等）を使用してください。
    
    throw new Error('Python execution not implemented in this demo. Use JavaScript code steps instead.');
  }

  // JavaScript コードの実行
  private async executeJavaScriptCode(
    code: string, 
    context: ExecutionContext, 
    timeout: number
  ): Promise<any> {
    const isolate = new ivm.Isolate({ memoryLimit: 32 });
    const jsContext = await isolate.createContext();
    const jail = jsContext.global;
    
    try {
      // 安全なグローバル関数の提供
      await jail.set('console', {
        log: (...args: any[]) => console.log(`[Step ${context.currentStep}]`, ...args),
        error: (...args: any[]) => console.error(`[Step ${context.currentStep}]`, ...args)
      });
      
      // JSON, Math などの基本オブジェクト
      await jail.set('JSON', JSON);
      await jail.set('Math', Math);
      await jail.set('parseInt', parseInt);
      await jail.set('parseFloat', parseFloat);
      await jail.set('isNaN', isNaN);
      await jail.set('isFinite', isFinite);
      
      // コンテキスト変数の設定
      for (const [key, value] of Object.entries(context.variables)) {
        await jail.set(key, new ivm.ExternalCopy(value).copyInto());
      }
      
      // main 関数が定義されていることを確認し、実行
      const wrappedCode = `
        ${code}
        
        if (typeof main !== 'function') {
          throw new Error('Code must define a main function');
        }
        
        // 引数を適切に構築して main 関数を呼び出し
        const inputKeys = [${Object.keys(context.inputs).map(k => `"${k}"`).join(', ')}];
        const args = inputKeys.map(key => eval(key)).filter(val => val !== undefined);
        
        const result = main(...args);
        result;
      `;

      const script = await isolate.compileScript(wrappedCode);
      const result = await script.run(jsContext, { timeout });
      
      // 結果を JavaScript オブジェクトに変換
      return result?.copy?.() || result;
      
    } catch (error: any) {
      throw new Error(`Code execution failed: ${error.message}`);
    } finally {
      isolate.dispose();
    }
  }

  // LLM ステップの実行
  private async executeLLMStep(step: WorkflowStep, context: ExecutionContext): Promise<any> {
    const config = step.config;
    if (!config?.model || !config?.prompt) {
      throw new Error(`LLM step ${step.id} is missing model or prompt configuration`);
    }

    // プロンプトの変数置換
    const resolvedPrompt = this.resolveExpressions(config.prompt, context);
    const systemPrompt = config.system_prompt ? this.resolveExpressions(config.system_prompt, context) : undefined;

    // Claude AI API の呼び出し（実装は既存の DifyService を使用）
    const difyService = require('./difyService').default;
    
    if (difyService.isAvailable()) {
      // Dify 経由で実行
      const result = await difyService.generateDJContent(
        context.variables.chart_data || [],
        context.variables.chart_type || 'daily-top',
        {
          length: 'medium',
          style: 'energetic',
          userId: context.variables.sys.execution_id
        }
      );
      
      return {
        text: result.text,
        metadata: result.metadata
      };
    } else {
      // フォールバック: シンプルなレスポンス
      return {
        text: resolvedPrompt,
        metadata: {
          model: config.model,
          generated_at: new Date().toISOString(),
          method: 'fallback'
        }
      };
    }
  }

  // HTTP ステップの実行
  private async executeHttpStep(step: WorkflowStep, context: ExecutionContext): Promise<any> {
    const axios = require('axios');
    const config = step.config;
    
    if (!config?.url || !config?.method) {
      throw new Error(`HTTP step ${step.id} is missing url or method configuration`);
    }

    const url = this.resolveExpressions(config.url, context);
    const method = config.method.toLowerCase();
    const headers = config.headers || {};
    const timeout = config.timeout || 30000;
    
    const requestConfig: any = {
      method,
      url,
      headers,
      timeout
    };

    if (config.body && ['post', 'put', 'patch'].includes(method)) {
      requestConfig.data = this.resolveExpressions(config.body, context);
    }

    try {
      const response = await axios(requestConfig);
      return {
        status: response.status,
        headers: response.headers,
        data: response.data
      };
    } catch (error: any) {
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }

  // 変数式の解決（${variable.path} 形式）
  private resolveExpressions(template: string, context: ExecutionContext): any {
    if (typeof template !== 'string') {
      return template;
    }

    return template.replace(/\$\{([^}]+)\}/g, (match, expression) => {
      try {
        const value = this.resolvePath(expression, context.variables);
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
      } catch {
        console.warn(`Could not resolve expression: ${expression}`);
        return match; // 解決できない場合は元の文字列を保持
      }
    });
  }

  // パス形式での値の解決（例: "step_id.output_name"）
  private resolvePath(path: string, variables: Record<string, any>): any {
    const parts = path.split('.');
    let current = variables;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        throw new Error(`Path not found: ${path}`);
      }
    }
    
    return current;
  }

  // ステップエラーのハンドリング
  private async handleStepError(
    step: WorkflowStep, 
    error: Error, 
    context: ExecutionContext
  ): Promise<{ shouldFail: boolean; retryCount?: number; fallbackData?: any }> {
    const errorHandling = step.error_handling || { on_error: 'fail' };
    
    switch (errorHandling.on_error) {
      case 'skip':
        console.warn(`Skipping failed step: ${step.id} - ${error.message}`);
        return { shouldFail: false };
        
      case 'retry':
        const retryCount = errorHandling.retry_count || 1;
        // TODO: 実装 - retry ロジック
        console.warn(`Retry not implemented for step: ${step.id}`);
        return { shouldFail: true, retryCount };
        
      case 'fallback':
        if (errorHandling.fallback_step) {
          console.warn(`Using fallback for step: ${step.id}`);
          // TODO: 実装 - fallback step の実行
          return { shouldFail: false, fallbackData: { fallback: true } };
        }
        return { shouldFail: true };
        
      default:
        return { shouldFail: true };
    }
  }

  // 出力値の解決
  private resolveOutputs(
    outputs: Record<string, WorkflowOutput>, 
    context: ExecutionContext
  ): Record<string, any> {
    const resolvedOutputs: Record<string, any> = {};
    
    for (const [outputName, outputDef] of Object.entries(outputs)) {
      try {
        const value = this.resolveExpressions(outputDef.source, context);
        resolvedOutputs[outputName] = value;
      } catch (error: any) {
        console.error(`Failed to resolve output ${outputName}: ${error.message}`);
        resolvedOutputs[outputName] = null;
      }
    }
    
    return resolvedOutputs;
  }

  // 利用可能なワークフロー一覧を取得
  getAvailableWorkflows(): string[] {
    return Array.from(this.workflows.keys());
  }

  // 実行履歴を取得
  getExecutionHistory(): ExecutionResult[] {
    return this.executionHistory;
  }

  // ワークフロー詳細を取得
  getWorkflowDetails(name: string): WorkflowDefinition | undefined {
    return this.workflows.get(name);
  }
}

export default new DSLWorkflowEngine();