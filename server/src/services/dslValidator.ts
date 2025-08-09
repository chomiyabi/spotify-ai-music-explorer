// DSL Workflow Validator - Comprehensive validation for DSL workflow files
import Ajv, { JSONSchemaType, Schema } from 'ajv';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';

// Validation result types
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata?: {
    validatedAt: string;
    schemaVersion: string;
    workflowName?: string;
  };
}

interface ValidationError {
  type: 'error';
  code: string;
  message: string;
  path?: string;
  line?: number;
  column?: number;
  severity: 'critical' | 'high' | 'medium';
}

interface ValidationWarning {
  type: 'warning';
  code: string;
  message: string;
  path?: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

interface WorkflowValidationContext {
  stepIds: Set<string>;
  inputNames: Set<string>;
  outputNames: Set<string>;
  dependencies: Map<string, string[]>;
  executionOrder?: string[];
}

class DSLValidator {
  private ajv: Ajv;
  private workflowSchema: Schema;

  constructor() {
    this.ajv = new Ajv({ 
      allErrors: true, 
      verbose: true,
      strict: false,
      removeAdditional: false
    });
    addFormats(this.ajv);
    
    this.workflowSchema = this.createWorkflowSchema();
  }

  // メインのワークフロー検証メソッド
  async validateWorkflow(workflowContent: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let workflowData: any;

    try {
      // YAML解析
      workflowData = yaml.load(workflowContent);
    } catch (yamlError: any) {
      errors.push({
        type: 'error',
        code: 'YAML_PARSE_ERROR',
        message: `YAML parsing failed: ${yamlError.message}`,
        severity: 'critical',
        line: yamlError.mark?.line,
        column: yamlError.mark?.column
      });

      return {
        valid: false,
        errors,
        warnings,
        metadata: {
          validatedAt: new Date().toISOString(),
          schemaVersion: '1.0.0'
        }
      };
    }

    // スキーマバリデーション
    const schemaValidation = this.validateSchema(workflowData);
    errors.push(...schemaValidation.errors);
    warnings.push(...schemaValidation.warnings);

    if (schemaValidation.valid) {
      // セマンティックバリデーション
      const semanticValidation = this.validateSemantics(workflowData);
      errors.push(...semanticValidation.errors);
      warnings.push(...semanticValidation.warnings);

      // ベストプラクティスチェック
      const bestPracticesValidation = this.validateBestPractices(workflowData);
      warnings.push(...bestPracticesValidation.warnings);
    }

    const valid = errors.length === 0;

    return {
      valid,
      errors,
      warnings,
      metadata: {
        validatedAt: new Date().toISOString(),
        schemaVersion: '1.0.0',
        workflowName: workflowData?.metadata?.name
      }
    };
  }

  // スキーマ検証
  private validateSchema(workflowData: any): { valid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    const validate = this.ajv.compile(this.workflowSchema);
    const valid = validate(workflowData);

    if (!valid && validate.errors) {
      for (const error of validate.errors) {
        const path = error.instancePath || error.schemaPath;
        
        errors.push({
          type: 'error',
          code: 'SCHEMA_VALIDATION_ERROR',
          message: `Schema validation failed at ${path}: ${error.message}`,
          path,
          severity: this.getErrorSeverity(error.keyword),
        });
      }
    }

    return { valid, errors, warnings };
  }

  // セマンティックバリデーション
  private validateSemantics(workflowData: any): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    const context: WorkflowValidationContext = {
      stepIds: new Set(),
      inputNames: new Set(Object.keys(workflowData.inputs || {})),
      outputNames: new Set(Object.keys(workflowData.outputs || {})),
      dependencies: new Map()
    };

    // ステップの基本検証
    if (workflowData.workflow?.steps) {
      for (const step of workflowData.workflow.steps) {
        // 重複ステップIDチェック
        if (context.stepIds.has(step.id)) {
          errors.push({
            type: 'error',
            code: 'DUPLICATE_STEP_ID',
            message: `Duplicate step ID found: ${step.id}`,
            path: `workflow.steps[].id`,
            severity: 'critical'
          });
        } else {
          context.stepIds.add(step.id);
        }

        // 依存関係の記録
        if (step.depends_on) {
          context.dependencies.set(step.id, step.depends_on);
        }
      }

      // 依存関係の検証
      this.validateDependencies(context, errors, warnings);

      // ステップタイプ別の検証
      for (const step of workflowData.workflow.steps) {
        this.validateStepConfiguration(step, context, errors, warnings);
      }
    }

