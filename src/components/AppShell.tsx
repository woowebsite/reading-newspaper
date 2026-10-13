'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import NewsFeed from '@/components/NewsFeed';
import SourceManager from '@/components/SourceManager';
import DailySummaryView from '@/components/DailySummaryView';
import StatsView from '@/components/StatsView';
import SettingsModal from '@/components/SettingsModal';
import ToastContainer from '@/components/ToastContainer';
import ArticleCard from '@/components/ArticleCard';

import { filterArticlesByActiveSources } from '@/lib/storage';

const TAB_TITLES: Record<string, string> = {
  feed: 'Tin tức',
  summary: 'Tóm tắt AI',
  sources: 'Nguồn tin',
  saved: 'Đã lưu',
  stats: 'Thống kê',
};

export default function AppShell() {
  const { state, dispatch, fetchAllFeeds } = useApp();
  const {
    activeTab, articles, sources, isLoading, isFetching, fetchProgress,
    searchQuery, showSettings
  } = state;

  const activeArticles = useMemo(
    () => filterArticlesByActiveSources(articles, sources),
    [articles, sources]
  );

  const savedArticles = useMemo(() => {
    const seen = new Set<string>();
    return activeArticles
      .filter(a => a.isSaved)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .filter(a => {
        if (!a.id || seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
  }, [activeArticles]);

  const unreadCount = activeArticles.filter(a => !a.isRead).length;

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: '16px'
      }}>
        <div style={{ fontSize: '48px' }}>📰</div>
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Đang khởi động...</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <main className="app-main">
        {/* Header */}
        <header className="app-header">
          <span className="header-title">
            {TAB_TITLES[activeTab] || 'Reading Newspaper'}
          </span>

          <div className="header-spacer" />

          {/* Search */}
          <div className="header-search">
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm bài báo..."
              value={searchQuery}
              onChange={e => dispatch({ type: 'SET_SEARCH', query: e.target.value })}
              id="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => dispatch({ type: 'SET_SEARCH', query: '' })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <div style={{
              background: 'var(--accent-primary)',
              color: 'white',
              borderRadius: '999px',
              padding: '2px 10px',
              fontSize: '12px',
              fontWeight: 700,
            }}>
              {unreadCount} chưa đọc
            </div>
          )}

          {/* Fetch button */}
          <button
            className="btn-icon"
            onClick={fetchAllFeeds}
            disabled={isFetching}
            title="Tải tin mới"
          >
            {isFetching
              ? <span className="spinner" style={{ width: 14, height: 14 }} />
              : '⟳'}
          </button>

          {/* Settings */}
          <button
            className="btn-icon"
            onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
            title="Cài đặt"
          >
            ⚙️
          </button>
        </header>

        {/* Progress bar when fetching */}
        {isFetching && (
          <div className="progress-bar" style={{ borderRadius: 0, height: '2px' }}>
            <div className="progress-fill" style={{ width: `${fetchProgress}%` }} />
          </div>
        )}

        {/* Content */}
        <div className="content-area">
          {activeTab === 'feed' && <NewsFeed />}
          {activeTab === 'summary' && <DailySummaryView />}
          {activeTab === 'sources' && <SourceManager />}
          {activeTab === 'stats' && <StatsView />}
          {activeTab === 'saved' && (
            <div>
              <div className="section-header">
                <div>
                  <h1 className="section-title">Bài đã lưu</h1>
                  <p className="section-subtitle">{savedArticles.length} bài đang lưu</p>
                </div>
              </div>
              {savedArticles.length > 0 ? (
                <div className="grid-feed">
                  {savedArticles.map(article => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🔖</div>
                  <h2 className="empty-title">Chưa lưu bài nào</h2>
                  <p className="empty-subtitle">
                    Nhấn 📌 trên bài báo để lưu đọc sau
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showSettings && <SettingsModal />}

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
}
