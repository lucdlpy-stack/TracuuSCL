import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { removeAccents, matchVietnamese } from '../utils/vietnamese';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  MapPin,
  Calendar,
  ChevronRight,
  Filter,
  Info,
  RotateCcw,
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
  const [cycleFilter, setCycleFilter] = useState<string>('ALL');

  // Accent-insensitive multi-field search algorithm
  const filteredAssets = assets.filter((asset) => {
    // Category filter
    if (categoryFilter !== 'ALL' && asset.category !== categoryFilter) return false;
    // Unit filter
    if (unitFilter !== 'ALL' && asset.unit !== unitFilter) return false;

    // Cycle filter
    const cycleStatus = getAssetCycleStatus(asset);
    if (cycleFilter === 'GREEN' && cycleStatus.statusColor !== 'GREEN') return false;
    if (cycleFilter === 'YELLOW' && cycleStatus.statusColor !== 'YELLOW') return false;
    if (cycleFilter === 'RED' && cycleStatus.statusColor !== 'RED') return false;
    if (cycleFilter === 'OVERDUE' && !cycleStatus.isOverdue) return false;

    if (!searchQuery.trim()) return true;

    // Accent-insensitive search match
    if (
      matchVietnamese(asset.assetCode, searchQuery) ||
      matchVietnamese(asset.assetName, searchQuery) ||
      matchVietnamese(asset.category, searchQuery) ||
      matchVietnamese(asset.location, searchQuery) ||
      matchVietnamese(asset.unit, searchQuery) ||
      matchVietnamese(asset.notes, searchQuery)
    ) {
      return true;
    }

    // Check repair contents with accent-insensitive search
    const repairs = repairRecords.filter((r) => r.assetCode === asset.assetCode);
    if (
      repairs.some(
        (r) =>
          matchVietnamese(r.workContent, searchQuery) ||
          matchVietnamese(r.cause, searchQuery) ||
          matchVietnamese(r.decisionNo, searchQuery)
      )
    ) {
      return true;
    }

    // Check plan codes / names
    const plans = planRecords.filter((p) => p.assetCode === asset.assetCode);
    if (
      plans.some(
        (p) =>
          matchVietnamese(p.projectName, searchQuery) ||
          matchVietnamese(p.planCode, searchQuery) ||
          matchVietnamese(p.workContent, searchQuery)
      )
    ) {
      return true;
    }

    return false;
  });

  // Extract unique categories and units for filter selectors
  const categories = Array.from(new Set(assets.map((a) => a.category)));
  const units = Array.from(new Set(assets.map((a) => a.unit)));

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setUnitFilter('ALL');
    setCycleFilter('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Search Header Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-amber-400" />
              Tra Cứu Nhanh Hồ Sơ & Chu Kỳ Bảo Trì SCL
            </h2>
            <p className="text-xs text-slate-400">
              Hỗ trợ tìm kiếm thông minh <span className="text-amber-300 font-semibold">không dấu</span> theo Mã tài sản, Tên thiết bị, Đơn vị, hoặc Công trình
            </p>
          </div>

          <div className="text-xs text-slate-400 font-semibold bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
            Kết quả: <span className="text-amber-400 font-extrabold">{filteredAssets.length}</span> / {assets.length} tài sản
          </div>
        </div>

        {/* Big Compact Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Gõ từ khóa không dấu hoặc có dấu (VD: 'may bien ap', 'recloser', 'EVN-CL-MC22', '110kv')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-28 py-3.5 bg-slate-950 text-white placeholder-slate-500 rounded-xl text-sm sm:text-base font-medium border border-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
            autoFocus
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-bold"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Advanced Filters Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Unit Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Đơn vị quản lý:</span>
            </label>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="ALL">-- Tất cả Đơn vị ({units.length}) --</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Maintenance Cycle Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Trạng thái Chu kỳ SCL:</span>
            </label>
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="ALL">-- Tất cả trạng thái chu kỳ --</option>
              <option value="GREEN">🟢 Xanh: Đủ điều kiện SCL (&gt; 5 năm)</option>
              <option value="YELLOW">🟡 Vàng: Đúng mốc / Thiếu dữ liệu SCL</option>
              <option value="RED">🔴 Đỏ: Chưa đủ chu kỳ (Mới SCL gần đây)</option>
              <option value="OVERDUE">⚡ Quá mốc chu kỳ bảo trì</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>Loại danh mục thiết bị:</span>
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="ALL">-- Tất cả Loại thiết bị ({categories.length}) --</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Active Filter Badges & Reset Button */}
        {(categoryFilter !== 'ALL' || unitFilter !== 'ALL' || cycleFilter !== 'ALL' || searchQuery) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-bold text-[11px]">Đang lọc:</span>
              {unitFilter !== 'ALL' && (
                <span className="bg-blue-900/80 text-blue-200 border border-blue-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                  {unitFilter}
                </span>
              )}
              {cycleFilter !== 'ALL' && (
                <span className="bg-amber-900/80 text-amber-200 border border-amber-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                  Chu kỳ: {cycleFilter}
                </span>
              )}
              {categoryFilter !== 'ALL' && (
                <span className="bg-emerald-900/80 text-emerald-200 border border-emerald-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                  {categoryFilter}
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1 text-slate-400 hover:text-amber-400 font-bold text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          </div>
        )}
      </div>

      {/* Search Results Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl p-12 text-center border border-slate-800 space-y-3">
          <Info className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">Không tìm thấy tài sản nào phù hợp</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Thử nhập từ khóa khác hoặc bỏ các bộ lọc Đơn vị / Chu kỳ để xem toàn bộ danh sách.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Xóa bộ lọc & Hiển thị lại tất cả
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
                className="bg-slate-900 rounded-2xl p-5 shadow-lg border border-slate-800 hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
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
                    <span className="font-mono text-xs font-extrabold text-blue-300 bg-blue-950 border border-blue-800 px-2.5 py-1 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {asset.assetCode}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {asset.category}
                    </span>
                  </div>

                  {/* Asset Name */}
                  <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                    {asset.assetName}
                  </h3>

                  {/* Unit & Location */}
                  <div className="text-xs text-slate-400 space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{asset.unit}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{asset.location}</span>
                    </div>
                  </div>

                  {/* Badges Matrix */}
                  <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                    {/* Cycle Warning Status Badge */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">Chu kỳ SCL:</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          cycleStatus.statusColor === 'RED'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                            : cycleStatus.statusColor === 'YELLOW'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {cycleStatus.statusColor === 'RED' && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                        {cycleStatus.statusColor === 'YELLOW' && <Clock className="w-3 h-3 text-amber-400" />}
                        {cycleStatus.statusColor === 'GREEN' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        {cycleStatus.statusLabel}
                      </span>
                    </div>

                    {/* Plan Status Badge */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">KH năm {currentYear}:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          planStatus.planColor === 'BLUE'
                            ? 'bg-blue-900/60 text-blue-200 border-blue-600'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {planStatus.statusLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-blue-400 font-bold group-hover:translate-x-1 transition-transform">
                  <span>Xem hồ sơ & lịch sử sửa chữa</span>
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
