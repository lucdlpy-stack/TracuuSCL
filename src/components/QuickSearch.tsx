import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';

interface QuickSearchProps {
  onSelectAsset: (code: string) => void;
}

export const QuickSearch: React.FC<QuickSearchProps> = ({ onSelectAsset }) => {
  const {
    assets,
    repairRecords,
    planRecords,
    searchQuery,
    setSearchQuery,
    getAssetCycleStatus,
    getAssetPlanStatus,
    currentYear,
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');

  // Multi-field search algorithm
  const filteredAssets = assets.filter((asset) => {
    // Category filter
    if (categoryFilter !== 'ALL' && asset.category !== categoryFilter) return false;
    // Unit filter
    if (unitFilter !== 'ALL' && asset.unit !== unitFilter) return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase().trim();

    // Check code, name, category, location, unit
    if (
      asset.assetCode.toLowerCase().includes(q) ||
      asset.assetName.toLowerCase().includes(q) ||
      asset.category.toLowerCase().includes(q) ||
      asset.location.toLowerCase().includes(q) ||
      asset.unit.toLowerCase().includes(q) ||
      (asset.notes && asset.notes.toLowerCase().includes(q))
    ) {
      return true;
    }

    // Check repair contents
    const repairs = repairRecords.filter((r) => r.assetCode === asset.assetCode);
    if (
      repairs.some(
        (r) =>
          r.workContent.toLowerCase().includes(q) ||
          (r.cause && r.cause.toLowerCase().includes(q)) ||
          (r.decisionNo && r.decisionNo.toLowerCase().includes(q))
      )
    ) {
      return true;
    }

    // Check plan codes / names
    const plans = planRecords.filter((p) => p.assetCode === asset.assetCode);
    if (
      plans.some(
        (p) =>
          p.projectName.toLowerCase().includes(q) ||
          (p.planCode && p.planCode.toLowerCase().includes(q)) ||
          (p.workContent && p.workContent.toLowerCase().includes(q))
      )
    ) {
      return true;
    }

    return false;
  });

  // Extract unique categories and units for quick chips
  const categories = Array.from(new Set(assets.map((a) => a.category)));
  const units = Array.from(new Set(assets.map((a) => a.unit)));

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-blue-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-10 -translate-y-10">
          <Sparkles className="w-96 h-96 text-blue-300" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-800/80 border border-blue-600 text-xs font-semibold text-blue-200">
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>Tra cứu Thông tin & Chu kỳ Bảo trì Tài sản EVN</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Nhập Mã tài sản hoặc Tên thiết bị
          </h2>

          {/* Big Search Bar Input */}
          <div className="relative mt-4">
            <input
              type="text"
              placeholder="VD: EVN-CL-MC22-01, Recloser, Trạm 110kV Chợ Lớn, T2 63MVA, KH-SCL-2026..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-28 py-4 bg-white text-slate-900 placeholder-slate-400 rounded-xl text-base sm:text-lg font-medium shadow-2xl focus:outline-none focus:ring-4 focus:ring-amber-400 focus:border-amber-400 transition-all"
              autoFocus
            />
            <Search className="w-6 h-6 text-slate-400 absolute left-4 top-4" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg font-bold"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
            <span className="text-blue-300 font-medium">Lọc nhanh theo loại:</span>
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                categoryFilter === 'ALL'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-blue-950/80 text-blue-200 border border-blue-700 hover:bg-blue-800'
              }`}
            >
              Tất cả ({assets.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-blue-950/80 text-blue-200 border border-blue-700 hover:bg-blue-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Unit Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-2 text-slate-700 text-sm font-semibold">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>Đơn vị quản lý:</span>
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">-- Tất cả đơn vị EVN ({units.length}) --</option>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Tìm thấy <span className="font-bold text-blue-600">{filteredAssets.length}</span> tài sản phù hợp
        </div>
      </div>

      {/* Search Results Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 space-y-3">
          <Info className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-700">Không tìm thấy tài sản nào phù hợp</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Vui lòng kiểm tra lại mã tài sản, tên thiết bị hoặc thử từ khóa tìm kiếm khác.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('ALL');
              setUnitFilter('ALL');
            }}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const cycleStatus = getAssetCycleStatus(asset);
            const planStatus = getAssetPlanStatus(asset, currentYear);

            return (
              <div
                key={asset.assetCode}
                onClick={() => onSelectAsset(asset.assetCode)}
                className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Top accent bar matching cycle warning */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    cycleStatus.statusColor === 'RED'
                      ? 'bg-rose-500'
                      : cycleStatus.statusColor === 'YELLOW'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />

                <div className="space-y-3 pt-1">
                  {/* Header Code & Category */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-extrabold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {asset.assetCode}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {asset.category}
                    </span>
                  </div>

                  {/* Asset Name */}
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                    {asset.assetName}
                  </h3>

                  {/* Unit & Location */}
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{asset.unit}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{asset.location}</span>
                    </div>
                  </div>

                  {/* Badges Matrix */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                    {/* Cycle Warning Status Badge */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">Chu kỳ SCL (5y):</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          cycleStatus.statusColor === 'RED'
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : cycleStatus.statusColor === 'YELLOW'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {cycleStatus.statusColor === 'RED' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        {cycleStatus.statusColor === 'YELLOW' && <Clock className="w-3 h-3 text-amber-600" />}
                        {cycleStatus.statusColor === 'GREEN' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {cycleStatus.statusLabel}
                      </span>
                    </div>

                    {/* Plan Status Badge */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">KH năm {currentYear}:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          planStatus.planColor === 'BLUE'
                            ? 'bg-blue-900/60 text-blue-200 border-blue-600'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {planStatus.statusLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-bold group-hover:translate-x-1 transition-transform">
                  <span>Xem chi tiết hồ sơ & lịch sử</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
