import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Asset, AssetCategory } from '../types/asset';
import { exportToExcel } from '../services/excel';
import {
  Search,
  PlusCircle,
  Download,
  Filter,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Edit2,
  Calendar,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface AssetTableProps {
  onSelectAsset: (code: string) => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({ onSelectAsset }) => {
  const {
    assets,
    getAssetCycleStatus,
    getAssetPlanStatus,
    currentYear,
    addAsset,
    deleteAsset,
    setAssetCustomCycle,
    searchQuery,
    setSearchQuery,
  } = useApp();

  // Advanced Filter Controls
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [cycleFilter, setCycleFilter] = useState<string>('ALL'); // 'RED' | 'YELLOW' | 'GREEN'
  const [commYearMin, setCommYearMin] = useState<string>('');
  const [commYearMax, setCommYearMax] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');

  // Inline Custom Cycle Editor State
  const [editingCycleCode, setEditingCycleCode] = useState<string | null>(null);
  const [editingYears, setEditingYears] = useState<number>(5);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Add Asset Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<AssetCategory>('Thiết bị đóng cắt');
  const [newUnit, setNewUnit] = useState('Công ty Điện lực Chợ Lớn');
  const [newLocation, setNewLocation] = useState('');
  const [newCommYear, setNewCommYear] = useState<number>(2020);
  const [newCustomCycle, setNewCustomCycle] = useState<number>(5);
  const [newNotes, setNewNotes] = useState('');

  // Advanced Multi-Criteria Filter Engine
  const filtered = assets.filter((asset) => {
    // 1. Category
    if (categoryFilter !== 'ALL' && asset.category !== categoryFilter) return false;
    // 2. Unit
    if (unitFilter !== 'ALL' && asset.unit !== unitFilter) return false;
    // 3. Cycle Warning Status
    const cycleStatus = getAssetCycleStatus(asset);
    if (cycleFilter !== 'ALL' && cycleStatus.statusColor !== cycleFilter) return false;
    // 4. Commissioning Year Range
    if (commYearMin && asset.commissioningYear < Number(commYearMin)) return false;
    if (commYearMax && asset.commissioningYear > Number(commYearMax)) return false;
    // 5. Location
    if (locationFilter.trim() && !asset.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;

    // 6. Free text Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        asset.assetCode.toLowerCase().includes(q) ||
        asset.assetName.toLowerCase().includes(q) ||
        asset.location.toLowerCase().includes(q) ||
        asset.unit.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedAssets = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const categories = Array.from(new Set(assets.map((a) => a.category)));
  const units = Array.from(new Set(assets.map((a) => a.unit)));

  const handleResetFilters = () => {
    setCategoryFilter('ALL');
    setUnitFilter('ALL');
    setCycleFilter('ALL');
    setCommYearMin('');
    setCommYearMax('');
    setLocationFilter('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSaveCustomCycle = (code: string) => {
    setAssetCustomCycle(code, editingYears);
    setEditingCycleCode(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    const success = addAsset({
      assetCode: newCode.trim(),
      assetName: newName.trim(),
      category: newCategory,
      unit: newUnit,
      location: newLocation.trim() || 'Trạm chính EVN',
      quantity: 1,
      commissioningYear: newCommYear,
      customCycleYears: newCustomCycle,
      notes: newNotes.trim(),
    });

    if (success) {
      setShowAddModal(false);
      setNewCode('');
      setNewName('');
      setNewNotes('');
    } else {
      alert(`Mã tài sản "${newCode}" đã tồn tại trong hệ thống! Vui lòng chọn mã khác.`);
    }
  };

  const handleExportExcel = () => {
    const exportData = filtered.map((asset) => {
      const cycleStatus = getAssetCycleStatus(asset);
      const planStatus = getAssetPlanStatus(asset, currentYear);

      return {
        'Mã tài sản': asset.assetCode,
        'Tên tài sản': asset.assetName,
        'Loại tài sản': asset.category,
        'Đơn vị quản lý': asset.unit,
        'Vị trí': asset.location,
        'Năm vận hành': asset.commissioningYear || '',
        'Chu kỳ áp dụng': cycleStatus.isCustomCycle ? `${cycleStatus.appliedCycleYears} năm (Chu kỳ riêng)` : `${cycleStatus.appliedCycleYears} năm (Quy tắc nhóm)`,
        'Năm SCL gần nhất': asset.lastMajorRepairYear || 'Chưa SCL',
        'Công trình SCL gần nhất': asset.lastMajorRepairProject || '',
        'Nội dung SCL': asset.lastMajorRepairContent || '',
        'Trạng thái Chu kỳ': cycleStatus.statusLabel,
        'Số năm đã qua': cycleStatus.yearsElapsed ?? 'Thiếu DL',
        'Năm đạt mốc 5y': cycleStatus.milestoneYear ?? '',
        'Tình trạng Kế hoạch SCL': planStatus.statusLabel,
        'Ghi chú': asset.notes || '',
      };
    });

    exportToExcel(exportData, `EVN_Danh_Muc_Tai_San_Lọc_Nâng_Cao_${currentYear}`);
  };

  return (
    <div className="space-y-4">
      {/* Header & Main Actions */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-blue-600" />
              Danh mục Tài sản & Bộ lọc Nâng cao Đa tiêu chí
            </h2>
            <p className="text-xs text-slate-500">
              Kết hợp lọc đồng thời Đơn vị, Năm vận hành, Loại thiết bị, Tình trạng cảnh báo và Tùy chỉnh chu kỳ riêng.
            </p>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              className={`flex items-center justify-center space-x-1 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                showAdvancedFilter
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>{showAdvancedFilter ? 'Ẩn bộ lọc' : 'Hiện bộ lọc nâng cao'}</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm Tài sản Mới</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Excel ({filtered.length})</span>
            </button>
          </div>
        </div>

        {/* ADVANCED MULTI-CRITERIA FILTER PANEL */}
        {showAdvancedFilter && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                Các tiêu chí lọc kết hợp đồng thời:
              </span>
              <button
                onClick={handleResetFilters}
                className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Category */}
              <div>
                <label className="font-bold text-slate-900 block mb-1">Loại thiết bị:</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">-- Tất cả loại thiết bị ({categories.length}) --</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Management Unit */}
              <div>
                <label className="font-bold text-slate-900 block mb-1">Đơn vị quản lý:</label>
                <select
                  value={unitFilter}
                  onChange={(e) => {
                    setUnitFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">-- Tất cả đơn vị --</option>
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Cycle Warning Status */}
              <div>
                <label className="font-bold text-slate-900 block mb-1">Tình trạng cảnh báo hiện tại:</label>
                <select
                  value={cycleFilter}
                  onChange={(e) => {
                    setCycleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">-- Tất cả trạng thái --</option>
                  <option value="RED">Chưa đủ chu kỳ (Đỏ)</option>
                  <option value="YELLOW">Đạt mốc / Thiếu DL (Vàng)</option>
                  <option value="GREEN">Đã vượt chu kỳ / Đủ điều kiện (Xanh)</option>
                </select>
              </div>

              {/* 4. Commissioning Year Range */}
              <div>
                <label className="font-bold text-slate-900 block mb-1">Khoảng năm vận hành:</label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    placeholder="Từ năm"
                    value={commYearMin}
                    onChange={(e) => {
                      setCommYearMin(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-1/2 p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 placeholder:text-slate-500"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    placeholder="Đến năm"
                    value={commYearMax}
                    onChange={(e) => {
                      setCommYearMax(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-1/2 p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Keyword Search & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Lọc từ khóa mã tài sản, tên thiết bị..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Lọc địa điểm / vị trí lắp đặt..."
                  value={locationFilter}
                  onChange={(e) => {
                    setLocationFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Table - Optimized to fit completely within 1 page width on web */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto lg:overflow-x-hidden">
          <table className="w-full text-left text-xs lg:table-fixed">
            <thead className="bg-slate-800 text-white font-bold uppercase text-[10px] sm:text-[11px] tracking-wider">
              <tr>
                <th className="p-2.5 w-[110px] lg:w-[11%]">Mã TS</th>
                <th className="p-2.5 w-auto lg:w-[24%]">Tên tài sản</th>
                <th className="p-2.5 w-[120px] lg:w-[14%]">Đơn vị QLVH</th>
                <th className="p-2.5 w-[60px] lg:w-[6%] text-center">Năm VH</th>
                <th className="p-2.5 w-[80px] lg:w-[8%] text-center">Chu kỳ</th>
                <th className="p-2.5 w-[120px] lg:w-[14%]">SCL gần nhất</th>
                <th className="p-2.5 w-[120px] lg:w-[13%]">Cảnh báo chu kỳ</th>
                <th className="p-2.5 w-[100px] lg:w-[10%]">KH SCL {currentYear}</th>
                <th className="p-2.5 w-[60px] lg:w-[4%] text-right">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Không có dữ liệu tài sản nào thỏa mãn kết hợp các bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((asset) => {
                  const cycleStatus = getAssetCycleStatus(asset);
                  const planStatus = getAssetPlanStatus(asset, currentYear);
                  const isEditingThis = editingCycleCode === asset.assetCode;

                  return (
                    <tr
                      key={asset.assetCode}
                      className="hover:bg-blue-50/60 transition-colors group cursor-pointer"
                      onClick={() => onSelectAsset(asset.assetCode)}
                    >
                      {/* Mã TS */}
                      <td className="p-2 font-mono font-bold text-blue-900 truncate" title={asset.assetCode}>
                        <span className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {asset.assetCode}
                        </span>
                      </td>

                      {/* Tên tài sản */}
                      <td className="p-2 font-bold text-slate-900">
                        <div className="line-clamp-2 leading-tight" title={asset.assetName}>
                          {asset.assetName}
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal truncate block mt-0.5" title={asset.location}>
                          {asset.location}
                        </span>
                      </td>

                      {/* Đơn vị QLVH */}
                      <td className="p-2 text-slate-700 font-medium truncate" title={asset.unit}>
                        {asset.unit}
                      </td>

                      {/* Năm VH */}
                      <td className="p-2 font-extrabold text-slate-800 text-center">
                        {asset.commissioningYear || '-'}
                      </td>

                      {/* Chu kỳ & Inline Edit */}
                      <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                        {isEditingThis ? (
                          <div className="flex items-center justify-center space-x-1">
                            <input
                              type="number"
                              value={editingYears}
                              onChange={(e) => setEditingYears(Number(e.target.value))}
                              className="w-10 p-1 border border-blue-500 rounded font-bold text-center text-slate-900 bg-white text-xs"
                              min={1}
                              max={20}
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveCustomCycle(asset.assetCode)}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                              title="Lưu chu kỳ"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingCycleCode(null)}
                              className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                              title="Hủy"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingCycleCode(asset.assetCode);
                              setEditingYears(cycleStatus.appliedCycleYears);
                            }}
                            className={`inline-flex items-center space-x-0.5 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                              cycleStatus.isCustomCycle
                                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Bấm để chỉnh sửa chu kỳ riêng"
                          >
                            <span>{cycleStatus.appliedCycleYears}n</span>
                            {cycleStatus.isCustomCycle && (
                              <span className="text-[8px] bg-amber-200 text-amber-900 px-0.5 rounded font-black">
                                R
                              </span>
                            )}
                            <Edit2 className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-600 ml-0.5" />
                          </button>
                        )}
                      </td>

                      {/* Lần SCL gần nhất */}
                      <td className="p-2 font-medium text-slate-800">
                        {asset.lastMajorRepairYear ? (
                          <div>
                            <span className="font-bold text-slate-900 text-xs">Năm {asset.lastMajorRepairYear}</span>
                            {asset.lastMajorRepairProject && (
                              <div className="text-[10px] text-blue-700 font-semibold truncate" title={asset.lastMajorRepairProject}>
                                {asset.lastMajorRepairProject}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-700 italic text-[11px]">Chưa SCL</span>
                        )}
                      </td>

                      {/* Cảnh báo chu kỳ */}
                      <td className="p-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border truncate ${
                            cycleStatus.statusColor === 'RED'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : cycleStatus.statusColor === 'YELLOW'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                          title={cycleStatus.reason || cycleStatus.statusLabel}
                        >
                          <span className="truncate">{cycleStatus.statusLabel}</span>
                        </span>
                      </td>

                      {/* KH SCL năm */}
                      <td className="p-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border block text-center truncate ${
                            planStatus.planColor === 'BLUE'
                              ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                          title={planStatus.statusLabel}
                        >
                          {planStatus.statusLabel}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="p-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onSelectAsset(asset.assetCode)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded cursor-pointer"
                            title="Xem chi tiết tài sản"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa tài sản "${asset.assetCode}"?`)) {
                                deleteAsset(asset.assetCode);
                              }
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-100 rounded cursor-pointer"
                            title="Xóa tài sản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">
            Hiển thị trang <span className="font-bold">{currentPage}</span> / {totalPages} (Tổng {filtered.length} tài sản)
          </span>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">
              Khai báo Tài sản Mới
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Mã tài sản * (Bắt buộc, duy nhất):</label>
                <input
                  type="text"
                  placeholder="VD: EVN-CL-REC-99"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Tên tài sản *:</label>
                <input
                  type="text"
                  placeholder="VD: Máy cắt Trạm 110kV..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Loại tài sản:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Thiết bị đóng cắt">Thiết bị đóng cắt</option>
                    <option value="Máy biến áp / Trạm biến áp">Máy biến áp / Trạm biến áp</option>
                    <option value="Đường dây trung thế / hạ thế">Đường dây trung / hạ thế</option>
                    <option value="Đường dây truyền tải">Đường dây truyền tải</option>
                    <option value="Nhà cửa & Công trình xây dựng">Nhà cửa & Công trình</option>
                    <option value="Ô tô & Xe chuyên dùng">Ô tô & Xe chuyên dùng</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Năm đưa vào vận hành:</label>
                  <input
                    type="number"
                    value={newCommYear}
                    onChange={(e) => setNewCommYear(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Đơn vị quản lý:</label>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Chu kỳ SCL (Năm):</label>
                  <input
                    type="number"
                    value={newCustomCycle}
                    onChange={(e) => setNewCustomCycle(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Vị trí lắp đặt:</label>
                <input
                  type="text"
                  placeholder="Trạm 110kV Chợ Lớn..."
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Ghi chú:</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  Lưu Tài sản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