    // 出力の検証
    if (workflowData.outputs) {
      this.validateOutputs(workflowData.outputs, context, errors, warnings);
    }

    // ワークフローフロー検証
    this.validateWorkflowFlow(workflowData, context, errors, warnings);

    return { errors, warnings };
  }

  // 依存関係の検証
  private validateDependencies(
    context: WorkflowValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // 存在しない依存関係の検証
    for (const [stepId, dependencies] of context.dependencies) {
      for (const depId of dependencies) {
        if (!context.stepIds.has(depId)) {
          errors.push({
            type: 'error',
            code: 'MISSING_DEPENDENCY',
            message: `Step ${stepId} depends on non-existent step: ${depId}`,
            path: `workflow.steps[id=${stepId}].depends_on`,
            severity: 'high'
          });
        }
      }
    }

    // 循環依存の検証
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (stepId: string): boolean => {
      if (recursionStack.has(stepId)) {
        return true; // 循環依存発見
      }
      if (visited.has(stepId)) {
        return false; // 既に処理済み
      }
      
      visited.add(stepId);
      recursionStack.add(stepId);
      
      const deps = context.dependencies.get(stepId) || [];
      for (const depId of deps) {
        if (hasCycle(depId)) {
          return true;
        }
      }
      
      recursionStack.delete(stepId);
      return false;
    };

    for (const stepId of context.stepIds) {
      if (hasCycle(stepId)) {
        errors.push({
          type: 'error',
          code: 'CIRCULAR_DEPENDENCY',
          message: `Circular dependency detected involving step: ${stepId}`,
          path: 'workflow.steps',
          severity: 'critical'
        });
        break;
      }
    }
  }

  // ステップ設定の検証
  private validateStepConfiguration(
    step: any,
    context: WorkflowValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const stepPath = `workflow.steps[id=${step.id}]`;
    
    switch (step.type) {
      case 'code':
        this.validateCodeStep(step, stepPath, errors, warnings);
        break;
      case 'llm':
        this.validateLLMStep(step, stepPath, errors, warnings);
        break;
      case 'http':
        this.validateHttpStep(step, stepPath, errors, warnings);
        break;
      case 'condition':
        this.validateConditionStep(step, stepPath, context, errors, warnings);
        break;
      case 'start':
        this.validateStartStep(step, stepPath, errors, warnings);
        break;
      case 'end':
        this.validateEndStep(step, stepPath, errors, warnings);
        break;
    }
  }

  // コードステップの検証
  private validateCodeStep(
    step: any,
    stepPath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const config = step.config;
    
    if (!config) {
      errors.push({
        type: 'error',
        code: 'MISSING_CONFIG',
        message: `Code step ${step.id} is missing configuration`,
        path: `${stepPath}.config`,
        severity: 'high'
      });
      return;
    }

    if (!config.code) {
      errors.push({
        type: 'error',
        code: 'MISSING_CODE',
        message: `Code step ${step.id} is missing code`,
        path: `${stepPath}.config.code`,
        severity: 'high'
      });
    } else {
      // コード品質のチェック
      const codeLength = config.code.length;
      if (codeLength > 5000) {
        warnings.push({
          type: 'warning',
          code: 'LONG_CODE',
          message: `Code step ${step.id} has very long code (${codeLength} characters)`,
          path: `${stepPath}.config.code`,
          suggestion: 'Consider breaking down complex code into multiple steps'
        });
      }

      // main 関数の存在チェック（JavaScript の場合）
      if (config.language === 'javascript' && !config.code.includes('function main')) {
        warnings.push({
          type: 'warning',
          code: 'MISSING_MAIN_FUNCTION',
          message: `JavaScript code step ${step.id} should define a main function`,
          path: `${stepPath}.config.code`,
          suggestion: 'Define a main function as the entry point'
        });
      }
    }

    if (!config.language) {
      warnings.push({
        type: 'warning',
        code: 'MISSING_LANGUAGE',
        message: `Code step ${step.id} is missing language specification`,
        path: `${stepPath}.config.language`,
        suggestion: 'Specify the programming language (python3, javascript, bash)'
      });
    } else if (!['python3', 'javascript', 'bash'].includes(config.language)) {
      errors.push({
        type: 'error',
        code: 'UNSUPPORTED_LANGUAGE',
        message: `Code step ${step.id} uses unsupported language: ${config.language}`,
        path: `${stepPath}.config.language`,
        severity: 'medium'
      });
    }
  }

