import { NextRequest, NextResponse } from 'next/server';

// Common RSS feed patterns for popular Vietnamese news sites
const RSS_PATTERNS: { pattern: RegExp; rssPath: string }[] = [
  { pattern: /vnexpress\.net/, rssPath: 'https://vnexpress.net/rss/tin-moi-nhat.rss' },
  { pattern: /tuoitre\.vn/, rssPath: 'https://tuoitre.vn/rss/tin-moi-nhat.rss' },
  { pattern: /thanhnien\.vn/, rssPath: 'https://thanhnien.vn/rss/home.rss' },
  { pattern: /dantri\.com\.vn/, rssPath: 'https://dantri.com.vn/rss/home.rss' },
  { pattern: /nhandan\.vn/, rssPath: 'https://nhandan.vn/rss/trangchu.rss' },
  { pattern: /baomoi\.com/, rssPath: 'https://baomoi.com/rss.epixml' },
  { pattern: /vietnamnet\.vn/, rssPath: 'https://vietnamnet.vn/rss/home.rss' },
  { pattern: /soha\.vn/, rssPath: 'https://soha.vn/rss.htm' },
  { pattern: /cafef\.vn/, rssPath: 'https://cafef.vn/rss/home.rss' },
  { pattern: /cafebiz\.vn/, rssPath: 'https://cafebiz.vn/rss/home.rss' },
  { pattern: /genk\.vn/, rssPath: 'https://genk.vn/rss/home.rss' },
  { pattern: /kenh14\.vn/, rssPath: 'https://kenh14.vn/rss/home.rss' },
  { pattern: /techcrunch\.com/, rssPath: 'https://techcrunch.com/feed/' },
  { pattern: /theverge\.com/, rssPath: 'https://www.theverge.com/rss/index.xml' },
  { pattern: /bbc\.com/, rssPath: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { pattern: /cnn\.com/, rssPath: 'http://rss.cnn.com/rss/edition.rss' },
  { pattern: /reuters\.com/, rssPath: 'https://feeds.reuters.com/reuters/topNews' },
];

const CANDIDATE_PATHS = [
  '/rss',
  '/feed',
  '/rss.xml',
  '/feed.xml',
  '/atom.xml',
  '/rss/home.rss',
  '/rss/tin-moi-nhat.rss',
  '/rss/index.xml',
  '/feeds/posts/default',
];

async function tryUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsReader/1.0)' },
    });
    if (!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    return ct.includes('xml') || ct.includes('rss') || ct.includes('atom');
  } catch {
    return false;
  }
}

async function discoverRssFromPage(domain: string): Promise<string | null> {
  try {
    const base = domain.startsWith('http') ? domain : `https://${domain}`;
    const res = await fetch(base, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsReader/1.0)' },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Look for <link> RSS tags
    const matches = html.matchAll(
      /<link[^>]+(?:type=["']application\/(?:rss|atom)\+xml["'])[^>]*href=["']([^"']+)["']/gi
    );
    for (const m of matches) {
      const href = m[1];
      if (href.startsWith('http')) return href;
      return new URL(href, base).href;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function POST(request: NextRequest) {
  const { domain } = await request.json();
  if (!domain) {
    return NextResponse.json({ error: 'Domain required' }, { status: 400 });
  }

  const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const base = `https://${cleanDomain}`;

  // 1. Check known patterns first
  for (const { pattern, rssPath } of RSS_PATTERNS) {
    if (pattern.test(cleanDomain)) {
      return NextResponse.json({ rssUrl: rssPath, discovered: true });
    }
  }

  // 2. Try common paths
  for (const path of CANDIDATE_PATHS) {
    const url = `${base}${path}`;
    if (await tryUrl(url)) {
      return NextResponse.json({ rssUrl: url, discovered: true });
    }
  }

  // 3. Try to discover from homepage HTML
  const discovered = await discoverRssFromPage(base);
  if (discovered) {
    return NextResponse.json({ rssUrl: discovered, discovered: true });
  }

  return NextResponse.json(
    { error: `Không tìm thấy RSS feed cho ${cleanDomain}. Vui lòng nhập RSS URL thủ công.` },
    { status: 404 }
  );
}
