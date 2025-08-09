import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechSettings {
  rate: number;        // 0.1 - 10 (速度)
  pitch: number;       // 0 - 2 (音程)
  volume: number;      // 0 - 1 (音量)
  voice: SpeechSynthesisVoice | null;
}

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  speaking: boolean;
  paused: boolean;
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  settings: SpeechSettings;
  updateSettings: (newSettings: Partial<SpeechSettings>) => void;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
}

export const useSpeechSynthesis = (): UseSpeechSynthesisReturn => {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const textToSpeak = useRef<string>('');
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  
  const [settings, setSettings] = useState<SpeechSettings>({
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voice: null
  });

  // ブラウザサポートチェック
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setSupported(true);
      
      // 音声リストの取得
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // 高品質日本語音声を優先順位で選択
        if (!settings.voice && availableVoices.length > 0) {
          const priorityVoices = [
            // Google系（最高品質）
            availableVoices.find(voice => 
              voice.name.includes('Google') && voice.lang.includes('ja')
            ),
            // Microsoft系（高品質）
            availableVoices.find(voice => 
              (voice.name.includes('Microsoft') || voice.name.includes('Haruka') || voice.name.includes('Sayaka')) 
              && voice.lang.includes('ja')
            ),
            // システム標準の日本語音声
            availableVoices.find(voice => 
              voice.lang === 'ja-JP' || voice.lang === 'ja_JP'
            ),
            // その他の日本語音声
            availableVoices.find(voice => 
              voice.lang.startsWith('ja') || 
              voice.name.includes('Japanese') ||
              voice.name.includes('Japan')
            ),
            // フォールバック: 最初の音声
            availableVoices[0]
          ].filter(Boolean);

          if (priorityVoices.length > 0) {
            setSettings(prev => ({ 
              ...prev, 
              voice: priorityVoices[0] || null,
              // DJ向けの最適化設定
              rate: 0.85,  // 少し遅めでより聞き取りやすく
              pitch: 1.05, // 少し高めで明るい印象
              volume: 0.9  // 少し控えめの音量
            }));
          }
        }
      };

      // 音声リストが非同期で読み込まれる場合に対応
      if (speechSynthesis.getVoices().length > 0) {
        loadVoices();
      } else {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // 進捗追跡のヘルパー
  const startProgressTracking = useCallback((text: string) => {
    textToSpeak.current = text;
    setProgress({ current: 0, total: text.length, percentage: 0 });
    
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    progressInterval.current = setInterval(() => {
      if (!currentUtterance.current || !speechSynthesis.speaking) {
        return;
      }
      
      // 簡易的な進捗計算（実際の文字位置は取得困難なため推定）
      const utterance = currentUtterance.current;
      const estimatedDuration = (text.length / settings.rate) * 100; // ミリ秒
      const startTime = (utterance as any)._startTime;
      
      if (startTime) {
        const elapsed = Date.now() - startTime;
        const estimatedCurrent = Math.min(
          Math.floor((elapsed / estimatedDuration) * text.length),
          text.length
        );
        
        setProgress({
          current: estimatedCurrent,
          total: text.length,
          percentage: Math.floor((estimatedCurrent / text.length) * 100)
        });
      }
    }, 100);
  }, [settings.rate]);

  const clearProgressTracking = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    setProgress({ current: 0, total: 0, percentage: 0 });
  }, []);

  const speak = useCallback((text: string) => {
    if (!supported) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // 既存の音声を停止
    speechSynthesis.cancel();
    
    // テキストの前処理（DJ向け最適化）
    const processedText = text
      .replace(/[「」]/g, '') // 日本語の括弧を除去
      .replace(/\s+/g, ' ')   // 複数のスペースを単一に
      .replace(/([。！？])\s*/g, '$1 ') // 句読点後に適切な間隔
      .replace(/、/g, '、 ')   // 読点後に間隔
      .trim();
    
    const utterance = new SpeechSynthesisUtterance(processedText);
    
    // DJ向けに最適化された設定を適用
    utterance.rate = Math.max(0.5, Math.min(2.0, settings.rate));
    utterance.pitch = Math.max(0.0, Math.min(2.0, settings.pitch));
    utterance.volume = Math.max(0.0, Math.min(1.0, settings.volume));
    
    // 日本語音声の場合はさらに調整
    if (settings.voice) {
      utterance.voice = settings.voice;
      
      // 日本語音声の場合の特別調整
      if (settings.voice.lang.includes('ja')) {
        utterance.rate = Math.max(0.6, utterance.rate); // 最低速度を上げて自然に
        utterance.pitch = Math.min(1.3, utterance.pitch); // 音程上限を制限
      }
    }

    // イベントハンドラー
    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
      (utterance as any)._startTime = Date.now();
      startProgressTracking(text);
    };

    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
      clearProgressTracking();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setSpeaking(false);
      setPaused(false);
      clearProgressTracking();
    };

    utterance.onpause = () => {
      setPaused(true);
    };

    utterance.onresume = () => {
      setPaused(false);
    };

    currentUtterance.current = utterance;
    speechSynthesis.speak(utterance);
  }, [supported, settings, startProgressTracking, clearProgressTracking]);

  const pause = useCallback(() => {
    if (supported && speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
    }
  }, [supported]);

  const resume = useCallback(() => {
    if (supported && speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  }, [supported]);

  const stop = useCallback(() => {
    if (supported) {
      speechSynthesis.cancel();
      setSpeaking(false);
      setPaused(false);
      clearProgressTracking();
    }
  }, [supported, clearProgressTracking]);

  const updateSettings = useCallback((newSettings: Partial<SpeechSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // 音声リストが変更された時の再設定
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (voices.length > 0 && !settings.voice) {
      const japaneseVoice = voices.find(voice => 
        voice.lang.startsWith('ja') || 
        voice.name.includes('Japanese') ||
        voice.name.includes('Japan')
      );
      
      if (japaneseVoice) {
        updateSettings({ voice: japaneseVoice });
      }
    }
  }, [voices, updateSettings]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      clearProgressTracking();
    };
  }, [clearProgressTracking]);

  return {
    speak,
    pause,
    resume,
    stop,
    speaking,
    paused,
    supported,
    voices,
    settings,
    updateSettings,
    progress
  };
};