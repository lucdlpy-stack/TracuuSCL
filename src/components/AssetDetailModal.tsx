import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RepairRecord } from '../types/asset';
import { formatVietnameseDateTime } from '../utils/dateFormatter';
import {
  X,
  Building2,
  MapPin,
  Calendar,
  Layers,
  History,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  Edit2,
  Trash2,
  ShieldAlert,
  FolderGit2,
  Check,
  Info,
} from 'lucide-react';

interface AssetDetailModalProps {
  assetCode: string;
  onClose: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ assetCode, onClose }) => {
  const {
    getAssetByCode,
    repairRecords,
    planRecords,
    systemLogs,
    getAssetCycleStatus,
    getAssetPlanStatus,
    currentYear,
    addRepairRecord,
    deleteRepairRecord,
    setAssetCustomCycle,
  } = useApp();

  const asset = getAssetByCode(assetCode);

  const [activeTab, setActiveTab] = useState<
    'general' | 'repairs' | 'plans' | 'cycle' | 'logs'
  >('general');

  // Custom cycle inline editor state
  const [isEditingCycle, setIsEditingCycle] = useState(false);
  const [customYearsInput, setCustomYearsInput] = useState<number>(5);

  // Form states for adding repair record
  const [showAddRepair, setShowAddRepair] = useState(false);
  const [newRepairType, setNewRepairType] = useState<RepairRecord['repairType']>('SCL');
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newRepairYear, setNewRepairYear] = useState<number>(2025);
  const [newRepairStartDate, setNewRepairStartDate] = useState<string>('2025-06-01');
  const [newRepairEndDate, setNewRepairEndDate] = useState<string>('2025-06-15');
  const [newRepairContent, setNewRepairContent] = useState<string>('');
  const [newRepairContractor, setNewRepairContractor] = useState<string>('');
  const [newRepairCost, setNewRepairCost] = useState<string>('');

  if (!asset) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Không tìm thấy tài sản</h3>
          <p className="text-xs text-slate-500">Mã tài sản "{assetCode}" không tồn tại trong hệ thống.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const cycleStatus = getAssetCycleStatus(asset);
  const planStatus = getAssetPlanStatus(asset, currentYear);

  const assetRepairs = repairRecords.filter(
    (r) => r.assetCode.toUpperCase() === asset.assetCode.toUpperCase()
  );
  assetRepairs.sort((a, b) => b.year - a.year);

  const assetPlans = planRecords.filter(
    (p) => p.assetCode.toUpperCase() === asset.assetCode.toUpperCase()
  );
  assetPlans.sort((a, b) => b.planYear - a.planYear);

  const assetLogs = systemLogs.filter(
    (l) =>
      l.targetId.toUpperCase() === asset.assetCode.toUpperCase() ||
      l.details.toUpperCase().includes(asset.assetCode.toUpperCase())
  );

  const handleSaveCycle = () => {
    setAssetCustomCycle(asset.assetCode, customYearsInput);
    setIsEditingCycle(false);
  };

  const handleCreateRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepairContent.trim()) return;

    addRepairRecord({
      assetCode: asset.assetCode,
      repairType: newRepairType,
      projectName: newProjectName.trim() || 'Công trình SCL chưa đặt tên',
      year: newRepairYear,
      startDate: newRepairStartDate,
      endDate: newRepairEndDate,
      workContent: newRepairContent.trim(),
      contractor: newRepairContractor.trim(),
      cost: newRepairCost ? Number(newRepairCost) : undefined,
      acceptanceResult: 'Đã nghiệm thu',
      status: 'Completed',
      dataSource: 'Nhập tay trực tiếp',
    });

    setNewRepairContent('');
    setNewProjectName('');
    setShowAddRepair(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="space-y-1 pr-4">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-extrabold text-amber-300 bg-blue-950 px-2.5 py-0.5 rounded border border-blue-700">
                MÃ TS: {asset.assetCode}
              </span>
              <span className="text-xs bg-blue-800 text-blue-100 px-2.5 py-0.5 rounded font-semibold">
                {asset.category}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
              {asset.assetName}
            </h2>
            <p className="text-xs text-blue-200 flex items-center gap-3 pt-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                {asset.unit}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                {asset.location}
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white bg-blue-800/60 p-2 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 px-4 pt-3 border-b border-slate-200 flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'general'
                ? 'bg-white text-blue-700 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            Thông tin Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('repairs')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'repairs'
                ? 'bg-white text-blue-700 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <span>Lịch sử SCL theo Công trình ({assetRepairs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'plans'
                ? 'bg-white text-blue-700 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <span>KH SCL năm {currentYear} ({assetPlans.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('cycle')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'cycle'
                ? 'bg-white text-blue-700 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <span>Cấu hình Chu kỳ ({cycleStatus.appliedCycleYears} năm)</span>
            <span
              className={`w-2 h-2 rounded-full ${
                cycleStatus.statusColor === 'RED'
                  ? 'bg-rose-500'
                  : cycleStatus.statusColor === 'YELLOW'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-white text-blue-700 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            Nhật ký Thay đổi
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Summary Badges Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cycle Warning Card */}
                <div
                  className={`p-4 rounded-xl border flex items-start space-x-3 ${
                    cycleStatus.statusColor === 'RED'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : cycleStatus.statusColor === 'YELLOW'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Cảnh báo Chu kỳ SCL ({cycleStatus.appliedCycleYears} năm)
                    </span>
                    <p className="text-sm font-extrabold">{cycleStatus.statusLabel}</p>
                    <p className="text-xs leading-relaxed opacity-90">{cycleStatus.reason}</p>
                  </div>
                </div>

                {/* Plan Status Card */}
                <div
                  className={`p-4 rounded-xl border flex items-start space-x-3 ${
                    planStatus.planColor === 'BLUE'
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <FolderGit2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Tình trạng Kế hoạch SCL năm {currentYear}
                    </span>
                    <p className="text-sm font-extrabold">{planStatus.statusLabel}</p>
                    <p className="text-xs leading-relaxed opacity-90">{planStatus.summaryText}</p>
                  </div>
                </div>
              </div>

              {/* Custom Cycle Quick Editor Box */}
              <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    Chu kỳ SCL Áp dụng cho Tài sản này:
                  </span>
                  <p className="text-amber-800">
                    {cycleStatus.isCustomCycle
                      ? `Đang áp dụng Chu kỳ riêng: ${cycleStatus.appliedCycleYears} năm`
                      : `Đang áp dụng Chu kỳ mặc định của nhóm "${asset.category}": ${cycleStatus.appliedCycleYears} năm`}
                  </p>
                </div>

                {isEditingCycle ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={customYearsInput}
                      onChange={(e) => setCustomYearsInput(Number(e.target.value))}
                      className="w-16 p-1.5 border border-amber-400 rounded font-bold text-center text-slate-900 bg-white"
                      min={1}
                      max={20}
                    />
                    <span className="font-bold text-amber-900">Năm</span>
                    <button
                      onClick={handleSaveCycle}
                      className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg shadow hover:bg-emerald-700"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setIsEditingCycle(false)}
                      className="px-2 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditingCycle(true);
                      setCustomYearsInput(cycleStatus.appliedCycleYears);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow transition-all"
                  >
                    Tùy chỉnh Chu kỳ Riêng
                  </button>
                )}
              </div>

              {/* Attributes Grid */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Loại tài sản:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{asset.category}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Đơn vị quản lý:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{asset.unit}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Vị trí lắp đặt:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{asset.location}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Năm đưa vào sử dụng:</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {asset.commissioningYear || 'Chưa cập nhật'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Năm SCL gần nhất:</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {asset.lastMajorRepairYear || 'Chưa thực hiện SCL'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Công trình SCL gần nhất:</span>
                  <p className="font-bold text-blue-900 mt-0.5">
                    {asset.lastMajorRepairProject || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REPAIR HISTORY */}
          {activeTab === 'repairs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800">Lịch sử SCL theo từng Công trình</h3>
                <button
                  onClick={() => setShowAddRepair(!showAddRepair)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Khai báo Đợt SCL Mới</span>
                </button>
              </div>

              {/* Form Add Repair */}
              {showAddRepair && (
                <form
                  onSubmit={handleCreateRepair}
                  className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-3 text-xs"
                >
                  <h4 className="font-bold text-slate-900">Khai báo Lần Sửa chữa Mới</h4>

                  <div>
                    <label className="font-bold text-slate-900 block mb-1">Tên Công trình SCL *:</label>
                    <input
                      type="text"
                      placeholder="VD: Công trình SCL Trạm 110kV Chợ Lớn 2024..."
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      required
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 placeholder:text-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-900 block mb-1">Loại sửa chữa:</label>
                      <select
                        value={newRepairType}
                        onChange={(e) => setNewRepairType(e.target.value as any)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                      >
                        <option value="SCL">SCL (Sửa chữa lớn)</option>
                        <option value="SCTX">SCTX (Thường xuyên)</option>
                        <option value="SCDX">SCDX (Đột xuất)</option>
                        <option value="DaiTu">Đại tu thiết bị</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-900 block mb-1">Năm thực hiện:</label>
                      <input
                        type="number"
                        value={newRepairYear}
                        onChange={(e) => setNewRepairYear(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-900 block mb-1">Ngày hoàn thành:</label>
                      <input
                        type="date"
                        value={newRepairEndDate}
                        onChange={(e) => setNewRepairEndDate(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-900 block mb-1">Nội dung công việc *:</label>
                    <input
                      type="text"
                      placeholder="Nội dung SCL chi tiết..."
                      value={newRepairContent}
                      onChange={(e) => setNewRepairContent(e.target.value)}
                      required
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 placeholder:text-slate-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddRepair(false)}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded font-bold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700"
                    >
                      Lưu bản ghi
                    </button>
                  </div>
                </form>
              )}

              {assetRepairs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border">
                  Chưa có lịch sử sửa chữa lớn nào được ghi nhận cho tài sản này.
                </div>
              ) : (
                <div className="space-y-3">
                  {assetRepairs.map((repair) => (
                    <div
                      key={repair.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2 text-xs hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                            Năm {repair.year}
                          </span>
                          <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {repair.repairType}
                          </span>
                          <span className="text-slate-500">{repair.endDate || repair.startDate}</span>
                        </div>
                        <button
                          onClick={() => deleteRepairRecord(repair.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                          title="Xóa bản ghi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="font-bold text-blue-950 flex items-center gap-1.5">
                        <FolderGit2 className="w-4 h-4 text-blue-600" />
                        <span>Công trình: {repair.projectName || 'Chưa phân loại'}</span>
                      </div>

                      <p className="font-semibold text-slate-900">{repair.workContent}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PLANS */}
          {activeTab === 'plans' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800">Thông tin trong Kế hoạch SCL theo Công trình</h3>
              {assetPlans.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border">
                  Tài sản chưa được đưa vào Công trình SCL nào trong năm {currentYear}.
                </div>
              ) : (
                <div className="space-y-3">
                  {assetPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                          KH SCL - Năm {plan.planYear}
                        </span>
                        <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {plan.status}
                        </span>
                      </div>

                      <p className="font-bold text-slate-900 text-sm">Công trình: {plan.projectName}</p>
                      {plan.workContent && <p className="text-slate-600">{plan.workContent}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CYCLE ENGINE BREAKDOWN */}
          {activeTab === 'cycle' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                <h3 className="font-bold text-sm text-slate-900">Chi tiết Giải thuật Tính Chu kỳ SCL</h3>
                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">Chu kỳ SCL đang áp dụng:</span>
                    <span className="font-bold">{cycleStatus.appliedCycleYears} năm {cycleStatus.isCustomCycle ? '(Chu kỳ riêng)' : '(Mặc định nhóm)'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">Số năm đã qua kể từ lần SCL gần nhất:</span>
                    <span className="font-bold text-blue-700">{cycleStatus.yearsElapsed !== null ? `${cycleStatus.yearsElapsed} năm` : 'Thiếu dữ liệu'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">Năm đạt mốc 5 năm (hoặc chu kỳ):</span>
                    <span className="font-bold text-amber-700">{cycleStatus.milestoneYear || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">Năm dự kiến đủ điều kiện tiếp theo:</span>
                    <span className="font-bold text-emerald-700">{cycleStatus.eligibleYear || 'N/A'}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800">Kết luận chi tiết:</span>
                  <p className="mt-1 text-slate-700 leading-relaxed font-medium">{cycleStatus.reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Nhật ký Lịch sử Chỉnh sửa & Biến động Dữ liệu</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-semibold">
                  Tổng số: <strong className="text-blue-700">{assetLogs.length}</strong> bản ghi nhật ký
                </span>
              </div>

              {assetLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border">
                  Chưa có nhật ký thay đổi riêng cho tài sản này. Tất cả các đợt chỉnh sửa mới sẽ tự động được ghi nhận tại đây.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {assetLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 shadow-sm hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between text-slate-600 flex-wrap gap-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-blue-900 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded text-[10px]">
                            {log.action}
                          </span>
                          <span className="font-bold text-slate-800">
                            Cán bộ: <span className="text-blue-700">{log.user || 'Tôn Tấn Lực'}</span>
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {formatVietnameseDateTime(log.timestamp)}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 text-xs leading-relaxed">
                        {log.details}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
          >
            Đóng Hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
};
