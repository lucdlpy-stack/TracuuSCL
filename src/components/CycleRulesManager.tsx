import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CycleRule, RuleMode, AssetCategory, RepairType } from '../types/asset';
import {
  SlidersHorizontal,
  PlusCircle,
  Check,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit,
  Save,
  Info,
  Sparkles,
  FileText,
  Building2,
  ShieldCheck,
} from 'lucide-react';

export const CycleRulesManager: React.FC = () => {
  const {
    cycleRules,
    addCycleRule,
    updateCycleRule,
    deleteCycleRule,
    assets,
    getAssetCycleStatus,
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add rule form state
  const [groupName, setGroupName] = useState('');
  const [category, setCategory] = useState<AssetCategory | 'Tất cả'>('Thiết bị đóng cắt');
  const [cycleYears, setCycleYears] = useState<number>(5);
  const [cycleMonths, setCycleMonths] = useState<number>(60);
  const [ruleMode, setRuleMode] = useState<RuleMode>('Greater');
  const [basisWorkType, setBasisWorkType] = useState<RepairType>('SCL');
  const [documentNo, setDocumentNo] = useState('');
  const [documentSource, setDocumentSource] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    addCycleRule({
      groupName: groupName.trim(),
      category,
      cycleYears,
      cycleMonths: cycleMonths || cycleYears * 12,
      basisWorkType,
      ruleMode,
      documentNo: documentNo.trim() || undefined,
      documentSource: documentSource.trim() || undefined,
      effectiveDate: new Date().toISOString().slice(0, 10),
      status: 'Active',
    });

    setShowAddModal(false);
    setGroupName('');
    setDocumentNo('');
    setDocumentSource('');
    triggerToast('Đã thêm quy tắc chu kỳ bảo trì mới!');
  };

  const handleUpdateYears = (id: string, years: number) => {
    updateCycleRule(id, {
      cycleYears: years,
      cycleMonths: years * 12,
    });
    triggerToast('Đã lưu thay đổi chu kỳ!');
  };

  const handleUpdateMonths = (id: string, months: number) => {
    updateCycleRule(id, {
      cycleMonths: months,
      cycleYears: Math.max(1, Math.round(months / 12)),
    });
    triggerToast('Đã lưu thay đổi chu kỳ!');
  };

  const handleUpdateMode = (id: string, mode: RuleMode) => {
    updateCycleRule(id, { ruleMode: mode });
    triggerToast('Đã cập nhật điều kiện cảnh báo!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl font-bold text-xs flex items-center space-x-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-blue-600" />
            Quản lý Cấu hình Chu kỳ Bảo trì theo Nhóm Tài sản
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập chu kỳ (năm/tháng), điều kiện cảnh báo (Đủ mốc / Vượt mốc) và văn bản áp dụng. Quy tắc được tự động lưu vào Context & Storage.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Thêm Quy tắc Nhóm Mới</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs space-y-1">
          <span className="font-bold text-blue-900 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Số quy tắc đang áp dụng:
          </span>
          <p className="text-2xl font-black text-blue-950">
            {cycleRules.filter((r) => r.status === 'Active').length} Quy tắc
          </p>
          <p className="text-slate-600">Áp dụng cho toàn bộ danh mục tài sản EVN</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-1">
          <span className="font-bold text-amber-900 flex items-center gap-1">
            <Clock className="w-4 h-4 text-amber-600" />
            Chế độ Vượt mốc (&gt; chu kỳ):
          </span>
          <p className="text-2xl font-black text-amber-950">
            {cycleRules.filter((r) => r.ruleMode === 'Greater').length} Quy tắc
          </p>
          <p className="text-amber-800">Cảnh báo xanh khi số năm đã qua lớn hơn chu kỳ</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs space-y-1">
          <span className="font-bold text-emerald-900 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Chế độ Đủ mốc (&ge; chu kỳ):
          </span>
          <p className="text-2xl font-black text-emerald-950">
            {cycleRules.filter((r) => r.ruleMode === 'Exact').length} Quy tắc
          </p>
          <p className="text-emerald-800">Cảnh báo xanh ngay khi đạt kỷ niệm mốc chu kỳ</p>
        </div>
      </div>

      {/* Rules Grid Matrix */}
      <div className="space-y-4">
        {cycleRules.map((rule) => {
          // Count assets affected by this rule
          const affectedAssets = assets.filter(
            (a) => rule.category === 'Tất cả' || a.category === rule.category
          );

          return (
            <div
              key={rule.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4 hover:border-blue-300 transition-all"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-base text-slate-900">{rule.groupName}</h3>
                    <span className="bg-blue-100 text-blue-900 font-bold px-2.5 py-0.5 rounded text-xs">
                      {rule.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Áp dụng cho <span className="font-bold text-blue-700">{affectedAssets.length}</span> tài sản trong danh mục
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      rule.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {rule.status === 'Active' ? 'Đang hiệu lực' : 'Ngừng áp dụng'}
                  </span>

                  <button
                    onClick={() => {
                      if (confirm(`Xóa quy tắc "${rule.groupName}"?`)) {
                        deleteCycleRule(rule.id);
                        triggerToast('Đã xóa quy tắc!');
                      }
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="Xóa quy tắc"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* Years input */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <label className="font-bold text-slate-700 block">Chu kỳ (Năm):</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={rule.cycleYears}
                      onChange={(e) => handleUpdateYears(rule.id, Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded font-extrabold text-sm text-blue-900 focus:ring-2 focus:ring-blue-500"
                      min={1}
                      max={30}
                    />
                    <span className="font-bold text-slate-600 shrink-0">Năm</span>
                  </div>
                </div>

                {/* Months input */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <label className="font-bold text-slate-700 block">Tương đương (Tháng):</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={rule.cycleMonths || rule.cycleYears * 12}
                      onChange={(e) => handleUpdateMonths(rule.id, Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded font-extrabold text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                      min={1}
                      max={360}
                    />
                    <span className="font-bold text-slate-600 shrink-0">Tháng</span>
                  </div>
                </div>

                {/* Warning Condition selector */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <label className="font-bold text-slate-700 block">Điều kiện cảnh báo:</label>
                  <select
                    value={rule.ruleMode}
                    onChange={(e) => handleUpdateMode(rule.id, e.target.value as RuleMode)}
                    className="w-full p-2 bg-white border border-slate-300 rounded font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Greater">Phải lớn hơn chu kỳ (&gt; mốc)</option>
                    <option value="Exact">Đủ mốc chu kỳ (&ge; mốc)</option>
                  </select>
                </div>

                {/* Document Reference */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <label className="font-bold text-slate-700 block">Số hiệu văn bản quy định:</label>
                  <input
                    type="text"
                    value={rule.documentNo || ''}
                    onChange={(e) => updateCycleRule(rule.id, { documentNo: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded font-mono text-slate-800 text-xs"
                    placeholder="QĐ-315/QĐ-EVN-KT..."
                  />
                </div>
              </div>

              {/* Basis & Explanation Footer */}
              <div className="text-[11px] text-slate-600 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 flex items-center justify-between">
                <span>
                  <strong>Căn cứ công việc:</strong> {rule.basisWorkType} (Sửa chữa lớn) •{' '}
                  <strong>Văn bản nguồn:</strong> {rule.documentSource || 'Quy định bảo trì EVN'}
                </span>
                <span className="text-slate-400">Cập nhật: {new Date(rule.updatedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">
              Thêm Quy tắc Chu kỳ Bảo trì Mới
            </h3>

            <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Tên nhóm tài sản *:</label>
                <input
                  type="text"
                  placeholder="VD: Thiết bị đo lường & Rơ le bảo vệ"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  className="w-full mt-1 p-2 bg-slate-50 border rounded font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Loại tài sản áp dụng:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full mt-1 p-2 bg-slate-50 border rounded font-semibold"
                >
                  <option value="Thiết bị đóng cắt">Thiết bị đóng cắt</option>
                  <option value="Máy biến áp / Trạm biến áp">Máy biến áp / Trạm biến áp</option>
                  <option value="Đường dây trung thế / hạ thế">Đường dây trung / hạ thế</option>
                  <option value="Đường dây truyền tải">Đường dây truyền tải</option>
                  <option value="Nhà cửa & Công trình xây dựng">Nhà cửa & Công trình</option>
                  <option value="Ô tô & Xe chuyên dùng">Ô tô & Xe chuyên dùng</option>
                  <option value="Thiết bị đo lường & Rơ le">Thiết bị đo lường & Rơ le</option>
                  <option value="Tất cả">Tất cả tài sản</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Chu kỳ tính bằng Năm:</label>
                  <input
                    type="number"
                    value={cycleYears}
                    onChange={(e) => {
                      const yr = Number(e.target.value);
                      setCycleYears(yr);
                      setCycleMonths(yr * 12);
                    }}
                    min={1}
                    max={30}
                    className="w-full mt-1 p-2 bg-slate-50 border rounded font-bold text-blue-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Tương đương Tháng:</label>
                  <input
                    type="number"
                    value={cycleMonths}
                    onChange={(e) => setCycleMonths(Number(e.target.value))}
                    min={1}
                    max={360}
                    className="w-full mt-1 p-2 bg-slate-50 border rounded font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Điều kiện phát cảnh báo:</label>
                <select
                  value={ruleMode}
                  onChange={(e) => setRuleMode(e.target.value as RuleMode)}
                  className="w-full mt-1 p-2 bg-slate-50 border rounded font-semibold"
                >
                  <option value="Greater">Phải lớn hơn chu kỳ (&gt; mốc) [Mặc định]</option>
                  <option value="Exact">Đủ mốc chu kỳ (&ge; mốc)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Số hiệu văn bản áp dụng:</label>
                <input
                  type="text"
                  placeholder="QĐ-315/QĐ-EVN-KT"
                  value={documentNo}
                  onChange={(e) => setDocumentNo(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border rounded font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Nguồn quy định:</label>
                <input
                  type="text"
                  placeholder="Quy trình vận hành bảo trì EVN..."
                  value={documentSource}
                  onChange={(e) => setDocumentSource(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border rounded"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  Tạo Quy tắc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
