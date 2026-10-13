'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { NewsSource, NEWS_CATEGORIES } from '@/types';
import { updateSource } from '@/lib/storage';

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Chưa tải';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
    }).format(new Date(dateStr));
  } catch { return 'Không xác định'; }
}

function StatusDot({ status }: { status: NewsSource['fetchStatus'] }) {
  return <span className={`status-dot ${status}`} title={status} />;
}

function SourceCard({ source }: { source: NewsSource }) {
  const { dispatch, deleteSource, toggleSourceActive, showToast } = useApp();

  const handleCategoryChange = (category: string) => {
    updateSource(source.id, { category });
    dispatch({ type: 'UPDATE_SOURCE', id: source.id, updates: { category } });
  };

  return (
    <div className="source-card">
      {/* Icon */}
      <div className="source-icon">
        {source.favicon ? (
          <img
            src={source.favicon}
            alt={source.name}
            onError={e => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              (e.currentTarget.parentElement as HTMLElement).textContent = '📰';
            }}
          />
        ) : '📰'}
      </div>

      {/* Info */}
      <div className="source-info">
        <div className="source-name">{source.name}</div>
        <div className="source-url">{source.rssUrl}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
          <StatusDot status={source.fetchStatus} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {source.fetchStatus === 'loading' ? 'Đang tải...' :
              source.fetchStatus === 'success' ? `Cập nhật: ${formatDate(source.lastFetched)}` :
              source.fetchStatus === 'error' ? 'Lỗi tải tin' : 'Chưa tải'}
          </span>
          {source.errorMessage && (
            <span style={{ fontSize: '11px', color: 'var(--red)', marginLeft: '4px' }}
              title={source.errorMessage}>
              ⚠️
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="source-actions">
        <select
          value={source.category}
          onChange={e => handleCategoryChange(e.target.value)}
          className="input-field"
          style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
        >
          {NEWS_CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div
          className={`toggle-switch ${source.isActive ? 'active' : ''}`}
          onClick={() => toggleSourceActive(source.id)}
          title={source.isActive ? 'Đang hoạt động' : 'Đã tắt'}
        >
          <div className="toggle-knob" />
        </div>

        <button
          className="btn-icon"
          onClick={() => {
            if (confirm(`Xóa nguồn "${source.name}"?`)) {
              deleteSource(source.id);
            }
          }}
          title="Xóa nguồn"
          style={{ color: 'var(--red)', fontSize: '14px' }}
        >
          🗑
        </button>
      </div>
    </div>
  );
}

export default function SourceManager() {
  const { state, addNewsSource, fetchAllFeeds } = useApp();
  const { sources, isFetching } = state;

  const [domain, setDomain] = useState('');
  const [rssUrl, setRssUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!domain.trim()) return;
    setIsAdding(true);
    await addNewsSource(domain.trim(), rssUrl.trim() || undefined);
    setDomain('');
    setRssUrl('');
    setShowAdvanced(false);
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const activeSources = sources.filter(s => s.isActive);
  const inactiveSources = sources.filter(s => !s.isActive);

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Quản lý nguồn tin</h1>
          <p className="section-subtitle">
            {sources.length} nguồn • {activeSources.length} đang hoạt động
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={fetchAllFeeds}
          disabled={isFetching}
        >
          {isFetching ? '⏳ Đang tải...' : '⟳ Tải tất cả'}
        </button>
      </div>

      {/* Add source form */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-body">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            ➕ Thêm nguồn mới
          </h3>

          <div className="input-with-btn" style={{ marginBottom: '12px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Nhập domain (vd: vnexpress.net, dantri.com.vn)"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={!domain.trim() || isAdding}
            >
              {isAdding ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Đang tìm...</> : '+ Thêm'}
            </button>
          </div>

          <button
            className="btn btn-xs btn-secondary"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ marginBottom: showAdvanced ? '12px' : '0' }}
          >
            {showAdvanced ? '▲ Ẩn' : '▼ Nâng cao'} (tùy chỉnh RSS URL)
          </button>

          {showAdvanced && (
            <div className="input-group fade-in">
              <label className="input-label">RSS URL (nếu không tự tìm được)</label>
              <input
                type="text"
                className="input-field"
                placeholder="https://example.com/rss.xml"
                value={rssUrl}
                onChange={e => setRssUrl(e.target.value)}
              />
            </div>
          )}

          {/* Popular suggestions */}
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Gợi ý nhanh:
            </p>
            <div className="pill-group">
              {[
                'vnexpress.net', 'tuoitre.vn', 'thanhnien.vn', 'dantri.com.vn',
                'nhandan.vn', 'vietnamnet.vn', 'cafef.vn', 'genk.vn',
                'kenh14.vn', 'soha.vn', 'techcrunch.com', 'theverge.com'
              ].map(d => (
                <button
                  key={d}
                  className="pill"
                  onClick={() => setDomain(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active sources */}
      {activeSources.length > 0 && (
        <>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>
            ✅ Đang hoạt động ({activeSources.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {activeSources.map(source => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        </>
      )}

      {/* Inactive sources */}
      {inactiveSources.length > 0 && (
        <>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>
            ⏸ Đã tắt ({inactiveSources.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {inactiveSources.map(source => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        </>
      )}

      {sources.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📡</div>
          <h2 className="empty-title">Chưa có nguồn nào</h2>
          <p className="empty-subtitle">Thêm domain của trang báo bạn muốn theo dõi</p>
        </div>
      )}
    </div>
  );
}
