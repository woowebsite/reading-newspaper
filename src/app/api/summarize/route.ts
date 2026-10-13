import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_BASE = process.env.GEMINI_API || 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const GEMINI_API_KEY_ENV = process.env.GEMINI_API_KEY;

interface ArticleForSummary {
  title: string;
  description: string;
  category: string;
  sourceName: string;
  isLiked?: boolean;
  isRead?: boolean;
}

interface SummaryRequest {
  articles: ArticleForSummary[];
  preferences: {
    favoriteCategories: string[];
    summaryLanguage: 'vi' | 'en';
  };
  apiKey?: string; // optional - falls back to env key
  date: string;
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

export async function POST(request: NextRequest) {
  const body: SummaryRequest = await request.json();
  const { articles, preferences, apiKey, date } = body;

  // Resolve API key: user-supplied → env var
  const resolvedKey = apiKey?.trim() || GEMINI_API_KEY_ENV;
  if (!resolvedKey) {
    return NextResponse.json(
      { error: 'Gemini API key chưa được cấu hình. Vui lòng nhập trong Cài đặt hoặc đặt biến môi trường GEMINI_API_KEY.' },
      { status: 400 }
    );
  }

  if (!articles || articles.length === 0) {
    return NextResponse.json({ error: 'No articles provided' }, { status: 400 });
  }

  const lang = preferences.summaryLanguage === 'vi' ? 'tiếng Việt' : 'English';
  const favCats =
    preferences.favoriteCategories.length > 0
      ? preferences.favoriteCategories.join(', ')
      : 'tất cả chủ đề';

  const likedArticles = articles.filter(a => a.isLiked);
  const likedNote =
    likedArticles.length > 0
      ? `\nNgười dùng đặc biệt quan tâm đến: ${likedArticles.map(a => `"${a.title}"`).join('; ')}`
      : '';

  const articlesText = articles
    .slice(0, 50)
    .map(
      (a, i) =>
        `${i + 1}. [${a.category}] ${a.title}\n   Nguồn: ${a.sourceName}${a.description ? `\n   Tóm tắt: ${a.description.slice(0, 200)}` : ''}`
    )
    .join('\n\n');

  const prompt = `Bạn là trợ lý tóm tắt tin tức thông minh. Phân tích ${articles.length} bài báo từ ngày ${date} và tạo bản tóm tắt cá nhân hoá bằng ${lang}.

Chủ đề người dùng quan tâm: ${favCats}${likedNote}

CÁC BÀI BÁO:
${articlesText}

Trả về JSON hợp lệ (KHÔNG có markdown, chỉ JSON thuần) với cấu trúc:
{
  "personalizedNote": "Lời chào ngắn và nhận xét cá nhân hoá 2-3 câu, thân thiện",
  "topTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "highlights": [
    {
      "title": "Tiêu đề nhóm tin nổi bật",
      "summary": "Tóm tắt chi tiết 3-4 câu, đủ thông tin",
      "category": "Danh mục",
      "importance": "high"
    }
  ],
  "rawSummary": "Đoạn tóm tắt tổng quan 5-7 câu về bức tranh tin tức trong ngày"
}

Tạo 3-5 highlights. Ưu tiên chủ đề người dùng quan tâm. Viết bằng ${lang}.`;

  try {
    const text = await callGemini(resolvedKey, prompt);

    // Parse JSON — clean up any accidental markdown wrapping
    let parsed: Record<string, unknown>;
    try {
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]+\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Không thể parse JSON từ Gemini response');
      }
    }

    return NextResponse.json({
      ...parsed,
      model: GEMINI_MODEL,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Lỗi tạo tóm tắt: ${message}` }, { status: 500 });
  }
}

// Expose whether server has API key configured (for UI hints)
export async function GET() {
  return NextResponse.json({
    hasServerKey: !!GEMINI_API_KEY_ENV,
    model: GEMINI_MODEL,
    apiBase: GEMINI_API_BASE,
  });
}
