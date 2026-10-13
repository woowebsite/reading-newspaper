'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export default function ToastContainer() {
  const { state, dispatch } = useApp();
  const { toasts } = state;

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <span>
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => dispatch({ type: 'REMOVE_TOAST', id: toast.id })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px' }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
