import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

class ClaudeService {
  private client: Anthropic | null = null;

  constructor() {
    const apiKey = process.env.CLAUDE_API_KEY;
    
    if (apiKey && apiKey !== 'your_claude_api_key_here') {
      this.client = new Anthropic({
        apiKey: apiKey,
      });
    } else {
      console.warn('Claude API key not configured. AI search will use fallback mode.');
    }
  }

  async interpretMusicQuery(query: string): Promise<{
    searchTerms: string[];
    genre?: string;
    mood?: string;
    artist?: string;
    decade?: string;
    language?: string;
    suggestions?: string[];
  }> {
    if (!this.client) {
      // フォールバック: シンプルな文字列解析
      return this.fallbackQueryInterpretation(query);
    }

    try {
      const prompt = `
あなたは音楽検索の専門家です。以下の日本語の音楽検索クエリを分析して、Spotify APIで効果的に検索するためのパラメータを抽出してください。

ユーザーの検索クエリ: "${query}"

以下のJSON形式で回答してください：
{
  "searchTerms": ["検索に使用するキーワードの配列"],
  "genre": "ジャンル（もしあれば）",
  "mood": "気分・雰囲気（もしあれば）",
  "artist": "アーティスト名（もしあれば）",
  "decade": "年代（もしあれば）",
  "language": "言語（もしあれば）",
  "suggestions": ["追加の検索候補"]
}

例：
- "悲しい時に聞きたい洋楽" → genre: "pop", mood: "sad", language: "english"
- "90年代のJ-POP" → genre: "j-pop", decade: "1990s", language: "japanese"
- "ワークアウトに最適な曲" → mood: "energetic", searchTerms: ["workout", "fitness", "gym"]
- "米津玄師のような曲" → artist: "米津玄師", searchTerms: ["indie", "alternative", "japanese"]

日本語の検索クエリを理解して、適切な英語の検索パラメータに変換してください。
`;

      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          const result = JSON.parse(content.text);
          return result;
        } catch (parseError) {
          console.error('Failed to parse Claude response:', parseError);
          return this.fallbackQueryInterpretation(query);
        }
      }

      return this.fallbackQueryInterpretation(query);
    } catch (error) {
      console.error('Claude API error:', error);
      return this.fallbackQueryInterpretation(query);
    }
  }

  private fallbackQueryInterpretation(query: string): {
    searchTerms: string[];
    genre?: string;
    mood?: string;
    artist?: string;
    decade?: string;
    language?: string;
    suggestions?: string[];
  } {
    const lowerQuery = query.toLowerCase();
    
    // 基本的なキーワード検出
    const searchTerms: string[] = [];
    let genre: string | undefined;
    let mood: string | undefined;
    let decade: string | undefined;
    let language: string | undefined;

    // ジャンル検出
    if (lowerQuery.includes('j-pop') || lowerQuery.includes('jpop')) {
      genre = 'j-pop';
      language = 'japanese';
    } else if (lowerQuery.includes('k-pop') || lowerQuery.includes('kpop')) {
      genre = 'k-pop';
      language = 'korean';
    } else if (lowerQuery.includes('ロック') || lowerQuery.includes('rock')) {
      genre = 'rock';
    } else if (lowerQuery.includes('ポップ') || lowerQuery.includes('pop')) {
      genre = 'pop';
    } else if (lowerQuery.includes('ヒップホップ') || lowerQuery.includes('hip-hop')) {
      genre = 'hip-hop';
    }

    // 気分・雰囲気検出
    if (lowerQuery.includes('悲しい') || lowerQuery.includes('sad')) {
      mood = 'sad';
      searchTerms.push('melancholy', 'emotional');
    } else if (lowerQuery.includes('楽しい') || lowerQuery.includes('happy') || lowerQuery.includes('元気')) {
      mood = 'happy';
      searchTerms.push('upbeat', 'energetic');
    } else if (lowerQuery.includes('リラックス') || lowerQuery.includes('chill')) {
      mood = 'chill';
      searchTerms.push('relaxing', 'ambient');
    } else if (lowerQuery.includes('ワークアウト') || lowerQuery.includes('運動')) {
      mood = 'energetic';
      searchTerms.push('workout', 'fitness', 'gym');
    }

    // 年代検出
    if (lowerQuery.includes('90年代') || lowerQuery.includes('90s')) {
      decade = '1990s';
    } else if (lowerQuery.includes('80年代') || lowerQuery.includes('80s')) {
      decade = '1980s';
    } else if (lowerQuery.includes('2000年代') || lowerQuery.includes('2000s')) {
      decade = '2000s';
    }

    // 言語検出
    if (lowerQuery.includes('洋楽') || lowerQuery.includes('english')) {
      language = 'english';
    } else if (lowerQuery.includes('邦楽') || lowerQuery.includes('japanese')) {
      language = 'japanese';
    }

    // クエリをそのまま検索項目に追加
    searchTerms.push(query);

    return {
      searchTerms,
      genre,
      mood,
      decade,
      language,
      suggestions: [
        '関連する楽曲を探しています...'
      ]
    };
  }
}

export default new ClaudeService();