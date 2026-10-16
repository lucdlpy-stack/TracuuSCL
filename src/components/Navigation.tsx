import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Home,
  Search,
  Database,
  History,
  AlertTriangle,
  Upload,
  BarChart3,
  Settings,
  FolderGit2,
  ShieldCheck,
} from 'lucide-react';

interface NavigationProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const {
    activeTab,
    setActiveTab,
    assets,
    repairRecords,
    planRecords,
    currentUser,
  } = useApp();

  // Strict Admin Check for luctt1 / Admin role
  const isAdmin =
    currentUser?.username?.toLowerCase() === 'luctt1' ||
    currentUser?.role === 'Admin';

  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'search', label: 'Tra cứu nhanh', icon: Search },
    { id: 'assets', label: 'Danh mục tài sản', icon: Database, badge: assets.length },
    { id: 'repairs', label: 'Lịch sử sửa chữa', icon: History, badge: repairRecords.length },
    { id: 'scl-plans', label: 'KH SCL theo Công trình', icon: FolderGit2, badge: planRecords.length },
    { id: 'cycle-warnings', label: 'Cảnh báo chu kỳ', icon: AlertTriangle, highlight: true },
    { id: 'excel-import', label: 'Nhập Excel', icon: Upload },
    { id: 'reports', label: 'Báo cáo & Xuất', icon: BarChart3 },
    { id: 'config-sync', label: 'Cấu hình Chu kỳ', icon: Settings },
    ...(isAdmin ? [{ id: 'user-permissions', label: 'Phân quyền Cán bộ', icon: ShieldCheck, adminTab: true }] : []),
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation Sub-bar */}
      <nav className="hidden md:block bg-slate-800 border-b border-slate-700 shadow-sm sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                      : item.adminTab
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-600/80 hover:bg-amber-900'
                      : item.highlight
                      ? 'text-amber-300 hover:bg-slate-700 hover:text-amber-200'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.adminTab ? 'text-amber-400' : item.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                        isActive
                          ? 'bg-blue-800 text-blue-100'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-1 z-40 relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : item.adminTab
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-600/80'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.adminTab ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-300 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};
