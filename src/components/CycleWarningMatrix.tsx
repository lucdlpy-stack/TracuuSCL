import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RuleMode } from '../types/asset';
import { exportToExcel } from '../services/excel';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Download,
  CalendarCheck,
  ShieldAlert,
  Sliders,
  ChevronRight,
  Info,
} from 'lucide-react';

interface CycleWarningMatrixProps {
  onSelectAsset: (code: string) => void;
}

export const CycleWarningMatrix: React.FC<CycleWarningMatrixProps> = ({ onSelectAsset }) => {
  const { assets, cycleRules, updateCycleRule, getAssetCycleStatus, currentYear, addPlanRecord } =
    useApp();

  const [filterColor, setFilterColor] = useState<string>('ALL'); // 'ALL' | 'RED' | 'YELLOW' | 'GREEN'
  const [ruleModeState, setRuleModeState] = useState<RuleMode>('Greater');

  const handleToggleRuleMode = (mode: RuleMode) => {
    setRuleModeState(mode);
    // Update active rules
    cycleRules.forEach((rule) => {
      updateCycleRule(rule.id, { ruleMode: mode });
    });
  };

  const processedAssets = assets.map((asset) => {
    const cycleStatus = getAssetCycleStatus(asset);
    return { asset, cycleStatus };
  });

  const filtered = processedAssets.filter(({ cycleStatus }) => {
    if (filterColor !== 'ALL' && cycleStatus.statusColor !== filterColor) return false;
    return true;
  });

  const redAssets = processedAssets.filter((a) => a.cycleStatus.statusColor === 'RED');
  const yellowAssets = processedAssets.filter((a) => a.cycleStatus.statusColor === 'YELLOW');
  const greenAssets = processedAssets.filter((a) => a.cycleStatus.statusColor === 'GREEN');

  const handleExportWarningsExcel = () => {
    const exportData = filtered.map(({ asset, cycleStatus }) => ({
      'Mã tài sản': asset.assetCode,
      'Tên tài sản': asset.assetName,
      'Loại tài sản': asset.category,
      'Đơn vị quản lý': asset.unit,
      'Vị trí': asset.location,
      'Năm SCL gần nhất': asset.lastMajorRepairYear || 'Chưa SCL',
      'Số năm đã qua': cycleStatus.yearsElapsed ?? 'Thiếu DL',
      'Năm đạt mốc 5 năm': cycleStatus.milestoneYear ?? '',
      'Năm đủ điều kiện tiếp theo': cycleStatus.eligibleYear ?? '',
      'Trạng thái cảnh báo': cycleStatus.statusLabel,
      'Lý do chi tiết': cycleStatus.reason,
    }));

    exportToExcel(exportData, `EVN_Canh_Bao_Chu_Ky_SCL_${currentYear}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-blue-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
              Trung tâm Cảnh báo Chu kỳ Bảo trì & Sửa chữa lớn (SCL)
            </h2>
            <p className="text-xs text-blue-200">
              Tự động tính toán số năm kể từ đợt SCL hoàn thành gần nhất, phát cảnh báo thời hạn theo quy định EVN.
            </p>
          </div>

          <button
            onClick={handleExportWarningsExcel}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all self-start md:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Danh sách Cảnh báo Excel</span>
          </button>
        </div>

        {/* Rule Mode Toggle Control (Section VI.B Requirement) */}
        <div className="pt-3 border-t border-blue-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-blue-200">Chế độ điều kiện áp dụng:</span>
          </div>

          <div className="flex items-center bg-blue-950 p-1 rounded-xl border border-blue-700">
            <button
              onClick={() => handleToggleRuleMode('Greater')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                ruleModeState === 'Greater'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              Phải lớn hơn 5 năm (&gt; 5y) [Mặc định]
            </button>
            <button
              onClick={() => handleToggleRuleMode('Exact')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                ruleModeState === 'Exact'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              Đủ mốc 5 năm (&ge; 5y)
            </button>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RED Card */}
        <div
          onClick={() => setFilterColor(filterColor === 'RED' ? 'ALL' : 'RED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            filterColor === 'RED'
              ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-500'
              : 'bg-rose-50 border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Chưa đủ 5 năm (Màu Đỏ)
            </span>
            <span className="text-2xl font-black text-rose-900">{redAssets.length}</span>
          </div>
          <p className="text-xs text-rose-700 mt-2">Mới SCL trong vòng 1 - 4 năm trở lại đây.</p>
        </div>

        {/* YELLOW Card */}
        <div
          onClick={() => setFilterColor(filterColor === 'YELLOW' ? 'ALL' : 'YELLOW')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            filterColor === 'YELLOW'
              ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-500'
              : 'bg-amber-50 border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Đạt mốc / Thiếu DL (Màu Vàng)
            </span>
            <span className="text-2xl font-black text-amber-900">{yellowAssets.length}</span>
          </div>
          <p className="text-xs text-amber-700 mt-2">Đúng 5 năm hoặc chưa có thông tin năm SCL.</p>
        </div>

        {/* GREEN Card */}
        <div
          onClick={() => setFilterColor(filterColor === 'GREEN' ? 'ALL' : 'GREEN')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            filterColor === 'GREEN'
              ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500'
              : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Đã vượt 5 năm (Màu Xanh)
            </span>
            <span className="text-2xl font-black text-emerald-900">{greenAssets.length}</span>
          </div>
          <p className="text-xs text-emerald-700 mt-2">
            Đã trên 5 năm kể từ SCL gần nhất. Đủ điều kiện rà soát.
          </p>
        </div>
      </div>

      {/* Warning List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">
            Danh sách Chi tiết Cảnh báo ({filtered.length} tài sản)
          </span>
          {filterColor !== 'ALL' && (
            <button
              onClick={() => setFilterColor('ALL')}
              className="text-blue-600 font-bold hover:underline"
            >
              Hiện tất cả tài sản
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.map(({ asset, cycleStatus }) => (
            <div
              key={asset.assetCode}
              onClick={() => onSelectAsset(asset.assetCode)}
              className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {asset.assetCode}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">{asset.category}</span>
                  <span className="text-xs text-slate-400">• {asset.unit}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{asset.assetName}</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-200 mt-1">
                  <strong>Lý do cảnh báo:</strong> {cycleStatus.reason}
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                    cycleStatus.statusColor === 'RED'
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : cycleStatus.statusColor === 'YELLOW'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {cycleStatus.statusLabel}
                </span>

                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
