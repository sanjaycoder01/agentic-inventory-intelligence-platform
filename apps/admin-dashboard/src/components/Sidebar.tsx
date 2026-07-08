import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  PackageSearch,
  Package,
  Lightbulb,
  FileText,
  Bell,
  BarChart3,
  Bot,
  Settings
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Inventory', href: '/inventory', icon: PackageSearch },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Recommendations', href: '/recommendations', icon: Lightbulb },
  { label: 'Purchase Orders', href: '/purchase-orders', icon: FileText },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'AI Assistant', href: '/ai', icon: Bot },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-screen">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
        <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center">
          <span className="text-white dark:text-black font-bold">A</span>
        </div>
        <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">Antigravity</span>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
