'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import ArticleCard from './ArticleCard';
import { NEWS_CATEGORIES } from '@/types';

const ALL = 'Tất cả';

export default function NewsFeed() {
  const { state, fetchAllFeeds } = useApp();
  const { articles, isFetching, fetchProgress, searchQuery, selectedCategory, selectedSourceId } = state;

  const [localCategory, setLocalCategory] = useState(ALL);
  const [showSaved, setShowSaved] = useState(false);
  const [showUnread, setShowUnread] = useState(false);
  const [sortByTime, setSortByTime] = useState(true);

  const filteredArticles = useMemo(() => {
    let result = [...articles];

    // Filter by saved
    if (showSaved) result = result.filter(a => a.isSaved);

    // Filter by unread
    if (showUnread) result = result.filter(a => !a.isRead);

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.sourceName.toLowerCase().includes(q)
      );
    }

    // Filter by category
    const cat = selectedCategory || localCategory;
    if (cat && cat !== ALL) {
      result = result.filter(a => a.category === cat);
    }

    // Filter by source
    if (selectedSourceId) {
      result = result.filter(a => a.sourceId === selectedSourceId);
    }

    // Sort
    result.sort((a, b) => {
      if (sortByTime) {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
      // Personalized: liked categories + unread first
      const aScore = (a.isLiked ? 10 : 0) + (a.isRead ? -5 : 3);
      const bScore = (b.isLiked ? 10 : 0) + (b.isRead ? -5 : 3);
      return bScore - aScore;
    });

    return result;
  }, [articles, searchQuery, selectedCategory, localCategory, selectedSourceId, showSaved, showUnread, sortByTime]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    map.set(ALL, articles.length);
    articles.forEach(a => map.set(a.category, (map.get(a.category) || 0) + 1));
    return map;
  }, [articles]);

  const activeCategories = useMemo(() => {
    const cats = new Set(articles.map(a => a.category));
    return [ALL, ...NEWS_CATEGORIES.filter(c => cats.has(c))];
  }, [articles]);

  if (articles.length === 0 && !isFetching) {
    return (
      <div>
        <div className="section-header">
          <div>
            <h1 className="section-title">Tin tức hôm nay</h1>
            <p className="section-subtitle">Chưa có bài báo nào. Hãy tải tin tức!</p>
          </div>
          <button className="btn btn-primary" onClick={fetchAllFeeds}>
            <span>⟳</span> Tải tin tức
          </button>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📰</div>
          <h2 className="empty-title">Chưa có bài báo nào</h2>
          <p className="empty-subtitle">
            Nhấn "Tải tin tức" để lấy bài mới từ các nguồn đã thêm,
            hoặc thêm nguồn mới trong tab <strong>Nguồn</strong>.
          </p>
          <button className="btn btn-primary" onClick={fetchAllFeeds}>
            ⟳ Tải ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Tin tức hôm nay</h1>
          <p className="section-subtitle">
            {filteredArticles.length} bài • {articles.filter(a => !a.isRead).length} chưa đọc
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className={`btn btn-sm btn-secondary ${showUnread ? 'filter-chip active' : ''}`}
            onClick={() => setShowUnread(!showUnread)}
          >
            {showUnread ? '✓' : ''} Chưa đọc
          </button>
          <button
            className={`btn btn-sm btn-secondary ${showSaved ? 'filter-chip active' : ''}`}
            onClick={() => setShowSaved(!showSaved)}
          >
            {showSaved ? '🔖' : '📌'} Đã lưu
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setSortByTime(!sortByTime)}
            title="Chuyển chế độ sắp xếp"
          >
            {sortByTime ? '🕐 Mới nhất' : '⭐ Gợi ý'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={fetchAllFeeds}
            disabled={isFetching}
          >
            {isFetching ? (
              <><span className="spinner" style={{ width: 14, height: 14 }} /> {fetchProgress}%</>
            ) : (
              '⟳ Tải tin'
            )}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {isFetching && (
        <div className="progress-bar" style={{ marginBottom: '16px' }}>
          <div className="progress-fill" style={{ width: `${fetchProgress}%` }} />
        </div>
      )}

      {/* Category filter */}
      <div className="filter-bar">
        {activeCategories.map(cat => (
          <button
            key={cat}
            className={`filter-chip ${(localCategory === cat && !selectedCategory) || (selectedCategory === cat) ? 'active' : ''}`}
            onClick={() => setLocalCategory(cat)}
          >
            {cat}
            <span style={{ marginLeft: '4px', opacity: 0.6, fontSize: '11px' }}>
              {categoryCounts.get(cat) || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Articles grid */}
      {filteredArticles.length > 0 ? (
        <div className="grid-feed">
          {filteredArticles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h2 className="empty-title">Không tìm thấy bài nào</h2>
          <p className="empty-subtitle">Thử thay đổi bộ lọc hoặc tải thêm tin tức</p>
        </div>
      )}
    </div>
  );
}
