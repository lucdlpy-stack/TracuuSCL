import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CycleRule, RuleMode } from '../types/asset';
import {
  Settings,
  Sparkles,
  Database,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Cloud,
  SlidersHorizontal,
  Clock,
  Save,
  Check,
} from 'lucide-react';

export const ConfigSync: React.FC = () => {
  const {
    cycleRules,
    updateCycleRule,
    loadTestScenarios,
    resetToSeedData,
    exportAllDataJSON,
    restoreAllDataJSON,
    systemLogs,
  } = useApp();

  const [jsonInput, setJsonInput] = useState('');
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const handleRuleChange = (
    id: string,
    updates: Partial<CycleRule>
  ) => {
    updateCycleRule(id, updates);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleDownloadJSON = () => {
    const dataStr = exportAllDataJSON();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EVN_SCL_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  const handleRestoreJSONSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonInput.trim()) return;

    const ok = restoreAllDataJSON(jsonInput.trim());
    if (ok) {
      alert('Khôi phục thành công toàn bộ dữ liệu hệ thống từ file JSON!');
      setJsonInput('');
    } else {
      alert('Lỗi định dạng JSON! Vui lòng kiểm tra lại cấu trúc file sao lưu.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Cấu hình Chu kỳ Bảo trì theo Nhóm Tài sản & Điều kiện Cảnh báo
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tùy chỉnh số năm hoặc số tháng chu kỳ SCL và điều kiện cảnh báo (Đủ mốc / Vượt mốc) theo quy định nội bộ EVN.
          </p>
        </div>

        {saveToast && (
          <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-bounce">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Đã cập nhật quy tắc chu kỳ!</span>
          </div>
        )}
      </div>

      {/* Test Scenarios & Quick Reset Box */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Nạp Dữ liệu Kiểm thử Nghiệp vụ SCL EVN (Kịch bản Chuẩn)
            </h3>
            <p className="text-xs text-blue-200">
              Tự động thêm các kịch bản kiểm thử: SCL 2024 (Đỏ), 2021 (Vàng), 2020 (Xanh), Chu kỳ tùy chỉnh riêng 3 năm, công trình SCL...
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={loadTestScenarios}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              Nạp Kịch bản Test SCL
            </button>
            <button
              onClick={() => {
                if (confirm('Khôi phục lại dữ liệu mẫu mặc định ban đầu?')) {
                  resetToSeedData();
                }
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-600"
            >
              Đặt lại Mặc định
            </button>
          </div>
        </div>
      </div>

      {/* Cycle Rules Configuration Form Matrix (Section XVI Requirement) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              Bảng Cấu hình Chu kỳ Bảo trì cho Từng Nhóm Thiết bị
            </h3>
            <p className="text-xs text-slate-500">
              Thay đổi số năm hoặc số tháng chu kỳ và điều kiện cảnh báo để hệ thống tự động tính lại ngay lập tức.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {cycleRules.map((rule) => (
            <div
              key={rule.id}
              className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-900 text-sm">{rule.groupName}</span>
                  <span className="bg-blue-100 text-blue-900 font-bold px-2.5 py-0.5 rounded text-[11px]">
                    {rule.category}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Mã quy tắc: {rule.id}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {/* Years */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Chu kỳ tính theo Năm:</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={rule.cycleYears}
                      onChange={(e) => {
                        const yr = Number(e.target.value);
                        handleRuleChange(rule.id, {
                          cycleYears: yr,
                          cycleMonths: yr * 12,
                        });
                      }}
                      className="w-full p-2 bg-white border rounded font-bold text-blue-900 text-sm"
                      min={1}
                      max={30}
                    />
                    <span className="font-bold text-slate-600">Năm</span>
                  </div>
                </div>

                {/* Months */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tương đương theo Tháng:</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={rule.cycleMonths || rule.cycleYears * 12}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        handleRuleChange(rule.id, {
                          cycleMonths: m,
                          cycleYears: Math.max(1, Math.round(m / 12)),
                        });
                      }}
                      className="w-full p-2 bg-white border rounded font-bold text-slate-800 text-sm"
                      min={1}
                      max={360}
                    />
                    <span className="font-bold text-slate-600">Tháng</span>
                  </div>
                </div>

                {/* Warning Condition Rule Mode */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Điều kiện cảnh báo:</label>
                  <select
                    value={rule.ruleMode}
                    onChange={(e) =>
                      handleRuleChange(rule.id, { ruleMode: e.target.value as RuleMode })
                    }
                    className="w-full p-2 bg-white border rounded font-semibold text-slate-900"
                  >
                    <option value="Greater">Phải lớn hơn chu kỳ (&gt; mốc) [Mặc định]</option>
                    <option value="Exact">Đủ mốc chu kỳ (&ge; mốc)</option>
                  </select>
                </div>

                {/* Document Ref */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Số hiệu văn bản áp dụng:</label>
                  <input
                    type="text"
                    value={rule.documentNo || ''}
                    onChange={(e) => handleRuleChange(rule.id, { documentNo: e.target.value })}
                    className="w-full p-2 bg-white border rounded font-mono text-slate-800"
                    placeholder="QĐ-315/QĐ-EVN-KT..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* JSON Backup & Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600" />
            Sao lưu Dữ liệu Hệ thống (JSON Backup)
          </h3>
          <p className="text-slate-600 leading-relaxed">
            Tải về toàn bộ danh mục tài sản, lịch sử sửa chữa, kế hoạch SCL theo công trình, quy tắc chu kỳ và nhật ký thay đổi.
          </p>
          <button
            onClick={handleDownloadJSON}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow"
          >
            Tải về File JSON Sao lưu
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-600" />
            Khôi phục Dữ liệu từ JSON
          </h3>
          <form onSubmit={handleRestoreJSONSubmit} className="space-y-2">
            <textarea
              placeholder="Dán nội dung file JSON sao lưu vào đây..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={3}
              className="w-full p-2 bg-slate-50 border rounded font-mono text-[11px]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow"
            >
              Khôi phục Toàn bộ Dữ liệu
            </button>
          </form>
        </div>
      </div>

      {/* Firebase Cloud Sync Guide Box */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 text-xs">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            Hướng dẫn Cấu hình Đồng bộ Đa thiết bị qua Firebase Firestore
          </h3>
          <button
            onClick={() => setShowFirebaseGuide(!showFirebaseGuide)}
            className="text-blue-600 font-bold hover:underline"
          >
            {showFirebaseGuide ? 'Ẩn hướng dẫn' : 'Xem chi tiết'}
          </button>
        </div>

        <p className="text-slate-600 leading-relaxed">
          Ứng dụng hiện đang hoạt động ở chế độ <strong className="text-blue-900">Cục bộ An toàn (Offline LocalStorage)</strong>. Khi kết nối Firebase Firestore, toàn bộ kế hoạch SCL theo công trình và chu kỳ sẽ tự động đồng bộ theo thời gian thực giữa máy tính và di động.
        </p>

        {showFirebaseGuide && (
          <div className="p-4 bg-slate-50 rounded-xl border space-y-3 text-slate-700 leading-relaxed">
            <h4 className="font-bold text-slate-900">Quy trình kết nối Firebase Firestore:</h4>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Mở công cụ cấu hình dịch vụ trên AI Studio và kích hoạt Firebase Project.</li>
              <li>Tạo Firestore Database với quy tắc bảo mật xác thực người dùng RBAC.</li>
              <li>Hệ thống tự động đồng bộ các bộ sưu tập <code>assets</code>, <code>repairs</code>, <code>plans</code>, <code>rules</code>.</li>
            </ol>
          </div>
        )}
      </div>

      {/* System Audit Logs Viewer */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3 text-xs">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <History className="w-4 h-4 text-slate-600" />
          Nhật ký Thay đổi Dữ liệu Hệ thống ({systemLogs.length} bản ghi)
        </h3>

        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 font-mono text-[11px]">
          {systemLogs.map((log) => (
            <div key={log.id} className="py-2 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-blue-900">{log.user}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">
                    {log.action}
                  </span>
                  <span className="text-slate-400">{log.targetType}:{log.targetId}</span>
                </div>
                <p className="text-slate-800 font-sans">{log.details}</p>
              </div>
              <span className="text-slate-400 shrink-0">{new Date(log.timestamp).toLocaleTimeString('vi-VN')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
