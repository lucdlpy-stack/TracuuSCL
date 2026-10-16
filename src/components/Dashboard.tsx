import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Database,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Upload,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  FolderGit2,
  RefreshCw,
  Search,
  Building2,
  Filter,
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

  const units = Array.from(new Set(assets.map((a) => a.unit)));

  // Redirect to QuickSearch tab when user interacts with search box
  const handleGoToSearch = () => {
    setActiveTab('search');
  };

  return (
    <div className="space-y-6">
      {/* Sleek Compact Search Bar on Home Page (Navigates directly to 'search' tab upon click/focus) */}
      <div
        onClick={handleGoToSearch}
        className="bg-slate-900 border border-slate-800 hover:border-amber-400 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden cursor-pointer group transition-all"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 text-[11px] font-bold border border-blue-800">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Tra Cứu Nhanh Trang Chủ • Bấm để mở danh mục Tra cứu</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight group-hover:text-amber-300 transition-colors flex items-center gap-2">
              Sổ tay Tra cứu SCL Thiết bị EVN
              <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </h1>
          </div>

          {/* Compact Quick Action Bar */}
          <div className="flex items-center space-x-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={forceSyncAll}
              className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 rounded-xl text-xs font-bold transition-all"
              title="Đồng bộ dữ liệu đa thiết bị Realtime"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đồng bộ</span>
            </button>
            <button
              onClick={() => setActiveTab('excel-import')}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-blue-200 border border-blue-700 rounded-xl text-xs font-bold transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={loadTestScenarios}
              className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kịch bản Test</span>
            </button>
          </div>
        </div>

        {/* Compact Search Trigger Input Box */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              readOnly
              onClick={handleGoToSearch}
              onFocus={handleGoToSearch}
              placeholder="Bấm vào đây để chuyển qua Danh mục Tra cứu nhanh không dấu..."
              className="w-full pl-11 pr-28 py-3 bg-slate-950 text-white placeholder-slate-400 rounded-xl text-sm font-semibold border border-slate-700 group-hover:border-amber-400 shadow-inner cursor-pointer transition-all"
            />
            <Search className="w-5 h-5 text-amber-400 absolute left-3.5 top-3.5" />
            <div className="absolute right-3 top-2.5 text-xs bg-amber-400 text-slate-950 px-3 py-1 rounded-lg font-extrabold flex items-center gap-1 shadow">
              <span>Mở Tra cứu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 font-medium pt-1">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>{units.length} Đơn vị quản lý</span>
              </span>
              <span className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lọc theo Chu kỳ & Danh mục</span>
              </span>
            </div>
            <span className="text-amber-400 font-bold group-hover:underline">
              Chuyển tới Danh mục Tra cứu &rarr;
            </span>
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
