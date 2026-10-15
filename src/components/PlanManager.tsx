import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlanRecord } from '../types/asset';
import { exportToExcel } from '../services/excel';
import {
  FolderGit2,
  PlusCircle,
  Download,
  Search,
  CheckCircle2,
  Trash2,
  Building2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const PlanManager: React.FC = () => {
  const { planRecords, assets, currentYear, setCurrentYear, addPlanRecord, deletePlanRecord } =
    useApp();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [assetCodeInput, setAssetCodeInput] = useState('');
  const [projectNameInput, setProjectNameInput] = useState('');
  const [workContentInput, setWorkContentInput] = useState('');
  const [decisionNoInput, setDecisionNoInput] = useState('');
  const [estimatedCostInput, setEstimatedCostInput] = useState('');

  // Filter plans for selected year
  const yearPlans = planRecords.filter((p) => {
    if (p.planYear !== selectedYear) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const asset = assets.find((a) => a.assetCode === p.assetCode);
      return (
        p.assetCode.toLowerCase().includes(q) ||
        p.projectName.toLowerCase().includes(q) ||
        (p.planCode && p.planCode.toLowerCase().includes(q)) ||
        (asset && asset.assetName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Group plans by "Công trình"
  const groupedByProject = yearPlans.reduce<Record<string, PlanRecord[]>>((acc, plan) => {
    const proj = plan.projectName || 'Công trình chưa đặt tên';
    if (!acc[proj]) acc[proj] = [];
    acc[proj].push(plan);
    return acc;
  }, {});

  const projectNames = Object.keys(groupedByProject);

  const handleAddPlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetCodeInput.trim() || !projectNameInput.trim()) return;

    addPlanRecord({
      assetCode: assetCodeInput.trim(),
      planYear: selectedYear,
      planCode: `KH-SCL-${selectedYear}-${Date.now().toString().slice(-4)}`,
      projectName: projectNameInput.trim(),
      workContent: workContentInput.trim(),
      proposedUnit: 'Công ty Điện lực Chợ Lớn',
      proposedDate: new Date().toISOString().slice(0, 10),
      decisionNo: decisionNoInput.trim(),
      estimatedCost: estimatedCostInput ? Number(estimatedCostInput) : undefined,
      status: 'Approved',
      dataSource: 'Khai báo thủ công',
    });

    setShowAddModal(false);
    setAssetCodeInput('');
    setWorkContentInput('');
  };

  const handleExportPlansExcel = () => {
    const exportData: Record<string, unknown>[] = [];

    projectNames.forEach((projName) => {
      const items = groupedByProject[projName];
      items.forEach((p) => {
        const asset = assets.find((a) => a.assetCode === p.assetCode);
        exportData.push({
          'Tên Công trình': projName,
          'Năm kế hoạch': p.planYear,
          'Mã tài sản': p.assetCode,
          'Tên tài sản SCL': asset?.assetName || '',
          'Đơn vị quản lý': asset?.unit || '',
          'Nội dung công việc SCL': p.workContent || '',
          'Dự toán (VNĐ)': p.estimatedCost || 0,
          'Số quyết định': p.decisionNo || '',
          'Trạng thái': p.status,
          'Mã KH': p.planCode || p.id,
        });
      });
    });

    exportToExcel(exportData, `EVN_Ke_Hoach_SCL_Theo_Cong_Trinh_Nam_${selectedYear}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-blue-600" />
            Quản lý Kế hoạch Sửa chữa lớn (SCL) Phân loại theo Công trình
          </h2>
          <p className="text-xs text-slate-500">
            Hiển thị đầu mục theo Tên Công trình, liệt kê các mã tài sản cần SCL tương ứng theo từng công trình.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm Tài sản vào Công trình</span>
          </button>
          <button
            onClick={handleExportPlansExcel}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel Theo Công trình</span>
          </button>
        </div>
      </div>

      {/* Year Bar & Search */}
      <div className="bg-slate-800 text-white p-4 rounded-xl shadow flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-slate-300">Chọn Năm Kế hoạch SCL:</span>
          <div className="flex space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
            {[2024, 2025, 2026, 2027, 2028].map((yr) => (
              <button
                key={yr}
                onClick={() => {
                  setSelectedYear(yr);
                  setCurrentYear(yr);
                }}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  selectedYear === yr ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                Năm {yr}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm tên Công trình, mã tài sản..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Approved">Đã phê duyệt</option>
            <option value="Proposed">Đề xuất</option>
            <option value="Executing">Đang thực hiện</option>
          </select>
        </div>
      </div>

      {/* Main List grouped by Công trình */}
      {projectNames.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 space-y-2">
          <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">
            Chưa có Công trình SCL nào trong năm {selectedYear}
          </h3>
          <p className="text-xs">Bấm "Thêm Tài sản vào Công trình" để khởi tạo kế hoạch SCL theo công trình mới.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projectNames.map((projName, index) => {
            const projectItems = groupedByProject[projName];
            const totalProjectCost = projectItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

            return (
              <div
                key={projName}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              >
                {/* Công trình Block Header */}
                <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/80 flex items-center justify-center font-bold text-amber-300 text-sm border border-blue-400 shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-blue-300">
                        CÔNG TRÌNH SCL NĂM {selectedYear}
                      </span>
                      <h3 className="text-base font-extrabold text-white leading-snug">
                        {projName}
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Bao gồm <span className="font-bold text-amber-300">{projectItems.length}</span> tài sản/thiết bị thực hiện SCL
                      </p>
                    </div>
                  </div>

                  {totalProjectCost > 0 && (
                    <div className="text-right bg-blue-900/60 px-3 py-1.5 rounded-xl border border-blue-700/60 shrink-0">
                      <span className="text-[10px] text-blue-200 block">Tổng dự toán Công trình:</span>
                      <span className="font-extrabold text-amber-300 text-sm">
                        {totalProjectCost.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}
                </div>

                {/* Sub-table listing Assets under this Công trình */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                      <tr>
                        <th className="p-3">Mã TS</th>
                        <th className="p-3">Tên tài sản</th>
                        <th className="p-3">Nội dung công việc SCL</th>
                        <th className="p-3">Dự toán (VNĐ)</th>
                        <th className="p-3">Số quyết định</th>
                        <th className="p-3">Trạng thái</th>
                        <th className="p-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projectItems.map((item) => {
                        const asset = assets.find((a) => a.assetCode === item.assetCode);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                              {item.assetCode}
                            </td>
                            <td className="p-3 font-bold text-slate-800 max-w-xs">
                              <div>{asset?.assetName || 'Tài sản'}</div>
                              <span className="text-[10px] text-slate-500 font-normal">
                                {asset?.unit} • {asset?.location}
                              </span>
                            </td>
                            <td className="p-3 font-medium text-slate-800">
                              {item.workContent || 'Sửa chữa lớn theo chu kỳ'}
                            </td>
                            <td className="p-3 font-bold text-emerald-700 whitespace-nowrap">
                              {item.estimatedCost ? `${item.estimatedCost.toLocaleString('vi-VN')} đ` : '-'}
                            </td>
                            <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                              {item.decisionNo || '-'}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                {item.status}
                              </span>
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => {
                                  if (confirm(`Xóa tài sản ${item.assetCode} khỏi công trình "${projName}"?`)) {
                                    deletePlanRecord(item.id);
                                  }
                                }}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                                title="Xóa khỏi công trình"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">
              Bổ sung Tài sản vào Kế hoạch SCL Năm {selectedYear}
            </h3>

            <form onSubmit={handleAddPlanSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Tên Công trình * (Đầu mục):</label>
                <input
                  type="text"
                  placeholder="VD: Công trình SCL Trạm 110kV Chợ Lớn 2026..."
                  value={projectNameInput}
                  onChange={(e) => setProjectNameInput(e.target.value)}
                  required
                  className="w-full mt-1 p-2 bg-slate-50 border rounded font-bold text-slate-900"
                  list="existing-projects"
                />
                <datalist id="existing-projects">
                  {projectNames.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Mã tài sản SCL *:</label>
                <input
                  type="text"
                  placeholder="VD: EVN-CL-MC22-01"
                  value={assetCodeInput}
                  onChange={(e) => setAssetCodeInput(e.target.value)}
                  required
                  className="w-full mt-1 p-2 bg-slate-50 border rounded font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Nội dung công việc SCL dự kiến:</label>
                <textarea
                  placeholder="Bảo dưỡng, thay thế bộ truyền động, nạp khí SF6..."
                  value={workContentInput}
                  onChange={(e) => setWorkContentInput(e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2 bg-slate-50 border rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Dự toán kinh phí (VNĐ):</label>
                  <input
                    type="number"
                    placeholder="185000000"
                    value={estimatedCostInput}
                    onChange={(e) => setEstimatedCostInput(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border rounded font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Số quyết định phê duyệt:</label>
                  <input
                    type="text"
                    placeholder="QĐ-8899/QĐ-EVNHCMC"
                    value={decisionNoInput}
                    onChange={(e) => setDecisionNoInput(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border rounded font-mono"
                  />
                </div>
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
                  Lưu vào Công trình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
