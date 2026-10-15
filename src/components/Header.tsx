import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Database,
  Calendar,
  Layers,
  Menu,
  X,
  Wifi,
  WifiOff,
  Smartphone,
  Zap,
  User,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const {
    currentYear,
    setCurrentYear,
    searchQuery,
    setSearchQuery,
    setActiveTab,
    assets,
    isOnline,
    lastSyncedAt,
    forceSyncAll,
    currentUser,
    logout,
  } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    forceSyncAll();
    setTimeout(() => setIsSyncing(false), 800);
  };

  // PWA Deferred Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBtn, setShowPwaBtn] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPwa = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setShowPwaBtn(false);
        }
        setDeferredPrompt(null);
      });
    } else {
      alert('Để cài đặt ứng dụng trên Điện thoại: Bấm vào biểu tượng Chia sẻ/Menu trình duyệt (••• hoặc Share) -> Chọn "Thêm vào Màn hình chính" (Add to Home Screen).');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 text-white shadow-xl border-b border-blue-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Title */}
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center font-black text-xl shadow-lg border border-red-400/80 shrink-0 transform hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base tracking-wide leading-tight uppercase flex items-center gap-1.5">
                Sổ tay Tài sản EVN
                <span className="hidden lg:inline-block px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full border border-blue-400">
                  SCL & Chu kỳ
                </span>
              </h1>
              <p className="text-[11px] text-blue-300/90 hidden sm:block truncate max-w-[280px]">
                Quản lý Thiết bị, Lịch sử Công trình & Đồng bộ Đa thiết bị
              </p>
            </div>
          </div>

          {/* Quick Search Input in Header */}
          <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tra cứu nhanh mã TS, tên thiết bị..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setActiveTab('search')}
                className="w-full pl-9 pr-8 py-2 bg-white text-slate-900 font-bold placeholder:text-slate-500 text-xs rounded-xl border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-600 hover:text-slate-900 text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-bold cursor-pointer"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2">
            {/* Real-time Sync & Connectivity Badge */}
            <button
              onClick={handleManualSync}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border shadow-sm transition-all cursor-pointer ${
                isOnline
                  ? 'bg-emerald-950/80 border-emerald-600/80 text-emerald-300 hover:bg-emerald-900'
                  : 'bg-amber-950/80 border-amber-600/80 text-amber-300 hover:bg-amber-900'
              }`}
              title="Bấm để kích hoạt đồng bộ tức thì giữa Web & Smartphone ngay lập tức"
            >
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden sm:inline">
                {isOnline ? 'Đồng bộ Realtime' : 'Ngoại tuyến'}
              </span>
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-300 transition-transform ${
                  isSyncing ? 'animate-spin text-amber-300' : 'hover:rotate-180'
                }`}
              />
            </button>

            {/* Smartphone PWA Install Button */}
            <button
              onClick={handleInstallPwa}
              className="hidden lg:flex items-center space-x-1 px-2 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow transition-all shrink-0 cursor-pointer"
              title="Cài đặt Ứng dụng Sổ tay Tài sản EVN trên Điện thoại di động"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>App Mobile</span>
            </button>

            {/* Year Selector */}
            <div className="hidden sm:flex items-center space-x-1 bg-blue-950/90 px-2 py-1.5 rounded-xl border border-blue-700">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="bg-transparent text-white text-xs font-extrabold focus:outline-none cursor-pointer"
              >
                <option value={2024} className="bg-slate-900 text-white">2024</option>
                <option value={2025} className="bg-slate-900 text-white">2025</option>
                <option value={2026} className="bg-slate-900 text-white">2026</option>
                <option value={2027} className="bg-slate-900 text-white">2027</option>
                <option value={2028} className="bg-slate-900 text-white">2028</option>
              </select>
            </div>

            {/* Authenticated Officer Badge & Logout */}
            {currentUser && (
              <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-700 px-2 sm:px-2.5 py-1 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-inner">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-[11px] font-extrabold text-white leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[9px] text-blue-300 font-semibold truncate max-w-[120px]">
                    {currentUser.role === 'Admin'
                      ? 'Quản trị viên'
                      : currentUser.role === 'Technical'
                      ? 'Kỹ sư Kỹ thuật'
                      : 'Kỹ sư Vận hành'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Đồng chí có chắc chắn muốn đăng xuất khỏi hệ thống EVN?')) {
                      logout();
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Đăng xuất khỏi hệ thống (Khóa bảo mật)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-blue-900 focus:outline-none cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
