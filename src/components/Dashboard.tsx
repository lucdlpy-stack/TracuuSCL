import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Database,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Upload,
  BarChart3,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  FolderGit2,
  Smartphone,
  RefreshCw,
} from 'lucide-react';

interface DashboardProps {
  onSelectAsset: (code: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectAsset }) => {
  const {
    assets,
    planRecords,
    getAssetCycleStatus,
    getAssetPlanStatus,
    currentYear,
    setActiveTab,
    loadTestScenarios,
    forceSyncAll,
    isOnline,
  } = useApp();

  // Metrics computation
  const totalAssets = assets.length;

  let noPlanCount = 0;
  let sclPlanCount = 0;

  let cycleRedCount = 0;
  let cycleYellowCount = 0;
  let cycleGreenCount = 0;

  const priorityReviewAssets: string[] = [];

  assets.forEach((asset) => {
    const cycleStatus = getAssetCycleStatus(asset);
    const planStatus = getAssetPlanStatus(asset, currentYear);

    // Cycle breakdown
    if (cycleStatus.statusColor === 'RED') cycleRedCount++;
    else if (cycleStatus.statusColor === 'YELLOW') cycleYellowCount++;
    else if (cycleStatus.statusColor === 'GREEN') cycleGreenCount++;

    // Plan breakdown
    if (planStatus.inSCL) {
      sclPlanCount++;
    } else {
      noPlanCount++;
    }

    // Priority review = Overdue / Eligible (> 5y or > custom cycle) AND NOT YET IN ANY SCL PLAN
    if (
      (cycleStatus.statusColor === 'GREEN' || cycleStatus.isOverdue) &&
      !planStatus.inSCL
    ) {
      priorityReviewAssets.push(asset.assetCode);
    }
  });

  const projectNames = Array.from(
    new Set(planRecords.filter((p) => p.planYear === currentYear).map((p) => p.projectName))
  );

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner with Electric Glowing Theme */}
      <div className="relative bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 sm:p-8 shadow-2xl border border-blue-700/60 overflow-hidden backdrop-blur-xl">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 top-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-blue-900/80 px-3.5 py-1 rounded-full text-xs font-extrabold text-blue-200 border border-blue-500/60 shadow-inner">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Sổ tay Quản lý & Tra cứu SCL Điện lực EVN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Tổng quan Vận hành & Cảnh báo SCL Realtime
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/90 leading-relaxed">
              Ứng dụng PWA hỗ trợ đồng bộ mượt mà giữa Web và Smartphone. Đối soát kế hoạch SCL năm{' '}
              <span className="font-extrabold text-amber-300">{currentYear}</span> tự động theo Công trình.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={forceSyncAll}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all border border-emerald-400"
            >
              <RefreshCw className="w-4 h-4 text-emerald-100" />
              <span>Đồng bộ Ngay</span>
            </button>
            <button
              onClick={() => setActiveTab('excel-import')}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all border border-blue-400"
            >
              <Upload className="w-4 h-4" />
              <span>Nhập Excel</span>
            </button>
            <button
              onClick={loadTestScenarios}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Kịch bản Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Assets */}
        <div
          onClick={() => setActiveTab('assets')}
          className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-slate-800 hover:border-blue-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tổng tài sản
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {totalAssets}
            </span>
            <span className="text-xs text-blue-400 font-bold group-hover:translate-x-1 transition-transform flex items-center">
              Xem <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Priority Review Needed */}
        <div
          onClick={() => setActiveTab('cycle-warnings')}
          className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 rounded-2xl p-4 shadow-xl border border-amber-400 hover:shadow-2xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-950">
              Ưu tiên rà soát
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-950/20 text-slate-950 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black">{priorityReviewAssets.length}</span>
            <span className="text-xs font-extrabold text-slate-950 underline group-hover:translate-x-1 transition-transform">
              Xử lý ({priorityReviewAssets.length})
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-900 mt-1 truncate">
            Đã vượt SCL nhưng chưa có KH năm {currentYear}
          </p>
        </div>

        {/* SCL Plan Count */}
        <div
          onClick={() => setActiveTab('scl-plans')}
          className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-slate-800 hover:border-blue-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Đã có trong KH
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center font-bold">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-blue-400">
              {sclPlanCount}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">Năm {currentYear}</span>
          </div>
        </div>

        {/* Project Count */}
        <div
          onClick={() => setActiveTab('scl-plans')}
          className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-slate-800 hover:border-indigo-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Số Công trình
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center font-bold">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-indigo-400">
              {projectNames.length}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">Công trình</span>
          </div>
        </div>
      </div>

      {/* Cycle Maintenance Status Breakdown */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Trạng thái Chu kỳ SCL Bảo trì Thiết bị
            </h2>
            <p className="text-xs text-slate-400">
              Phân loại chu kỳ bảo trì tự động điều chỉnh theo từng loại tài sản
            </p>
          </div>
          <button
            onClick={() => setActiveTab('cycle-warnings')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>Chi tiết Ma trận</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* RED */}
          <div
            onClick={() => setActiveTab('cycle-warnings')}
            className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-rose-900/50 transition-all"
          >
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Chưa đủ chu kỳ (Màu Đỏ)
              </span>
              <p className="text-2xl font-black text-rose-100">{cycleRedCount} tài sản</p>
              <p className="text-[11px] text-rose-400">Mới SCL gần đây</p>
            </div>
            <div className="text-right text-xs font-black text-rose-300">
              {Math.round((cycleRedCount / (totalAssets || 1)) * 100)}%
            </div>
          </div>

          {/* YELLOW */}
          <div
            onClick={() => setActiveTab('cycle-warnings')}
            className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-amber-900/50 transition-all"
          >
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                Đạt mốc / Thiếu DL (Màu Vàng)
              </span>
              <p className="text-2xl font-black text-amber-100">{cycleYellowCount} tài sản</p>
              <p className="text-[11px] text-amber-400">Đúng mốc chu kỳ hoặc thiếu thông tin</p>
            </div>
            <div className="text-right text-xs font-black text-amber-300">
              {Math.round((cycleYellowCount / (totalAssets || 1)) * 100)}%
            </div>
          </div>

          {/* GREEN */}
          <div
            onClick={() => setActiveTab('cycle-warnings')}
            className="bg-emerald-950/40 border border-emerald-800/80 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-900/50 transition-all"
          >
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Đã vượt mốc - Đủ điều kiện (Màu Xanh)
              </span>
              <p className="text-2xl font-black text-emerald-100">{cycleGreenCount} tài sản</p>
              <p className="text-[11px] text-emerald-400">Đã vượt mốc chu kỳ SCL</p>
            </div>
            <div className="text-right text-xs font-black text-emerald-300">
              {Math.round((cycleGreenCount / (totalAssets || 1)) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Priority Review Table */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Danh sách Đề xuất Rà soát Đưa vào Công trình SCL (Ưu tiên)
            </h2>
            <p className="text-xs text-slate-400">
              Tài sản đã vượt chu kỳ SCL nhưng <span className="font-bold text-rose-400">chưa có</span> trong Công trình SCL nào năm {currentYear}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('cycle-warnings')}
            className="text-xs font-bold text-blue-400 hover:underline shrink-0"
          >
            Toàn bộ ({priorityReviewAssets.length})
          </button>
        </div>

        {priorityReviewAssets.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-950 rounded-2xl border border-slate-800">
            Tất cả tài sản đã vượt chu kỳ SCL đều đã được lập kế hoạch công trình năm {currentYear}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-300 font-extrabold uppercase text-[11px]">
                <tr>
                  <th className="p-3">Mã tài sản</th>
                  <th className="p-3">Tên tài sản</th>
                  <th className="p-3">Đơn vị quản lý</th>
                  <th className="p-3">Năm SCL gần nhất</th>
                  <th className="p-3">Số năm đã qua</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {priorityReviewAssets.slice(0, 5).map((code) => {
                  const asset = assets.find((a) => a.assetCode === code);
                  if (!asset) return null;
                  const cycleStatus = getAssetCycleStatus(asset);

                  return (
                    <tr
                      key={code}
                      onClick={() => onSelectAsset(code)}
                      className="hover:bg-slate-800/80 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-mono font-bold text-blue-400">{asset.assetCode}</td>
                      <td className="p-3 font-bold text-white">{asset.assetName}</td>
                      <td className="p-3 text-slate-300">{asset.unit}</td>
                      <td className="p-3 font-semibold text-slate-200">
                        {asset.lastMajorRepairYear || 'Chưa SCL'}
                      </td>
                      <td className="p-3 font-extrabold text-emerald-400">
                        {cycleStatus.yearsElapsed !== null ? `${cycleStatus.yearsElapsed} năm` : 'N/A'}
                      </td>
                      <td className="p-3 text-right">
                        <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg">
                          Hồ sơ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
