'use client';

import React, { useState } from 'react';

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState('http://localhost:3000/api/v1');
  const [model, setModel] = useState('claude-3-5-sonnet-20241022');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">System Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Configure API endpoints and AI behaviors</p>
      </div>
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm max-w-xl space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-zinc-700">Backend API URL</label>
          <input
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-zinc-700">Claude Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white"
          >
            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
            <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
          </select>
        </div>
        <button
          onClick={() => alert('Settings Saved!')}
          className="bg-zinc-900 text-white font-semibold text-sm px-6 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Save Configurations
        </button>
      </div>
    </div>
  );
}
