import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { createHash } from 'crypto';

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure', 'content:encoded'],
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; NewsReader/1.0)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  timeout: 15000,
});

interface FeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  summary?: string;
  content?: string;
  contentSnippet?: string;
  author?: string;
  creator?: string;
  categories?: string[];
  enclosure?: { url?: string; type?: string };
  'media:content'?: { $?: { url?: string } } | string;
  'media:thumbnail'?: { $?: { url?: string } } | string;
  'content:encoded'?: string;
}

function stableId(url: string): string {
  return createHash('md5').update(url).digest('hex').slice(0, 24);
}

function safeString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  // Objects (like Cheerio nodes) return empty
  return '';
}

function extractImageUrl(item: FeedItem): string | undefined {
  // Try different image sources
  const mediaThumbnail = item['media:thumbnail'];
  if (mediaThumbnail && typeof mediaThumbnail === 'object' && !Array.isArray(mediaThumbnail)) {
    const url = (mediaThumbnail as { $?: { url?: string } })?.['$']?.url;
    if (url && typeof url === 'string') return url;
  }
  const mediaContent = item['media:content'];
  if (mediaContent && typeof mediaContent === 'object' && !Array.isArray(mediaContent)) {
    const url = (mediaContent as { $?: { url?: string } })?.['$']?.url;
    if (url && typeof url === 'string') return url;
  }
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) return item.enclosure.url;

  // Try extracting from content
  const contentEncoded = item['content:encoded'];
  const content = (typeof contentEncoded === 'string' ? contentEncoded : '') ||
    safeString(item.content) || safeString(item.summary) || '';
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];

  return undefined;
}

function extractDescription(item: FeedItem): string {
  const contentEncoded = item['content:encoded'];
  const raw = item.contentSnippet ||
    safeString(item.summary) ||
    safeString(item.content) ||
    (typeof contentEncoded === 'string' ? contentEncoded : '') || '';
  return raw.replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').trim().slice(0, 400);
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rssUrl = searchParams.get('url');
  const sourceId = searchParams.get('sourceId') || 'unknown';
  const sourceName = searchParams.get('sourceName') || 'Unknown';
  const sourceDomain = searchParams.get('domain') || '';

  if (!rssUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const feed = await parser.parseURL(rssUrl);

    const seenIds = new Set<string>();
    const articles = (feed.items || []).slice(0, 30).map((item: FeedItem) => {
      const title = safeString(item.title) || 'Không có tiêu đề';
      const url = safeString(item.link) || '';

      // Stable ID based on URL; fallback to title+source
      const idBase = url || `${sourceId}:${title}`;
      let id = stableId(idBase);
      // Ensure uniqueness within this batch
      let suffix = 0;
      while (seenIds.has(id)) {
        suffix++;
        id = stableId(`${idBase}:${suffix}`);
      }
      seenIds.add(id);

      // Sanitize categories - ensure strings only
      const rawCats = item.categories || [];
      const categories = rawCats.filter((c): c is string => typeof c === 'string');

      return {
        id,
        sourceId: safeString(sourceId),
        sourceName: safeString(sourceName),
        sourceDomain: safeString(sourceDomain),
        title,
        description: extractDescription(item),
        url,
        imageUrl: extractImageUrl(item),
        author: safeString(item.author || item.creator),
        publishedAt: safeString(item.isoDate || item.pubDate) || new Date().toISOString(),
        category: categories[0] || 'Khác',
        tags: categories,
        isRead: false,
        isSaved: false,
        isLiked: false,
      };
    });

    return NextResponse.json({
      sourceId,
      feedTitle: feed.title,
      articles,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch RSS feed: ${message}`, sourceId },
      { status: 500 }
    );
  }
}