  // LLMステップの検証
  private validateLLMStep(
    step: any,
    stepPath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const config = step.config;
    
    if (!config) {
      errors.push({
        type: 'error',
        code: 'MISSING_CONFIG',
        message: `LLM step ${step.id} is missing configuration`,
        path: `${stepPath}.config`,
        severity: 'high'
      });
      return;
    }

    if (!config.model) {
      errors.push({
        type: 'error',
        code: 'MISSING_MODEL',
        message: `LLM step ${step.id} is missing model specification`,
        path: `${stepPath}.config.model`,
        severity: 'high'
      });
    }

    if (!config.prompt) {
      errors.push({
        type: 'error',
        code: 'MISSING_PROMPT',
        message: `LLM step ${step.id} is missing prompt`,
        path: `${stepPath}.config.prompt`,
        severity: 'high'
      });
    } else {
      // プロンプトの長さチェック
      if (config.prompt.length < 20) {
        warnings.push({
          type: 'warning',
          code: 'SHORT_PROMPT',
          message: `LLM step ${step.id} has very short prompt`,
          path: `${stepPath}.config.prompt`,
          suggestion: 'Consider providing more detailed instructions'
        });
      }
      
      if (config.prompt.length > 8000) {
        warnings.push({
          type: 'warning',
          code: 'LONG_PROMPT',
          message: `LLM step ${step.id} has very long prompt`,
          path: `${stepPath}.config.prompt`,
          suggestion: 'Consider breaking down complex prompts'
        });
      }
    }

    // 温度設定のチェック
    if (config.temperature !== undefined) {
      if (config.temperature < 0 || config.temperature > 2) {
        errors.push({
          type: 'error',
          code: 'INVALID_TEMPERATURE',
          message: `LLM step ${step.id} has invalid temperature: ${config.temperature}`,
          path: `${stepPath}.config.temperature`,
          severity: 'medium'
        });
      }
    }

    // トークン数のチェック
    if (config.max_tokens !== undefined) {
      if (config.max_tokens < 1 || config.max_tokens > 4000) {
        warnings.push({
          type: 'warning',
          code: 'UNUSUAL_TOKEN_LIMIT',
          message: `LLM step ${step.id} has unusual max_tokens: ${config.max_tokens}`,
          path: `${stepPath}.config.max_tokens`,
          suggestion: 'Typical range is 100-2000 tokens'
        });
      }
    }
  }

  // HTTPステップの検証
  private validateHttpStep(
    step: any,
    stepPath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const config = step.config;
    
    if (!config) {
      errors.push({
        type: 'error',
        code: 'MISSING_CONFIG',
        message: `HTTP step ${step.id} is missing configuration`,
        path: `${stepPath}.config`,
        severity: 'high'
      });
      return;
    }

    if (!config.url) {
      errors.push({
        type: 'error',
        code: 'MISSING_URL',
        message: `HTTP step ${step.id} is missing URL`,
        path: `${stepPath}.config.url`,
        severity: 'high'
      });
    } else {
      // URL形式の簡単な検証
      try {
        new URL(config.url.replace(/\$\{[^}]+\}/g, 'placeholder'));
      } catch {
        errors.push({
          type: 'error',
          code: 'INVALID_URL',
          message: `HTTP step ${step.id} has invalid URL format`,
          path: `${stepPath}.config.url`,
          severity: 'medium'
        });
      }
    }

    if (!config.method) {
      warnings.push({
        type: 'warning',
        code: 'MISSING_METHOD',
        message: `HTTP step ${step.id} is missing method (defaults to GET)`,
        path: `${stepPath}.config.method`,
        suggestion: 'Explicitly specify HTTP method'
      });
    } else {
      const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
      if (!validMethods.includes(config.method.toUpperCase())) {
        errors.push({
          type: 'error',
          code: 'INVALID_HTTP_METHOD',
          message: `HTTP step ${step.id} has invalid method: ${config.method}`,
          path: `${stepPath}.config.method`,
          severity: 'medium'
        });
      }
    }

