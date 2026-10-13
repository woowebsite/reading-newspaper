// ─────────────────────────────────────────────
//  Core domain types for Reading Newspaper App
// ─────────────────────────────────────────────

export interface NewsSource {
  id: string;
  domain: string;
  name: string;
  rssUrl: string;
  favicon?: string;
  category: string;
  isActive: boolean;
  addedAt: string;
  lastFetched?: string;
  fetchStatus: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
}

export interface NewsArticle {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceDomain: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  imageUrl?: string;
  author?: string;
  publishedAt: string;
  category: string;
  tags: string[];
  // Reading tracking
  isRead: boolean;
  readAt?: string;
  readDuration?: number; // seconds
  isSaved: boolean;
  isLiked: boolean;
}

export interface ReadingSession {
  articleId: string;
  startTime: string;
  endTime?: string;
  duration: number; // seconds
  scrollDepth: number; // percentage
  completed: boolean;
}

export interface UserPreferences {
  favoriteCategories: string[];
  favoriteSourceIds: string[];
  likedArticleIds: string[];
  savedArticleIds: string[];
  dislikedCategories: string[];
  preferredReadingTime: 'morning' | 'afternoon' | 'evening' | 'night' | 'all';
  summaryLanguage: 'vi' | 'en';
  geminiApiKey?: string;
  summaryTime: string; // HH:mm
  notificationsEnabled: boolean;
}

export interface DailySummary {
  id: string;
  date: string;
  generatedAt: string;
  totalArticles: number;
  readArticles: number;
  topTopics: string[];
  highlights: SummaryHighlight[];
  personalizedNote: string;
  rawSummary: string;
  sources: string[];
}

export interface SummaryHighlight {
  title: string;
  summary: string;
  articleIds: string[];
  category: string;
  importance: 'high' | 'medium' | 'low';
}

export interface ReadingStats {
  totalRead: number;
  totalSaved: number;
  totalLiked: number;
  averageReadTime: number;
  topCategories: { category: string; count: number }[];
  topSources: { sourceId: string; sourceName: string; count: number }[];
  readingStreak: number;
  lastReadDate: string;
  weeklyActivity: { date: string; count: number }[];
}

export interface FetchedFeed {
  sourceId: string;
  articles: Omit<NewsArticle, 'isRead' | 'readAt' | 'readDuration' | 'isSaved' | 'isLiked'>[];
  fetchedAt: string;
  error?: string;
}

export type AppTab = 'feed' | 'sources' | 'summary' | 'saved' | 'stats';
export type Theme = 'dark' | 'light';

export const NEWS_CATEGORIES = [
  'Thời sự', 'Kinh tế', 'Thế giới', 'Công nghệ',
  'Thể thao', 'Giải trí', 'Sức khỏe', 'Giáo dục',
  'Pháp luật', 'Du lịch', 'Khoa học', 'Văn hóa',
  'Bất động sản', 'Xe cộ', 'Môi trường', 'Khác'
] as const;

export type NewsCategory = typeof NEWS_CATEGORIES[number];
