import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  apiKey: string;
  date: string;
}

export async function POST(request: NextRequest) {
  const body: SummaryRequest = await request.json();
  const { articles, preferences, apiKey, date } = body;

  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key required' }, { status: 400 });
  }

  if (!articles || articles.length === 0) {
    return NextResponse.json({ error: 'No articles provided' }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const lang = preferences.summaryLanguage === 'vi' ? 'tiếng Việt' : 'English';
    const favCats =
      preferences.favoriteCategories.length > 0
        ? preferences.favoriteCategories.join(', ')
        : 'tất cả';

    const likedArticles = articles.filter(a => a.isLiked);
    const likedNote =
      likedArticles.length > 0
        ? `\nNgười dùng đặc biệt quan tâm: ${likedArticles.map(a => a.title).join('; ')}`
        : '';

    const articlesText = articles
      .slice(0, 50)
      .map(
        (a, i) =>
          `${i + 1}. [${a.category}] ${a.title}\n   Nguồn: ${a.sourceName}\n   Mô tả: ${a.description.slice(0, 200)}`
      )
      .join('\n\n');

    const prompt = `
Bạn là trợ lý tóm tắt tin tức thông minh. Hãy phân tích ${articles.length} bài báo dưới đây từ ngày ${date} và tạo bản tóm tắt cá nhân hoá bằng ${lang}.

Chủ đề người dùng quan tâm: ${favCats}${likedNote}

CÁC BÀI BÁO:
${articlesText}

Hãy trả về JSON với cấu trúc sau (KHÔNG có markdown code block, chỉ JSON thuần):
{
  "personalizedNote": "Lời chào và nhận xét cá nhân hoá cho người dùng (2-3 câu)",
  "topTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "highlights": [
    {
      "title": "Tiêu đề nhóm tin nổi bật",
      "summary": "Tóm tắt chi tiết 3-4 câu",
      "category": "Danh mục",
      "importance": "high|medium|low",
      "articleIndices": [0, 1, 2]
    }
  ],
  "rawSummary": "Đoạn tóm tắt tổng quan 5-7 câu về bức tranh tin tức trong ngày"
}

Tạo 3-5 highlights, ưu tiên các tin thuộc chủ đề người dùng quan tâm. Sắp xếp theo mức độ quan trọng.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to extract JSON from text
      const jsonMatch = text.match(/\{[\s\S]+\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    }

    return NextResponse.json({
      ...parsed,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `AI summary failed: ${message}` }, { status: 500 });
  }
}
