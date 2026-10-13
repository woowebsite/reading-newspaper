import { NewsSource, NewsArticle, UserPreferences, DailySummary, ReadingSession } from '@/types';

const STORAGE_KEYS = {
  SOURCES: 'news_sources',
  ARTICLES: 'news_articles',
  PREFERENCES: 'user_preferences',
  SUMMARIES: 'daily_summaries',
  SESSIONS: 'reading_sessions',
  LAST_FETCH: 'last_fetch_time',
} as const;

// ── Sources ──────────────────────────────────────────────────────────────────

export function getSources(): NewsSource[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SOURCES);
    return raw ? JSON.parse(raw) : getDefaultSources();
  } catch {
    return getDefaultSources();
  }
}

export function saveSources(sources: NewsSource[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(sources));
}

export function addSource(source: NewsSource): void {
  const sources = getSources();
  const exists = sources.find(s => s.domain === source.domain);
  if (!exists) {
    sources.push(source);
    saveSources(sources);
  }
}

export function updateSource(id: string, updates: Partial<NewsSource>): void {
  const sources = getSources();
  const idx = sources.findIndex(s => s.id === id);
  if (idx !== -1) {
    sources[idx] = { ...sources[idx], ...updates };
    saveSources(sources);
  }
}

export function removeSource(id: string): void {
  const sources = getSources().filter(s => s.id !== id);
  saveSources(sources);
}

// ── Articles ─────────────────────────────────────────────────────────────────

function safeStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return '';
}

function sanitizeArticle(a: NewsArticle): NewsArticle {
  return {
    ...a,
    id: safeStr(a.id) || Math.random().toString(36).slice(2),
    title: safeStr(a.title) || 'Không có tiêu đề',
    description: safeStr(a.description),
    url: safeStr(a.url),
    author: a.author !== undefined ? safeStr(a.author) : undefined,
    sourceName: safeStr(a.sourceName),
    sourceDomain: safeStr(a.sourceDomain),
    sourceId: safeStr(a.sourceId),
    category: safeStr(a.category) || 'Khác',
    publishedAt: safeStr(a.publishedAt) || new Date().toISOString(),
    imageUrl: a.imageUrl !== undefined ? safeStr(a.imageUrl) || undefined : undefined,
    tags: Array.isArray(a.tags) ? a.tags.filter((t): t is string => typeof t === 'string') : [],
  };
}

export function getArticles(): NewsArticle[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ARTICLES);
    const parsed: NewsArticle[] = raw ? JSON.parse(raw) : [];
    return parsed.map(sanitizeArticle);
  } catch {
    return [];
  }
}

export function saveArticles(articles: NewsArticle[]): void {
  if (typeof window === 'undefined') return;
  // Keep only last 500 articles to avoid storage bloat
  const trimmed = articles.slice(-500);
  localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(trimmed));
}

export function mergeArticles(newArticles: NewsArticle[]): void {
  const existing = getArticles();
  const existingIds = new Set(existing.map(a => a.id));
  const toAdd = newArticles.filter(a => !existingIds.has(a.id));
  saveArticles([...existing, ...toAdd]);
}

export function updateArticle(id: string, updates: Partial<NewsArticle>): void {
  const articles = getArticles();
  const idx = articles.findIndex(a => a.id === id);
  if (idx !== -1) {
    articles[idx] = { ...articles[idx], ...updates };
    saveArticles(articles);
  }
}

// ── Preferences ───────────────────────────────────────────────────────────────

export function getPreferences(): UserPreferences {
  if (typeof window === 'undefined') return getDefaultPreferences();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return raw ? { ...getDefaultPreferences(), ...JSON.parse(raw) } : getDefaultPreferences();
  } catch {
    return getDefaultPreferences();
  }
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
}

export function updatePreferences(updates: Partial<UserPreferences>): void {
  const prefs = getPreferences();
  savePreferences({ ...prefs, ...updates });
}

// ── Summaries ─────────────────────────────────────────────────────────────────

export function getSummaries(): DailySummary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSummary(summary: DailySummary): void {
  const summaries = getSummaries();
  const idx = summaries.findIndex(s => s.date === summary.date);
  if (idx !== -1) {
    summaries[idx] = summary;
  } else {
    summaries.push(summary);
  }
  // Keep last 30 days
  const trimmed = summaries.slice(-30);
  localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(trimmed));
}

export function getTodaySummary(): DailySummary | null {
  const today = new Date().toISOString().split('T')[0];
  const summaries = getSummaries();
  return summaries.find(s => s.date === today) || null;
}

