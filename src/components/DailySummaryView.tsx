'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { SummaryHighlight } from '@/types';

function ImportanceBadge({ importance }: { importance: 'high' | 'medium' | 'low' }) {
  const map = {
    high: { label: '🔥 Nổi bật', color: 'var(--accent-primary)' },
    medium: { label: '📌 Quan trọng', color: 'var(--yellow)' },
    low: { label: '📎 Tham khảo', color: 'var(--text-muted)' },
  };
  const { label, color } = map[importance];
  return (
    <span style={{ fontSize: '11px', color, fontWeight: 600 }}>{label}</span>
  );
}

export default function DailySummaryView() {
  const { state, generateSummary } = useApp();
  const { summaries, articles, isLoading, preferences } = state;

  const today = new Date().toISOString().split('T')[0];
  const todaySummary = summaries.find(s => s.date === today);
  const pastSummaries = summaries.filter(s => s.date !== today).sort((a, b) => b.date.localeCompare(a.date));

  const todayArticleCount = articles.filter(a => a.publishedAt?.startsWith(today)).length;
  const readToday = articles.filter(a => a.isRead && a.readAt?.startsWith(today)).length;

  const dateLabel = format(new Date(), "EEEE, d MMMM yyyy", { locale: vi });

  const [hasServerKey, setHasServerKey] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/summarize')
      .then(r => r.json())
      .then(d => {
        if (d.hasServerKey) setHasServerKey(true);
      })
      .catch(() => {});
  }, []);

  const hasApiKey = hasServerKey || !!preferences.geminiApiKey;

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Tóm tắt hàng ngày</h1>
          <p className="section-subtitle">AI tổng hợp tin tức theo sở thích của bạn</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={generateSummary}
          disabled={isLoading}
        >
          {isLoading ? (
            <><span className="spinner" style={{ width: 14, height: 14 }} /> Đang tạo...</>
          ) : (
            '✨ Tạo tóm tắt hôm nay'
          )}
        </button>
      </div>

      {/* Today Hero */}
      <div className="summary-hero">
        <div className="summary-date">
          <span>📅</span>
          <span>{dateLabel}</span>
        </div>

        {todaySummary ? (
          <>
            <p className="summary-greeting">{todaySummary.personalizedNote}</p>
            <div className="summary-stats">
              <div className="summary-stat">
                <span>📰</span>
                <span><strong>{todaySummary.totalArticles}</strong> bài hôm nay</span>
              </div>
              <div className="summary-stat">
                <span>👁</span>
                <span><strong>{todaySummary.readArticles}</strong> đã đọc</span>
              </div>
              <div className="summary-stat">
                <span>📡</span>
                <span><strong>{todaySummary.sources.length}</strong> nguồn</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="summary-greeting">
              Chào buổi sáng! Hãy để AI tóm tắt tin tức hôm nay cho bạn ☕
            </p>
            <div className="summary-stats">
              <div className="summary-stat">
                <span>📰</span>
                <span><strong>{todayArticleCount}</strong> bài hôm nay</span>
              </div>
              <div className="summary-stat">
                <span>👁</span>
                <span><strong>{readToday}</strong> đã đọc</span>
              </div>
            </div>
            {todayArticleCount === 0 && (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>
                💡 Tải tin tức trước, sau đó nhấn "Tạo tóm tắt hôm nay"
              </p>
            )}
            {!hasApiKey ? (
              <p style={{ fontSize: '13px', color: 'var(--yellow)', marginTop: '8px' }}>
                ⚠️ Cần nhập Gemini API key trong Cài đặt để sử dụng tính năng này
              </p>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--green, #22c55e)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✨</span> Gemini AI đã sẵn sàng (Model: gemini-3.1-flash-lite)
              </p>
            )}
          </>
        )}
      </div>

      {/* Today highlights */}
      {todaySummary && (
        <>
          {/* Top topics */}
          {todaySummary.topTopics.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
                🏷️ Chủ đề nổi bật hôm nay
              </h2>
              <div className="pill-group">
                {todaySummary.topTopics.map((topic, i) => (
                  <span key={i} className="pill selected">{topic}</span>
                ))}
              </div>
            </div>
          )}

          {/* Overview */}
          {todaySummary.rawSummary && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-body">
                <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
                  📋 Tổng quan
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {todaySummary.rawSummary}
                </p>
              </div>
            </div>
          )}

          {/* Highlights */}
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
            ⭐ Điểm tin nổi bật
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
            {todaySummary.highlights.map((h, i) => (
              <HighlightCard key={i} highlight={h} index={i} />
            ))}
          </div>
        </>
      )}

      {/* Past summaries */}
      {pastSummaries.length > 0 && (
        <>
          <div className="divider" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>
            📚 Tóm tắt các ngày trước
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pastSummaries.slice(0, 7).map(s => (
              <PastSummaryCard key={s.id} summary={s} />
            ))}
          </div>
        </>
      )}

      {summaries.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">✨</div>
          <h2 className="empty-title">Chưa có tóm tắt nào</h2>
          <p className="empty-subtitle">
            Cài đặt Gemini API key và nhấn "Tạo tóm tắt hôm nay" để bắt đầu
          </p>
        </div>
      )}
    </div>
  );
}

function HighlightCard({ highlight, index }: { highlight: SummaryHighlight; index: number }) {
  return (
    <div className={`highlight-card importance-${highlight.importance} card-enter`}
      style={{ animationDelay: `${index * 0.08}s` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '12px' }}>
        <h3 className="highlight-title" style={{ margin: 0 }}>{highlight.title}</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <span className={`category-badge cat-default`}>{highlight.category}</span>
          <ImportanceBadge importance={highlight.importance} />
        </div>
      </div>
      <p className="highlight-summary">{highlight.summary}</p>
    </div>
  );
}

function PastSummaryCard({ summary }: { summary: { date: string; personalizedNote: string; totalArticles: number; topTopics: string[]; highlights: SummaryHighlight[] } }) {
  const [expanded, setExpanded] = React.useState(false);

  const dateLabel = (() => {
    try {
      return format(new Date(summary.date), "EEEE, d/M", { locale: vi });
    } catch { return summary.date; }
  })();

  return (
    <div className="card">
      <div
        className="card-body"
        style={{ cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {dateLabel}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>
              {summary.personalizedNote?.slice(0, 80)}...
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge">{summary.totalArticles} bài</span>
            <span style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <div className="pill-group" style={{ marginBottom: '16px' }}>
            {summary.topTopics?.map((t, i) => <span key={i} className="pill selected">{t}</span>)}
          </div>
          {summary.highlights?.map((h, i) => (
            <div key={i} style={{ marginBottom: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>{h.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{h.summary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
