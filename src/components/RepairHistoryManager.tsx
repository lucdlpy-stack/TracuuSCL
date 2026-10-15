import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RepairRecord } from '../types/asset';
import { exportToExcel } from '../services/excel';
import {
  History,
  PlusCircle,
  Download,
  Search,
  Trash2,
  FolderGit2,
  Building2,
  Calendar,
} from 'lucide-react';

export const RepairHistoryManager: React.FC = () => {
  const { repairRecords, assets, deleteRepairRecord, addRepairRecord } = useApp();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Form modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [assetCode, setAssetCode] = useState('');
  const [repairType, setRepairType] = useState<RepairRecord['repairType']>('SCL');
  const [projectName, setProjectName] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [workContent, setWorkContent] = useState('');
  const [contractor, setContractor] = useState('');
  const [decisionNo, setDecisionNo] = useState('');
  const [cost, setCost] = useState('');

  // Filter repair records
  const filteredRepairs = repairRecords.filter((repair) => {
    if (typeFilter !== 'ALL' && repair.repairType !== typeFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const asset = assets.find((a) => a.assetCode === repair.assetCode);
      return (
        repair.assetCode.toLowerCase().includes(q) ||
        repair.workContent.toLowerCase().includes(q) ||
        (repair.projectName && repair.projectName.toLowerCase().includes(q)) ||
        (repair.contractor && repair.contractor.toLowerCase().includes(q)) ||
        (asset && asset.assetName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetCode.trim() || !workContent.trim()) return;

    addRepairRecord({
      assetCode: assetCode.trim(),
      repairType,
      projectName: projectName.trim() || 'Công trình SCL chưa đặt tên',
      year,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      workContent: workContent.trim(),
      contractor: contractor.trim() || undefined,
      decisionNo: decisionNo.trim() || undefined,
      cost: cost ? Number(cost) : undefined,
      acceptanceResult: 'Đã nghiệm thu',
      status: 'Completed',
      dataSource: 'Khai báo trực tiếp',
    });

    setShowAddModal(false);
    setAssetCode('');
    setWorkContent('');
    setProjectName('');
  };

  const handleExportRepairsExcel = () => {
    const exportData = filteredRepairs.map((r) => {
      const asset = assets.find((a) => a.assetCode === r.assetCode);
      return {
        'Mã bản ghi': r.id,
        'Mã tài sản': r.assetCode,
        'Tên tài sản': asset?.assetName || '',
        'Công trình SCL': r.projectName || 'Mặc định',
        'Loại sửa chữa': r.repairType,
        'Năm thực hiện': r.year,
        'Ngày hoàn thành': r.endDate || r.startDate || '',
        'Nội dung công việc': r.workContent,
        'Đơn vị thực hiện': r.contractor || '',
        'Chi phí (VNĐ)': r.cost || 0,
        'Số quyết định': r.decisionNo || '',
        'Nghiệm thu': r.acceptanceResult || 'Đã nghiệm thu',
        'Nguồn dữ liệu': r.dataSource,
      };
    });

    exportToExcel(exportData, `EVN_Lich_Su_Sua_Chua_${new Date().getFullYear()}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Lịch sử Sửa chữa Tương ứng theo từng Công trình
          </h2>
          <p className="text-xs text-slate-500">
            Theo dõi chính xác tài sản nào được sửa chữa theo đợt/Công trình nào qua từng năm.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Khai báo Đợt SCL Mới</span>
          </button>
          <button
            onClick={handleExportRepairsExcel}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel Lịch sử ({filteredRepairs.length})</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Tìm mã TS, Tên Công trình, nội dung công việc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 font-semibold focus:outline-none"
        >
          <option value="ALL">-- Tất cả loại sửa chữa --</option>
          <option value="SCL">SCL (Sửa chữa lớn)</option>
          <option value="SCTX">SCTX (Thường xuyên)</option>
          <option value="SCDX">SCDX (Đột xuất)</option>
          <option value="DaiTu">Đại tu thiết bị</option>
        </select>
      </div>

      {/* Repair Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800 text-white font-bold uppercase text-[11px]">
              <tr>
                <th className="p-3.5">Mã TS</th>
                <th className="p-3.5">Tên tài sản</th>
                <th className="p-3.5">Công trình SCL</th>
                <th className="p-3.5">Loại & Năm</th>
                <th className="p-3.5">Nội dung sửa chữa</th>
                <th className="p-3.5">Đơn vị thực hiện</th>
                <th className="p-3.5">Chi phí (VNĐ)</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRepairs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Không có bản ghi lịch sử sửa chữa nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredRepairs.map((r) => {
                  const asset = assets.find((a) => a.assetCode === r.assetCode);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-blue-900 whitespace-nowrap">{r.assetCode}</td>
                      <td className="p-3.5 font-bold text-slate-800 max-w-xs">{asset?.assetName || 'Tài sản'}</td>
                      <td className="p-3.5 font-bold text-blue-950 max-w-xs">
                        <div className="flex items-center space-x-1">
                          <FolderGit2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">{r.projectName || 'Mặc định'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold mr-1">
                          {r.repairType}
                        </span>
                        <span className="font-extrabold text-slate-900">{r.year}</span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">{r.workContent}</td>
                      <td className="p-3.5 text-slate-600">{r.contractor || '-'}</td>
                      <td className="p-3.5 font-bold text-emerald-700 whitespace-nowrap">
                        {r.cost ? `${r.cost.toLocaleString('vi-VN')} đ` : '-'}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            if (confirm('Bạn có chắc chắn muốn xóa bản ghi sửa chữa này?')) {
                              deleteRepairRecord(r.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                          title="Xóa bản ghi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">
              Khai báo Bản ghi Lịch sử SCL Mới
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Mã tài sản *:</label>
                <input
                  type="text"
                  placeholder="VD: EVN-CL-MC22-01"
                  value={assetCode}
                  onChange={(e) => setAssetCode(e.target.value)}
                  required
                  className="w-full mt-1 p-2 bg-slate-50 border rounded font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Tên Công trình SCL *:</label>
                <input
                  type="text"
                  placeholder="VD: Công trình SCL Trạm 110kV Chợ Lớn 2024..."
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  className="w-full mt-1 p-2 bg-slate-50 border rounded font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Loại sửa chữa:</label>
                  <select
                    value={repairType}
                    onChange={(e) => setRepairType(e.target.value as any)}
                    className="w-full mt-1 p-2 bg-slate-50 border rounded font-bold"
                  >
                    <option value="SCL">SCL (Sửa chữa lớn)</option>
                    <option value="SCTX">SCTX (Thường xuyên)</option>
                    <option value="SCDX">SCDX (Đột xuất)</option>
                    <option value="DaiTu">Đại tu thiết bị</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Năm thực hiện:</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-slate-50 border rounded font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Nội dung công việc *:</label>
                <textarea
                  placeholder="Nội dung bảo dưỡng SCL..."
                  value={workContent}
                  onChange={(e) => setWorkContent(e.target.value)}
                  required
                  rows={2}
                  className="w-full mt-1 p-2 bg-slate-50 border rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Đơn vị thực hiện:</label>
                  <input
                    type="text"
                    placeholder="Xí nghiệp Dịch vụ..."
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Chi phí (VNĐ):</label>
                  <input
                    type="number"
                    placeholder="185000000"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border rounded font-bold text-emerald-700"
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
                  Lưu Bản ghi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