// ── Reading Sessions ──────────────────────────────────────────────────────────

export function getSessions(): ReadingSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSession(session: ReadingSession): void {
  const sessions = getSessions();
  sessions.push(session);
  // Keep last 1000 sessions
  const trimmed = sessions.slice(-1000);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(trimmed));
}

// ── Last Fetch ────────────────────────────────────────────────────────────────

export function getLastFetchTime(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.LAST_FETCH);
}

export function setLastFetchTime(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LAST_FETCH, new Date().toISOString());
}

// ── Defaults ──────────────────────────────────────────────────────────────────

function getDefaultPreferences(): UserPreferences {
  return {
    favoriteCategories: [],
    favoriteSourceIds: [],
    likedArticleIds: [],
    savedArticleIds: [],
    dislikedCategories: [],
    preferredReadingTime: 'all',
    summaryLanguage: 'vi',
    summaryTime: '07:00',
    notificationsEnabled: false,
  };
}

function getDefaultSources(): NewsSource[] {
  return [
    {
      id: 'vnexpress',
      domain: 'vnexpress.net',
      name: 'VnExpress',
      rssUrl: 'https://vnexpress.net/rss/tin-moi-nhat.rss',
      favicon: 'https://f8-zpcloud.zdn.vn/7669421940870862135/83e8bf3e8b0245978113.jpg',
      category: 'Thời sự',
      isActive: true,
      addedAt: new Date().toISOString(),
      fetchStatus: 'idle',
    },
    {
      id: 'tuoitre',
      domain: 'tuoitre.vn',
      name: 'Tuổi Trẻ',
      rssUrl: 'https://tuoitre.vn/rss/tin-moi-nhat.rss',
      favicon: 'https://static.tuoitre.vn/tto/i/favicon.png',
      category: 'Thời sự',
      isActive: true,
      addedAt: new Date().toISOString(),
      fetchStatus: 'idle',
    },
    {
      id: 'thanhnien',
      domain: 'thanhnien.vn',
      name: 'Thanh Niên',
      rssUrl: 'https://thanhnien.vn/rss/home.rss',
      category: 'Thời sự',
      isActive: true,
      addedAt: new Date().toISOString(),
      fetchStatus: 'idle',
    },
    {
      id: 'dantri',
      domain: 'dantri.com.vn',
      name: 'Dân Trí',
      rssUrl: 'https://dantri.com.vn/rss/home.rss',
      category: 'Thời sự',
      isActive: true,
      addedAt: new Date().toISOString(),
      fetchStatus: 'idle',
    },
    {
      id: 'thegioididong',
      domain: 'thegioididong.com',
      name: 'Thế Giới Di Động Blog',
      rssUrl: 'https://www.thegioididong.com/tin-tuc/rss',
      category: 'Công nghệ',
      isActive: false,
      addedAt: new Date().toISOString(),
      fetchStatus: 'idle',
    },
  ];
}

// ── Stats helpers ─────────────────────────────────────────────────────────────

export function computeReadingStats() {
  const articles = getArticles();
  const sessions = getSessions();
  const prefs = getPreferences();

  const readArticles = articles.filter(a => a.isRead);
  const avgDuration =
    sessions.length > 0
      ? sessions.reduce((s, r) => s + r.duration, 0) / sessions.length
      : 0;

  const catMap = new Map<string, number>();
  readArticles.forEach(a => {
    catMap.set(a.category, (catMap.get(a.category) || 0) + 1);
  });

  const srcMap = new Map<string, { name: string; count: number }>();
  readArticles.forEach(a => {
    const prev = srcMap.get(a.sourceId) || { name: a.sourceName, count: 0 };
    srcMap.set(a.sourceId, { name: a.sourceName, count: prev.count + 1 });
  });

  // 7-day activity
  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const count = readArticles.filter(a => a.readAt?.startsWith(dateStr)).length;
    return { date: dateStr, count };
  });

  return {
    totalRead: readArticles.length,
    totalSaved: prefs.savedArticleIds.length,
    totalLiked: prefs.likedArticleIds.length,
    averageReadTime: Math.round(avgDuration),
    topCategories: Array.from(catMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    topSources: Array.from(srcMap.entries())
      .map(([sourceId, { name, count }]) => ({ sourceId, sourceName: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    readingStreak: 0, // simplified
    lastReadDate: readArticles[readArticles.length - 1]?.readAt || '',
    weeklyActivity,
  };
}
