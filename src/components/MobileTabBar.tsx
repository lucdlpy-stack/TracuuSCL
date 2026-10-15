import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Home,
  Search,
  Database,
  FolderGit2,
  AlertTriangle,
  Settings,
} from 'lucide-react';

export const MobileTabBar: React.FC = () => {
  const { activeTab, setActiveTab, assets } = useApp();

  const tabs = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'search', label: 'Tra cứu', icon: Search },
    { id: 'assets', label: 'Tài sản', icon: Database, badge: assets.length },
    { id: 'scl-plans', label: 'Công trình', icon: FolderGit2 },
    { id: 'cycle-warnings', label: 'Cảnh báo', icon: AlertTriangle, highlight: true },
    { id: 'config-sync', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 shadow-2xl flex items-center justify-around">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative ${
              isActive
                ? 'text-blue-400 font-extrabold scale-105'
                : tab.highlight
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
              {tab.badge !== undefined && (
                <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-[9px] font-black px-1 rounded-full border border-slate-900">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold truncate max-w-[56px]">
              {tab.label}
            </span>

            {/* Active Indicator Bar */}
            {isActive && (
              <span className="absolute bottom-0 w-6 h-0.5 bg-blue-400 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};
