'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

function WeeklyChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="activity-chart">
      {data.map((d, i) => {
        const height = Math.max((d.count / max) * 100, 4);
        let label = '';
        try {
          label = format(new Date(d.date), 'EE', { locale: vi });
        } catch { label = '?'; }
        return (
          <div key={i} className="activity-bar-wrap">
            <div
              className="activity-bar"
              style={{ height: `${height}%` }}
              title={`${label}: ${d.count} bài`}
            />
            <span className="activity-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function StatsView() {
  const { state } = useApp();
  const { stats, articles, sources } = state;

  const totalArticles = articles.length;
  const likedCount = articles.filter(a => a.isLiked).length;
  const savedCount = articles.filter(a => a.isSaved).length;

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Thống kê & Thói quen</h1>
          <p className="section-subtitle">Phân tích hành vi đọc báo của bạn</p>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid-2" style={{ gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon blue">📰</div>
          <div>
            <div className="stat-value">{stats.totalRead}</div>
            <div className="stat-label">Bài đã đọc</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">🧡</div>
          <div>
            <div className="stat-value">{likedCount}</div>
            <div className="stat-label">Bài đã thích</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🔖</div>
          <div>
            <div className="stat-value">{savedCount}</div>
            <div className="stat-label">Bài đã lưu</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">📡</div>
          <div>
            <div className="stat-value">{sources.filter(s => s.isActive).length}</div>
            <div className="stat-label">Nguồn đang theo dõi</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '20px', marginBottom: '24px' }}>
        {/* Weekly activity */}
        <div className="card">
          <div className="card-body">
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>
              📊 Hoạt động 7 ngày qua
            </h2>
            {stats.weeklyActivity.some(d => d.count > 0) ? (
              <WeeklyChart data={stats.weeklyActivity} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '13px' }}>
                Chưa có dữ liệu đọc báo
              </div>
            )}
          </div>
        </div>

        {/* Top categories */}
        <div className="card">
          <div className="card-body">
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>
              🏷️ Chủ đề yêu thích
            </h2>
            {stats.topCategories.length > 0 ? (
              <div className="top-list">
                {stats.topCategories.map((c, i) => {
                  const maxCount = stats.topCategories[0].count;
                  return (
                    <div key={c.category} className="top-item">
                      <div className={`top-rank ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}`}>
                        {i + 1}
                      </div>
                      <div className="top-bar-wrap">
                        <div className="top-bar-label">{c.category}</div>
                        <div className="top-bar" style={{ width: `${(c.count / maxCount) * 100}%` }} />
                      </div>
                      <span className="top-count">{c.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '13px' }}>
                Hãy đọc một số bài để xây dựng thống kê
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top sources */}
      {stats.topSources.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>
              📡 Nguồn đọc nhiều nhất
            </h2>
            <div className="top-list">
              {stats.topSources.map((s, i) => {
                const maxCount = stats.topSources[0].count;
                return (
                  <div key={s.sourceId} className="top-item">
                    <div className={`top-rank ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}`}>
                      {i + 1}
                    </div>
                    <div className="top-bar-wrap">
                      <div className="top-bar-label">{s.sourceName}</div>
                      <div className="top-bar" style={{ width: `${(s.count / maxCount) * 100}%` }} />
                    </div>
                    <span className="top-count">{s.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Personalization info */}
      <div className="card">
        <div className="card-body">
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
            🤖 Hồ sơ cá nhân hoá
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.7 }}>
            Hệ thống học từ thói quen đọc của bạn để cải thiện đề xuất và tóm tắt hàng ngày.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tổng bài có sẵn</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{totalArticles}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tỉ lệ đọc</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {totalArticles > 0 ? Math.round((stats.totalRead / totalArticles) * 100) : 0}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tỉ lệ thích</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {stats.totalRead > 0 ? Math.round((likedCount / stats.totalRead) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
