'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import {
  NewsSource, NewsArticle, UserPreferences, DailySummary, ReadingStats, AppTab
} from '@/types';
import {
  getSources, saveSources, addSource, updateSource, removeSource,
  getArticles, mergeArticles, updateArticle as updateArticleStorage,
  getPreferences, updatePreferences,
  getSummaries, saveSummary, getTodaySummary,
  computeReadingStats, setLastFetchTime, getLastFetchTime,
  filterArticlesByActiveSources
} from '@/lib/storage';

// ─── State ────────────────────────────────────────────────────────────────────
interface AppState {
  sources: NewsSource[];
  articles: NewsArticle[];
  preferences: UserPreferences;
  summaries: DailySummary[];
  stats: ReadingStats;
  activeTab: AppTab;
  isLoading: boolean;
  isFetching: boolean;
  fetchProgress: number;
  searchQuery: string;
  selectedCategory: string;
  selectedSourceId: string;
  toasts: Toast[];
  showSettings: boolean;
  showAddSource: boolean;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ─── Actions ──────────────────────────────────────────────────────────────────
type Action =
  | { type: 'SET_TAB'; tab: AppTab }
  | { type: 'SET_SOURCES'; sources: NewsSource[] }
  | { type: 'SET_ARTICLES'; articles: NewsArticle[] }
  | { type: 'MERGE_ARTICLES'; articles: NewsArticle[] }
  | { type: 'UPDATE_ARTICLE'; id: string; updates: Partial<NewsArticle> }
  | { type: 'SET_PREFERENCES'; prefs: UserPreferences }
  | { type: 'SET_SUMMARIES'; summaries: DailySummary[] }
  | { type: 'ADD_SUMMARY'; summary: DailySummary }
  | { type: 'SET_STATS'; stats: ReadingStats }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_FETCHING'; fetching: boolean; progress?: number }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'SET_CATEGORY'; category: string }
  | { type: 'SET_SOURCE_FILTER'; sourceId: string }
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'TOGGLE_SETTINGS'; show?: boolean }
  | { type: 'TOGGLE_ADD_SOURCE'; show?: boolean }
  | { type: 'UPDATE_SOURCE'; id: string; updates: Partial<NewsSource> }
  | { type: 'REMOVE_SOURCE'; id: string }
  | { type: 'ADD_SOURCE'; source: NewsSource };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TAB': return { ...state, activeTab: action.tab };
    case 'SET_SOURCES': return { ...state, sources: action.sources };
    case 'ADD_SOURCE': return { ...state, sources: [...state.sources, action.source] };
    case 'UPDATE_SOURCE':
      return {
        ...state,
        sources: state.sources.map(s => s.id === action.id ? { ...s, ...action.updates } : s)
      };
    case 'REMOVE_SOURCE':
      return { ...state, sources: state.sources.filter(s => s.id !== action.id) };
    case 'SET_ARTICLES': {
      const seen = new Set<string>();
      const unique = action.articles.filter(a => {
        if (!a.id || seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
      return { ...state, articles: unique };
    }
    case 'MERGE_ARTICLES': {
      const existingIds = new Set(state.articles.map(a => a.id));
      const existingUrls = new Set(state.articles.map(a => a.url?.trim().toLowerCase()).filter(Boolean));
      const newOnes: NewsArticle[] = [];
      for (const a of action.articles) {
        const normUrl = a.url ? a.url.trim().toLowerCase() : '';
        if (normUrl && existingUrls.has(normUrl)) continue;
        let id = a.id;
        if (existingIds.has(id)) {
          id = `${id}-${Math.random().toString(36).slice(2, 7)}`;
        }
        existingIds.add(id);
        if (normUrl) existingUrls.add(normUrl);
        newOnes.push({ ...a, id });
      }
      return { ...state, articles: [...state.articles, ...newOnes] };
    }
    case 'UPDATE_ARTICLE':
      return {
        ...state,
        articles: state.articles.map(a => a.id === action.id ? { ...a, ...action.updates } : a)
      };
    case 'SET_PREFERENCES': return { ...state, preferences: action.prefs };
    case 'SET_SUMMARIES': return { ...state, summaries: action.summaries };
    case 'ADD_SUMMARY':
      return {
        ...state,
        summaries: [...state.summaries.filter(s => s.date !== action.summary.date), action.summary]
      };
    case 'SET_STATS': return { ...state, stats: action.stats };
    case 'SET_LOADING': return { ...state, isLoading: action.loading };
    case 'SET_FETCHING': return {
      ...state,
      isFetching: action.fetching,
      fetchProgress: action.progress ?? state.fetchProgress
    };
    case 'SET_SEARCH': return { ...state, searchQuery: action.query };
    case 'SET_CATEGORY': return { ...state, selectedCategory: action.category };
    case 'SET_SOURCE_FILTER': return { ...state, selectedSourceId: action.sourceId };
    case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, action.toast] };
    case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) };
    case 'TOGGLE_SETTINGS':
      return { ...state, showSettings: action.show ?? !state.showSettings };
    case 'TOGGLE_ADD_SOURCE':
      return { ...state, showAddSource: action.show ?? !state.showAddSource };
    default: return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  fetchAllFeeds: () => Promise<void>;
  generateSummary: () => Promise<void>;
  markRead: (articleId: string) => void;
  toggleLike: (articleId: string) => void;
  toggleSave: (articleId: string) => void;
  addNewsSource: (domain: string, rssUrl?: string) => Promise<void>;
  deleteSource: (id: string) => void;
  toggleSourceActive: (id: string) => void;
  showToast: (message: string, type?: Toast['type']) => void;
  refreshStats: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    sources: [],
    articles: [],
    preferences: {} as UserPreferences,
    summaries: [],
    stats: {
      totalRead: 0,
      totalSaved: 0,
      totalLiked: 0,
      averageReadTime: 0,
      topCategories: [],
      topSources: [],
      readingStreak: 0,
      lastReadDate: '',
      weeklyActivity: [],
    },
    activeTab: 'feed',
    isLoading: true,
    isFetching: false,
    fetchProgress: 0,
    searchQuery: '',
    selectedCategory: '',
    selectedSourceId: '',
    toasts: [],
    showSettings: false,
    showAddSource: false,
  });

  // Initialize from localStorage
  useEffect(() => {
    const sources = getSources();
    const articles = getArticles();
    const preferences = getPreferences();
    const summaries = getSummaries();
    const stats = computeReadingStats();
    dispatch({ type: 'SET_SOURCES', sources });
    dispatch({ type: 'SET_ARTICLES', articles });
    dispatch({ type: 'SET_PREFERENCES', prefs: preferences });
    dispatch({ type: 'SET_SUMMARIES', summaries });
    dispatch({ type: 'SET_STATS', stats });
    dispatch({ type: 'SET_LOADING', loading: false });
  }, []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    dispatch({ type: 'ADD_TOAST', toast: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 4000);
  }, []);

  const refreshStats = useCallback(() => {
    const stats = computeReadingStats();
    dispatch({ type: 'SET_STATS', stats });
  }, []);

  const fetchAllFeeds = useCallback(async () => {
    const sources = getSources().filter(s => s.isActive);
    if (sources.length === 0) {
      showToast('Chưa có nguồn tin nào được kích hoạt', 'info');
      return;
    }

    dispatch({ type: 'SET_FETCHING', fetching: true, progress: 0 });
    let fetched = 0;
    let totalNew = 0;

    for (const source of sources) {
      dispatch({ type: 'UPDATE_SOURCE', id: source.id, updates: { fetchStatus: 'loading' } });
      updateSource(source.id, { fetchStatus: 'loading' });

      try {
        const params = new URLSearchParams({
          url: source.rssUrl,
          sourceId: source.id,
          sourceName: source.name,
          domain: source.domain,
        });
        const res = await fetch(`/api/fetch-feed?${params}`);
        const data = await res.json();

        if (!res.ok || data.error) throw new Error(data.error || 'Fetch failed');

        const newArticles: NewsArticle[] = data.articles.map((a: Omit<NewsArticle, 'isRead' | 'readAt' | 'readDuration' | 'isSaved' | 'isLiked'>) => ({
          ...a,
          isRead: false,
          isSaved: false,
          isLiked: false,
        }));

        mergeArticles(newArticles);
        dispatch({ type: 'MERGE_ARTICLES', articles: newArticles });
        totalNew += newArticles.length;

        dispatch({
          type: 'UPDATE_SOURCE', id: source.id,
          updates: { fetchStatus: 'success', lastFetched: new Date().toISOString() }
        });
        updateSource(source.id, { fetchStatus: 'success', lastFetched: new Date().toISOString() });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        dispatch({ type: 'UPDATE_SOURCE', id: source.id, updates: { fetchStatus: 'error', errorMessage: msg } });
        updateSource(source.id, { fetchStatus: 'error', errorMessage: msg });
      }

      fetched++;
      dispatch({ type: 'SET_FETCHING', fetching: true, progress: Math.round((fetched / sources.length) * 100) });
    }

    setLastFetchTime();
    dispatch({ type: 'SET_FETCHING', fetching: false, progress: 100 });
    showToast(`Đã tải ${totalNew} bài mới từ ${sources.length} nguồn`, 'success');
    refreshStats();
  }, [showToast, refreshStats]);

  const generateSummary = useCallback(async () => {
    const prefs = getPreferences();

    // Check if server has API key configured
    let hasServerKey = false;
    try {
      const statusRes = await fetch('/api/summarize');
      const statusData = await statusRes.json();
      hasServerKey = statusData.hasServerKey === true;
    } catch {
      // ignore — will fall through to UI key check
    }

    // Only require UI key if server doesn't have one
    if (!hasServerKey && !prefs.geminiApiKey) {
      showToast('Vui lòng nhập Gemini API key trong Cài đặt', 'error');
      dispatch({ type: 'TOGGLE_SETTINGS', show: true });
      return;
    }

    const allArticles = getArticles();
    const currentSources = getSources();
    const articles = filterArticlesByActiveSources(allArticles, currentSources);
    const today = new Date().toISOString().split('T')[0];
    // Include all recent articles (today + yesterday to handle timezone offsets)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const recentArticles = articles
      .filter(a => a.publishedAt.startsWith(today) || a.publishedAt.startsWith(yesterdayStr))
      .slice(0, 60);
    const todayArticles = recentArticles.length > 0 ? recentArticles : articles.slice(-40);

    if (todayArticles.length === 0) {
      showToast('Chưa có bài báo nào để tóm tắt. Hãy tải tin tức trước.', 'info');
      return;
    }

    showToast(`Đang tạo tóm tắt AI cho ${todayArticles.length} bài...`, 'info');
    dispatch({ type: 'SET_LOADING', loading: true });

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: todayArticles.map(a => ({
            title: a.title,
            description: a.description,
            category: a.category,
            sourceName: a.sourceName,
            isLiked: a.isLiked,
            isRead: a.isRead,
          })),
          preferences: {
            favoriteCategories: prefs.favoriteCategories,
            summaryLanguage: prefs.summaryLanguage,
          },
          // Only send UI key if server doesn't have one
          apiKey: hasServerKey ? undefined : prefs.geminiApiKey,
          date: today,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const summary: DailySummary = {
        id: `summary-${today}`,
        date: today,
        generatedAt: data.generatedAt,
        totalArticles: todayArticles.length,
        readArticles: todayArticles.filter(a => a.isRead).length,
        topTopics: data.topTopics || [],
        highlights: data.highlights || [],
        personalizedNote: data.personalizedNote || '',
        rawSummary: data.rawSummary || '',
        sources: [...new Set(todayArticles.map(a => a.sourceName))],
      };

      saveSummary(summary);
      dispatch({ type: 'ADD_SUMMARY', summary });
      showToast(`Đã tạo tóm tắt! (${data.model || 'Gemini'})`, 'success');
      dispatch({ type: 'SET_TAB', tab: 'summary' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showToast(`Lỗi tạo tóm tắt: ${msg}`, 'error');
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, [showToast]);

  const markRead = useCallback((articleId: string) => {
    const readAt = new Date().toISOString();
    updateArticleStorage(articleId, { isRead: true, readAt });
    dispatch({ type: 'UPDATE_ARTICLE', id: articleId, updates: { isRead: true, readAt } });
    refreshStats();
  }, [refreshStats]);

  const toggleLike = useCallback((articleId: string) => {
    const articles = getArticles();
    const article = articles.find(a => a.id === articleId);
    if (!article) return;
    const isLiked = !article.isLiked;
    updateArticleStorage(articleId, { isLiked });
    dispatch({ type: 'UPDATE_ARTICLE', id: articleId, updates: { isLiked } });

    const prefs = getPreferences();
    const liked = new Set(prefs.likedArticleIds);
    if (isLiked) liked.add(articleId); else liked.delete(articleId);
    updatePreferences({ likedArticleIds: Array.from(liked) });

    // Update fav categories
    if (isLiked && article.category) {
      const favCats = new Set(prefs.favoriteCategories);
      favCats.add(article.category);
      updatePreferences({ favoriteCategories: Array.from(favCats) });
    }
    refreshStats();
  }, [refreshStats]);

  const toggleSave = useCallback((articleId: string) => {
    const articles = getArticles();
    const article = articles.find(a => a.id === articleId);
    if (!article) return;
    const isSaved = !article.isSaved;
    updateArticleStorage(articleId, { isSaved });
    dispatch({ type: 'UPDATE_ARTICLE', id: articleId, updates: { isSaved } });

    const prefs = getPreferences();
    const saved = new Set(prefs.savedArticleIds);
    if (isSaved) saved.add(articleId); else saved.delete(articleId);
    updatePreferences({ savedArticleIds: Array.from(saved) });
    refreshStats();
  }, [refreshStats]);

  const addNewsSource = useCallback(async (domain: string, rssUrl?: string) => {
    const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Check duplicate
    const sources = getSources();
    if (sources.find(s => s.domain === cleanDomain)) {
      showToast('Nguồn này đã tồn tại', 'error');
      return;
    }

    let finalRssUrl = rssUrl;

    if (!finalRssUrl) {
      showToast('Đang tìm RSS feed...', 'info');
      try {
        const res = await fetch('/api/discover-rss', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: cleanDomain }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        finalRssUrl = data.rssUrl;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        showToast(msg, 'error');
        return;
      }
    }

    const name = cleanDomain.split('.')[0].replace(/^www/, '').charAt(0).toUpperCase() +
      cleanDomain.split('.')[0].replace(/^www/, '').slice(1);

    const newSource: NewsSource = {
      id: cleanDomain.replace(/\./g, '-') + '-' + Date.now(),
      domain: cleanDomain,
      name,
      rssUrl: finalRssUrl!,
      category: 'Khác',
      isActive: true,
      addedAt: new Date().toISOString(),
      fetchStatus: 'idle',
    };

    addSource(newSource);
    dispatch({ type: 'ADD_SOURCE', source: newSource });
    showToast(`Đã thêm nguồn ${name}!`, 'success');
  }, [showToast]);

  const deleteSource = useCallback((id: string) => {
    removeSource(id);
    dispatch({ type: 'REMOVE_SOURCE', id });
    showToast('Đã xóa nguồn tin', 'info');
  }, [showToast]);

  const toggleSourceActive = useCallback((id: string) => {
    const sources = getSources();
    const source = sources.find(s => s.id === id);
    if (!source) return;
    const isActive = !source.isActive;
    updateSource(id, { isActive });
    dispatch({ type: 'UPDATE_SOURCE', id, updates: { isActive } });
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      fetchAllFeeds,
      generateSummary,
      markRead,
      toggleLike,
      toggleSave,
      addNewsSource,
      deleteSource,
      toggleSourceActive,
      showToast,
      refreshStats,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