    // タイムアウトのチェック
    if (config.timeout !== undefined) {
      if (config.timeout < 1000 || config.timeout > 300000) {
        warnings.push({
          type: 'warning',
          code: 'UNUSUAL_TIMEOUT',
          message: `HTTP step ${step.id} has unusual timeout: ${config.timeout}ms`,
          path: `${stepPath}.config.timeout`,
          suggestion: 'Typical range is 5000-60000ms'
        });
      }
    }
  }

  // 条件ステップの検証
  private validateConditionStep(
    step: any,
    stepPath: string,
    context: WorkflowValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const config = step.config;
    
    if (!config?.condition) {
      errors.push({
        type: 'error',
        code: 'MISSING_CONDITION',
        message: `Condition step ${step.id} is missing condition`,
        path: `${stepPath}.config.condition`,
        severity: 'high'
      });
    }

    // true_step と false_step の存在チェック
    if (config?.true_step && !context.stepIds.has(config.true_step)) {
      errors.push({
        type: 'error',
        code: 'MISSING_TRUE_STEP',
        message: `Condition step ${step.id} references non-existent true_step: ${config.true_step}`,
        path: `${stepPath}.config.true_step`,
        severity: 'medium'
      });
    }

    if (config?.false_step && !context.stepIds.has(config.false_step)) {
      errors.push({
        type: 'error',
        code: 'MISSING_FALSE_STEP',
        message: `Condition step ${step.id} references non-existent false_step: ${config.false_step}`,
        path: `${stepPath}.config.false_step`,
        severity: 'medium'
      });
    }
  }

  // スタートステップの検証
  private validateStartStep(
    step: any,
    stepPath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (step.depends_on && step.depends_on.length > 0) {
      warnings.push({
        type: 'warning',
        code: 'START_STEP_DEPENDENCIES',
        message: `Start step ${step.id} should not have dependencies`,
        path: `${stepPath}.depends_on`,
        suggestion: 'Remove dependencies from start step'
      });
    }
  }

  // エンドステップの検証
  private validateEndStep(
    step: any,
    stepPath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!step.depends_on || step.depends_on.length === 0) {
      warnings.push({
        type: 'warning',
        code: 'END_STEP_NO_DEPENDENCIES',
        message: `End step ${step.id} has no dependencies`,
        path: `${stepPath}.depends_on`,
        suggestion: 'End step should depend on final workflow steps'
      });
    }
  }

  // 出力の検証
  private validateOutputs(
    outputs: any,
    context: WorkflowValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (const [outputName, outputDef] of Object.entries(outputs)) {
      if (!outputDef || typeof outputDef !== 'object') {
        errors.push({
          type: 'error',
          code: 'INVALID_OUTPUT_DEFINITION',
          message: `Output ${outputName} has invalid definition`,
          path: `outputs.${outputName}`,
          severity: 'medium'
        });
        continue;
      }

      const def = outputDef as any;
      if (!def.source) {
        errors.push({
          type: 'error',
          code: 'MISSING_OUTPUT_SOURCE',
          message: `Output ${outputName} is missing source`,
          path: `outputs.${outputName}.source`,
          severity: 'high'
        });
      } else {
        // ソース参照の検証
        this.validateExpressionReferences(def.source, context, errors, warnings, `outputs.${outputName}.source`);
      }
    }
  }

  // ワークフローフローの検証
  private validateWorkflowFlow(
    workflowData: any,
    context: WorkflowValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const steps = workflowData.workflow?.steps || [];
    
    // スタートステップの存在チェック
    const startSteps = steps.filter((s: any) => s.type === 'start');
    if (startSteps.length === 0) {
      warnings.push({
        type: 'warning',
        code: 'NO_START_STEP',
        message: 'Workflow has no start step',
        path: 'workflow.steps',
        suggestion: 'Add a start step to mark workflow entry point'
      });
    } else if (startSteps.length > 1) {
      warnings.push({
        type: 'warning',
        code: 'MULTIPLE_START_STEPS',
        message: 'Workflow has multiple start steps',
        path: 'workflow.steps',
        suggestion: 'Consider using only one start step'
      });
    }

    // エンドステップの存在チェック
    const endSteps = steps.filter((s: any) => s.type === 'end');
    if (endSteps.length === 0) {
      warnings.push({
        type: 'warning',
        code: 'NO_END_STEP',
        message: 'Workflow has no end step',
        path: 'workflow.steps',
        suggestion: 'Add an end step to mark workflow completion'
      });
    }

    // 到達不可能なステップのチェック
    this.validateReachability(steps, errors, warnings);
  }

  // ステップの到達可能性検証
  private validateReachability(
    steps: any[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const startSteps = steps.filter(s => s.type === 'start');
    if (startSteps.length === 0) return;

    const reachable = new Set<string>();
    const toVisit = [...startSteps.map(s => s.id)];

    // BFSで到達可能なステップを探索
    while (toVisit.length > 0) {
      const currentId = toVisit.shift()!;
      if (reachable.has(currentId)) continue;
      
      reachable.add(currentId);
      
      // このステップに依存するステップを探す
      for (const step of steps) {
        if (step.depends_on && step.depends_on.includes(currentId)) {
          toVisit.push(step.id);
        }
      }
    }

    // 到達不可能なステップを警告
    for (const step of steps) {
      if (!reachable.has(step.id)) {
        warnings.push({
          type: 'warning',
          code: 'UNREACHABLE_STEP',
          message: `Step ${step.id} is not reachable from start steps`,
          path: `workflow.steps[id=${step.id}]`,
          suggestion: 'Ensure this step has proper dependencies or is connected to the workflow flow'
        });
      }
    }
  }

  // 式の参照検証
  private validateExpressionReferences(
    expression: string,
    context: WorkflowValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    path: string
  ): void {
    // ${step.output} 形式の参照を検索
    const matches = expression.match(/\$\{([^}]+)\}/g);
    if (!matches) return;

    for (const match of matches) {
      const ref = match.slice(2, -1); // ${ と } を除去
      const parts = ref.split('.');
      
      if (parts.length < 2) {
        warnings.push({
          type: 'warning',
          code: 'INCOMPLETE_REFERENCE',
          message: `Expression contains incomplete reference: ${match}`,
          path,
          suggestion: 'Use format ${step_id.output_name} or ${input.variable_name}'
        });
        continue;
      }

      const [prefix, ...rest] = parts;
      
      if (prefix === 'input') {
        // 入力変数の参照
        const inputName = rest.join('.');
        if (!context.inputNames.has(inputName)) {
          errors.push({
            type: 'error',
            code: 'INVALID_INPUT_REFERENCE',
            message: `Reference to non-existent input: ${inputName}`,
            path,
            severity: 'medium'
          });
        }
      } else if (prefix === 'sys') {
        // システム変数（常に有効）
        continue;
      } else {
        // ステップ出力の参照
        if (!context.stepIds.has(prefix)) {
          errors.push({
            type: 'error',
            code: 'INVALID_STEP_REFERENCE',
            message: `Reference to non-existent step: ${prefix}`,
            path,
            severity: 'medium'
          });
        }
      }
    }
  }

  // ベストプラクティスの検証
  private validateBestPractices(workflowData: any): { warnings: ValidationWarning[] } {
    const warnings: ValidationWarning[] = [];

    // ワークフロー名の命名規則
    if (workflowData.metadata?.name) {
      const name = workflowData.metadata.name;
      if (!/^[a-z][a-z0-9_]*$/.test(name)) {
        warnings.push({
          type: 'warning',
          code: 'WORKFLOW_NAMING',
          message: 'Workflow name should use snake_case format',
          path: 'metadata.name',
          suggestion: 'Use lowercase letters, numbers, and underscores only'
        });
      }
    }

    // 説明の長さ
    if (workflowData.metadata?.description) {
      const desc = workflowData.metadata.description;
      if (desc.length < 20) {
        warnings.push({
          type: 'warning',
          code: 'SHORT_DESCRIPTION',
          message: 'Workflow description is very short',
          path: 'metadata.description',
          suggestion: 'Provide a more detailed description of the workflow purpose'
        });
      }
    } else {
      warnings.push({
        type: 'warning',
        code: 'MISSING_DESCRIPTION',
        message: 'Workflow is missing description',
        path: 'metadata.description',
        suggestion: 'Add a description to document the workflow purpose'
      });
    }

    // ステップ数のチェック
    const stepCount = workflowData.workflow?.steps?.length || 0;
    if (stepCount > 20) {
      warnings.push({
        type: 'warning',
        code: 'COMPLEX_WORKFLOW',
        message: `Workflow has many steps (${stepCount})`,
        path: 'workflow.steps',
        suggestion: 'Consider breaking down into smaller, composable workflows'
      });
    }

    // 入力数のチェック
    const inputCount = Object.keys(workflowData.inputs || {}).length;
    if (inputCount > 15) {
      warnings.push({
        type: 'warning',
        code: 'MANY_INPUTS',
        message: `Workflow has many inputs (${inputCount})`,
        path: 'inputs',
        suggestion: 'Consider grouping related inputs into objects'
      });
    }

    return { warnings };
  }

  // エラーの重要度を判定
  private getErrorSeverity(keyword?: string): 'critical' | 'high' | 'medium' {
    const criticalKeywords = ['required', 'type', 'additionalProperties'];
    const highKeywords = ['pattern', 'format', 'enum'];
    
    if (keyword && criticalKeywords.includes(keyword)) {
      return 'critical';
    } else if (keyword && highKeywords.includes(keyword)) {
      return 'high';
    }
    
    return 'medium';
  }

  // ワークフロースキーマの定義
  private createWorkflowSchema(): Schema {
    return {
      type: 'object',
      required: ['metadata', 'inputs', 'workflow', 'outputs'],
      properties: {
        metadata: {
          type: 'object',
          required: ['name', 'description', 'version'],
          properties: {
            name: {
              type: 'string',
              pattern: '^[a-zA-Z][a-zA-Z0-9_-]*$',
              minLength: 3,
              maxLength: 100
            },
            description: {
              type: 'string',
              maxLength: 500
            },
            version: {
              type: 'string',
              pattern: '^\\d+\\.\\d+\\.\\d+$'
            },
            author: {
              type: 'string',
              maxLength: 100
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
                maxLength: 50
              },
              maxItems: 10
            }
          },
          additionalProperties: true
        },
        inputs: {
          type: 'object',
          patternProperties: {
            '^[a-zA-Z][a-zA-Z0-9_]*$': {
              type: 'object',
              required: ['type'],
              properties: {
                type: {
                  type: 'string',
                  enum: ['string', 'number', 'integer', 'boolean', 'array', 'object']
                },
                required: {
                  type: 'boolean',
                  default: false
                },
                description: {
                  type: 'string',
                  maxLength: 200
                }
              },
              additionalProperties: true
            }
          },
          additionalProperties: false
        },
        workflow: {
          type: 'object',
          required: ['steps'],
          properties: {
            steps: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['id', 'type'],
                properties: {
                  id: {
                    type: 'string',
                    pattern: '^[a-zA-Z][a-zA-Z0-9_]*$'
                  },
                  type: {
                    type: 'string',
                    enum: ['start', 'end', 'code', 'llm', 'http', 'condition', 'loop', 'parallel']
                  },
                  name: {
                    type: 'string',
                    maxLength: 100
                  },
                  description: {
                    type: 'string',
                    maxLength: 200
                  },
                  depends_on: {
                    type: 'array',
                    items: {
                      type: 'string',
                      pattern: '^[a-zA-Z][a-zA-Z0-9_]*$'
                    }
                  }
                },
                additionalProperties: true
              }
            }
          }
        },
        outputs: {
          type: 'object',
          patternProperties: {
            '^[a-zA-Z][a-zA-Z0-9_]*$': {
              type: 'object',
              required: ['source'],
              properties: {
                source: {
                  type: 'string'
                },
                type: {
                  type: 'string',
                  enum: ['string', 'number', 'integer', 'boolean', 'array', 'object']
                },
                description: {
                  type: 'string',
                  maxLength: 200
                }
              },
              additionalProperties: true
            }
          },
          additionalProperties: false
        }
      },
      additionalProperties: false
    };
  }

  // ファイルからの検証
  async validateWorkflowFile(filePath: string): Promise<ValidationResult> {
    try {
      const content = require('fs').readFileSync(filePath, 'utf8');
      return await this.validateWorkflow(content);
    } catch (error: any) {
      return {
        valid: false,
        errors: [{
          type: 'error',
          code: 'FILE_READ_ERROR',
          message: `Failed to read workflow file: ${error.message}`,
          severity: 'critical'
        }],
        warnings: [],
        metadata: {
          validatedAt: new Date().toISOString(),
          schemaVersion: '1.0.0'
        }
      };
    }
  }
}

export default new DSLValidator();