'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiService } from '@/services/ai.service';

export default function AIChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: 'Hi! I am your AI Inventory Assistant. How can I help you optimize operations today?' }
  ]);

  const askMutation = useMutation({
    mutationFn: (message: string) => aiService.ask(message),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error answering your question.' }]);
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text: input }]);
    askMutation.mutate(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">AI Assistant</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Ask questions about inventory levels, order trends, and workflows</p>
      </div>
      <div className="flex-1 bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >                <div
                className={`max-w-md p-4 rounded-xl text-sm ${
                  m.role === 'user'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {askMutation.isPending && (
            <div className="flex justify-start">
              <div className="max-w-md p-4 rounded-xl text-sm bg-zinc-100 text-zinc-500 italic">
                AI is thinking...
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSend} className="p-4 border-t border-zinc-200 bg-zinc-50 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your inventory question (e.g. 'Why is Amul Milk selling well today?')..."
            className="flex-1 border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white"
          />
          <button
            type="submit"
            className="bg-zinc-900 text-white font-semibold text-sm px-6 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
