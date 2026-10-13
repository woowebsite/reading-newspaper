'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { AppTab } from '@/types';

const NAV_ITEMS: { tab: AppTab; icon: string; label: string }[] = [
  { tab: 'feed', icon: '📰', label: 'Tin tức' },
  { tab: 'summary', icon: '✨', label: 'Tóm tắt' },
  { tab: 'sources', icon: '📡', label: 'Nguồn tin' },
  { tab: 'saved', icon: '🔖', label: 'Đã lưu' },
  { tab: 'stats', icon: '📊', label: 'Thống kê' },
];

export default function Sidebar() {
  const { state, dispatch, fetchAllFeeds, generateSummary } = useApp();
  const { activeTab, isFetching } = state;

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-logo" title="Reading Newspaper">
        📰
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ tab, icon, label }) => (
          <button
            key={tab}
            className={`nav-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_TAB', tab })}
            id={`nav-${tab}`}
          >
            {icon}
            <span className="tooltip">{label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="sidebar-bottom">
        <button
          className={`nav-item ${isFetching ? 'active' : ''}`}
          onClick={fetchAllFeeds}
          disabled={isFetching}
          title="Tải tin tức"
          style={{ position: 'relative' }}
        >
          {isFetching ? <span className="spinner" style={{ width: 18, height: 18 }} /> : '⟳'}
          <span className="tooltip">Tải tin tức</span>
        </button>

        <button
          className="nav-item"
          onClick={generateSummary}
          title="Tạo tóm tắt"
        >
          🤖
          <span className="tooltip">Tạo tóm tắt AI</span>
        </button>

        <button
          className="nav-item"
          onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
          title="Cài đặt"
        >
          ⚙️
          <span className="tooltip">Cài đặt</span>
        </button>
      </div>
    </aside>
  );
}
