import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { QuickSearch } from './components/QuickSearch';
import { AssetTable } from './components/AssetTable';
import { RepairHistoryManager } from './components/RepairHistoryManager';
import { PlanManager } from './components/PlanManager';
import { CycleWarningMatrix } from './components/CycleWarningMatrix';
import { ExcelImporter } from './components/ExcelImporter';
import { ReportGenerator } from './components/ReportGenerator';
import { ConfigSync } from './components/ConfigSync';
import { CycleRulesManager } from './components/CycleRulesManager';
import { AssetDetailModal } from './components/AssetDetailModal';
import { MobileTabBar } from './components/MobileTabBar';

const AppContent: React.FC = () => {
  const { activeTab, selectedAssetCode, setSelectedAssetCode } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden relative">
      {/* Dynamic Background Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(30,58,138,0.5),rgba(15,23,42,0.8))]" />

      {/* Header */}
      <div className="relative z-30">
        <Header
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      </div>

      {/* Navigation */}
      <div className="relative z-20">
        <Navigation
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      </div>

      {/* Main Container with Mobile Bottom Padding for MobileTabBar */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10 pb-24 md:pb-8">
        {activeTab === 'home' && (
          <Dashboard onSelectAsset={(code) => setSelectedAssetCode(code)} />
        )}

        {activeTab === 'search' && (
          <QuickSearch onSelectAsset={(code) => setSelectedAssetCode(code)} />
        )}

        {activeTab === 'assets' && (
          <AssetTable onSelectAsset={(code) => setSelectedAssetCode(code)} />
        )}

        {activeTab === 'repairs' && <RepairHistoryManager />}

        {activeTab === 'scl-plans' && <PlanManager />}

        {activeTab === 'cycle-warnings' && (
          <CycleWarningMatrix onSelectAsset={(code) => setSelectedAssetCode(code)} />
        )}

        {activeTab === 'excel-import' && <ExcelImporter />}

        {activeTab === 'reports' && <ReportGenerator />}

        {activeTab === 'config-sync' && (
          <div className="space-y-8">
            <CycleRulesManager />
            <ConfigSync />
          </div>
        )}
      </main>

      {/* Mobile Sticky Bottom Tab Bar */}
      <MobileTabBar />

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-6 border-t border-slate-800 relative z-10 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-slate-200">
              SỔ TAY TRA CỨU VÀ QUẢN LÝ TÀI SẢN EVN - Phiên bản Mobile Realtime 2026.3
            </span>
          </div>

          <p className="text-center sm:text-right text-slate-500">
            Tự động Đồng bộ Đa thiết bị • Chu kỳ SCL & Công trình EVN
          </p>
        </div>
      </footer>

      {/* Detail Drawer Modal */}
      {selectedAssetCode && (
        <AssetDetailModal
          assetCode={selectedAssetCode}
          onClose={() => setSelectedAssetCode(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
