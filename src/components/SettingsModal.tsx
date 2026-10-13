'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { getPreferences, savePreferences } from '@/lib/storage';
import { NEWS_CATEGORIES, UserPreferences } from '@/types';

export default function SettingsModal() {
  const { state, dispatch, showToast } = useApp();
  const [prefs, setPrefs] = useState<UserPreferences>(() => getPreferences());
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  const handleSave = () => {
    savePreferences(prefs);
    dispatch({ type: 'SET_PREFERENCES', prefs });
    dispatch({ type: 'TOGGLE_SETTINGS', show: false });
    showToast('Đã lưu cài đặt!', 'success');
  };

  const toggleCategory = (cat: string) => {
    const favCats = new Set(prefs.favoriteCategories);
    if (favCats.has(cat)) favCats.delete(cat); else favCats.add(cat);
    setPrefs({ ...prefs, favoriteCategories: Array.from(favCats) });
  };

  return (
    <div className="modal-overlay" onClick={() => dispatch({ type: 'TOGGLE_SETTINGS', show: false })}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', maxHeight: '85vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={() => dispatch({ type: 'TOGGLE_SETTINGS', show: false })}>✕</button>
        <h2 className="modal-title">⚙️ Cài đặt</h2>

        {/* AI API Key */}
        <div className="settings-section">
          <div className="settings-section-title">🤖 Gemini AI</div>
          <div className="input-group">
            <label className="input-label">API Key (dùng để tạo tóm tắt)</label>
            <div className="input-with-btn">
              <input
                type={apiKeyVisible ? 'text' : 'password'}
                className="input-field"
                placeholder="AIza..."
                value={prefs.geminiApiKey || ''}
                onChange={e => setPrefs({ ...prefs, geminiApiKey: e.target.value })}
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setApiKeyVisible(!apiKeyVisible)}
              >
                {apiKeyVisible ? '🙈' : '👁'}
              </button>
            </div>
            <p className="api-key-hint">
              Lấy miễn phí tại{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                aistudio.google.com
              </a>
              . Key được lưu cục bộ, không gửi đi đâu.
            </p>
          </div>
        </div>

        {/* Favorite categories */}
        <div className="settings-section">
          <div className="settings-section-title">🏷️ Chủ đề yêu thích</div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Chọn các chủ đề để AI ưu tiên trong tóm tắt
          </p>
          <div className="pill-group">
            {NEWS_CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`pill ${prefs.favoriteCategories.includes(cat) ? 'selected' : ''}`}
                onClick={() => toggleCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="settings-section">
          <div className="settings-section-title">🌐 Ngôn ngữ tóm tắt</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn btn-sm ${prefs.summaryLanguage === 'vi' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPrefs({ ...prefs, summaryLanguage: 'vi' })}
            >
              🇻🇳 Tiếng Việt
            </button>
            <button
              className={`btn btn-sm ${prefs.summaryLanguage === 'en' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPrefs({ ...prefs, summaryLanguage: 'en' })}
            >
              🇺🇸 English
            </button>
          </div>
        </div>

        {/* Reading time preference */}
        <div className="settings-section">
          <div className="settings-section-title">⏰ Thời gian đọc báo thường ngày</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {([
              { value: 'morning', label: '🌅 Sáng' },
              { value: 'afternoon', label: '☀️ Trưa' },
              { value: 'evening', label: '🌆 Chiều' },
              { value: 'night', label: '🌙 Tối' },
              { value: 'all', label: '🕐 Suốt ngày' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                className={`btn btn-sm ${prefs.preferredReadingTime === value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPrefs({ ...prefs, preferredReadingTime: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="settings-section">
          <div className="settings-section-title" style={{ color: 'var(--red)' }}>⚠️ Vùng nguy hiểm</div>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              if (confirm('Xóa toàn bộ dữ liệu bài báo đã cạch? Thao tác này không thể hoàn tác.')) {
                localStorage.removeItem('news_articles');
                localStorage.removeItem('reading_sessions');
                window.location.reload();
              }
            }}
          >
            🗑 Xóa cache bài báo
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => dispatch({ type: 'TOGGLE_SETTINGS', show: false })}
          >
            Hủy
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            💾 Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
}
