'use client';

import React from 'react';
import { NewsArticle } from '@/types';
import { useApp } from '@/context/AppContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

function getCategoryClass(category: string): string {
  const map: Record<string, string> = {
    'Thời sự': 'cat-thoi-su',
    'Kinh tế': 'cat-kinh-te',
    'Thế giới': 'cat-the-gioi',
    'Công nghệ': 'cat-cong-nghe',
    'Thể thao': 'cat-the-thao',
    'Giải trí': 'cat-giai-tri',
    'Sức khỏe': 'cat-suc-khoe',
  };
  return map[category] || 'cat-default';
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'Thời sự': '📰', 'Kinh tế': '💹', 'Thế giới': '🌍',
    'Công nghệ': '💻', 'Thể thao': '⚽', 'Giải trí': '🎬',
    'Sức khỏe': '🏥', 'Giáo dục': '📚', 'Pháp luật': '⚖️',
    'Du lịch': '✈️', 'Khoa học': '🔬', 'Văn hóa': '🎭',
    'Bất động sản': '🏠', 'Xe cộ': '🚗', 'Môi trường': '🌿',
  };
  return map[category] || '📋';
}

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
  } catch {
    return '';
  }
}

interface ArticleCardProps {
  article: NewsArticle;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const { markRead, toggleLike, toggleSave } = useApp();

  const handleClick = () => {
    markRead(article.id);
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`article-card card-enter ${article.isRead ? 'is-read' : ''} ${article.isLiked ? 'is-liked' : ''}`}
    >
      {/* Thumbnail */}
      {article.imageUrl ? (
        <img
          src={article.imageUrl}
          alt={article.title}
          className="article-image"
          onError={e => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
          loading="lazy"
        />
      ) : (
        <div className="article-image-placeholder">
          {getCategoryEmoji(article.category)}
        </div>
      )}

      <div className="article-body">
        {/* Meta */}
        <div className="article-meta">
          <span className={`category-badge ${getCategoryClass(article.category)}`}>
            {article.category}
          </span>
          <span className="article-source">
            {article.sourceName}
          </span>
          <span className="article-time">
            {timeAgo(article.publishedAt)}
          </span>
        </div>

        {/* Title */}
        <h3 className="article-title" onClick={handleClick} style={{ cursor: 'pointer' }}>
          {article.title}
        </h3>

        {/* Description */}
        {article.description && (
          <p className="article-desc">{article.description}</p>
        )}

        {/* Actions */}
        <div className="article-actions">
          <button
            className={`action-btn ${article.isLiked ? 'active-like' : ''}`}
            onClick={e => { e.stopPropagation(); toggleLike(article.id); }}
            title={article.isLiked ? 'Bỏ thích' : 'Thích'}
          >
            {article.isLiked ? '🧡' : '🤍'}
          </button>

          <button
            className={`action-btn ${article.isSaved ? 'active-save' : ''}`}
            onClick={e => { e.stopPropagation(); toggleSave(article.id); }}
            title={article.isSaved ? 'Bỏ lưu' : 'Lưu lại'}
          >
            {article.isSaved ? '🔖' : '📌'}
          </button>

          {article.isRead && (
            <span className="action-btn active-read" title="Đã đọc">✓</span>
          )}

          <button
            className="read-more-btn"
            onClick={handleClick}
          >
            Đọc tiếp →
          </button>
        </div>
      </div>
    </div>
  );
}
