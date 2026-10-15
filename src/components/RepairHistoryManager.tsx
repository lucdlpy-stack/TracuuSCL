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
  ChevronDown,
  ChevronUp,
  Wrench,
  DollarSign,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export const RepairHistoryManager: React.FC = () => {
  const {
    repairRecords,
    assets,
    deleteRepairRecord,
    addRepairRecord,
    setSelectedAssetCode,
  } = useApp();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});

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
    if (yearFilter !== 'ALL' && repair.year !== Number(yearFilter)) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const asset = assets.find((a) => a.assetCode.toLowerCase() === repair.assetCode.toLowerCase());
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

  // Group repair records by Project Name (Tên Công trình)
  const groupedByProject = filteredRepairs.reduce((acc, repair) => {
    const key = repair.projectName?.trim() || 'Công trình SCL Độc lập / Tổng hợp';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(repair);
    return acc;
  }, {} as Record<string, RepairRecord[]>);

  const projectNames = Object.keys(groupedByProject);

  // Available years for filter
  const availableYears = Array.from(new Set(repairRecords.map((r) => r.year))).sort((a, b) => b - a);

  // Existing project names for quick auto-suggest
  const existingProjectNames = Array.from(
    new Set(repairRecords.map((r) => r.projectName).filter(Boolean))
  ) as string[];

  const toggleProject = (name: string) => {
    setCollapsedProjects((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetCode.trim() || !workContent.trim()) return;

    addRepairRecord({
      assetCode: assetCode.trim().toUpperCase(),
      repairType,
      projectName: projectName.trim() || 'Công trình SCL tổng hợp',
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
    setStartDate('');
    setEndDate('');
    setCost('');
  };

  const handleExportRepairsExcel = () => {
    const exportData = filteredRepairs.map((r) => {
      const asset = assets.find((a) => a.assetCode === r.assetCode);
      return {
        'Tên Công trình SCL': r.projectName || 'Mặc định',
        'Mã tài sản': r.assetCode,
        'Tên tài sản': asset?.assetName || '',
        'Loại tài sản': asset?.category || '',
        'Đơn vị QLVH': asset?.unit || '',
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

    exportToExcel(exportData, `EVN_Lich_Su_Sua_Chua_Theo_Cong_Trinh_${new Date().getFullYear()}`);
  };

  // Grand stats
  const totalCostAll = filteredRepairs.reduce((sum, r) => sum + (r.cost || 0), 0);

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Lịch sử Sửa chữa Phân loại theo Từng Công trình
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Đầu mục thể hiện Tên Công trình trước, bên trong liệt kê các mã tài sản được sửa chữa theo từng công trình.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Khai báo SCL Mới</span>
          </button>
          <button
            onClick={handleExportRepairsExcel}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel ({filteredRepairs.length})</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Tổng số Công trình SCL</span>
            <div className="text-xl font-black text-slate-900">{projectNames.length} công trình</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Lượt Tài sản Sửa chữa</span>
            <div className="text-xl font-black text-slate-900">{filteredRepairs.length} lượt</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Tổng Giá trị Chi phí SCL</span>
            <div className="text-xl font-black text-emerald-700">
              {totalCostAll > 0 ? `${(totalCostAll / 1_000_000).toFixed(1)} tr đ` : '0 đ'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar with Solid Black Text on White Background */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-3 text-xs items-center">
        {/* Search Input with Solid Black Text */}
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Tìm kiếm Tên Công trình, mã tài sản, nội dung SCL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white text-slate-900 font-bold placeholder:text-slate-500 text-xs rounded-xl border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Year Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="font-bold text-slate-700 whitespace-nowrap">Năm thực hiện:</span>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">-- Tất cả các năm --</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                Năm {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="font-bold text-slate-700 whitespace-nowrap">Loại sửa chữa:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">-- Tất cả loại SCL --</option>
            <option value="SCL">SCL (Sửa chữa lớn)</option>
            <option value="SCTX">SCTX (Thường xuyên)</option>
            <option value="SCDX">SCDX (Đột xuất)</option>
            <option value="DaiTu">Đại tu thiết bị</option>
          </select>
        </div>

        {/* Expand / Collapse All Toggle */}
        <div className="ml-auto flex items-center space-x-2">
          <button
            onClick={() => setCollapsedProjects({})}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
          >
            Mở rộng tất cả
          </button>
          <button
            onClick={() => {
              const allCollapsed = projectNames.reduce((acc, p) => ({ ...acc, [p]: true }), {});
              setCollapsedProjects(allCollapsed);
            }}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
          >
            Thu gọn tất cả
          </button>
        </div>
      </div>

      {/* Main Content: Grouped by Công trình */}
      {projectNames.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 space-y-2">
          <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">
            Không tìm thấy bản ghi lịch sử sửa chữa nào phù hợp
          </h3>
          <p className="text-xs">Hãy thử thay đổi từ khóa tìm kiếm hoặc bấm "Khai báo SCL Mới" để thêm bản ghi.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projectNames.map((projName) => {
            const repairsInProject = groupedByProject[projName];
            const isCollapsed = !!collapsedProjects[projName];
            const projectCost = repairsInProject.reduce((sum, r) => sum + (r.cost || 0), 0);
            const projectYears = Array.from(new Set(repairsInProject.map((r) => r.year))).sort();
            const contractorNames = Array.from(
              new Set(repairsInProject.map((r) => r.contractor).filter(Boolean))
            );

            return (
              <div
                key={projName}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all"
              >
                {/* Project Header Bar (Đầu mục thể hiện Tên Công Trình) */}
                <div
                  onClick={() => toggleProject(projName)}
                  className="p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:brightness-110 transition-all select-none"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                      <FolderGit2 className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white">
                          Công trình SCL
                        </span>
                        <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                          {projName}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-blue-200/90 mt-1 flex-wrap gap-y-1">
                        <span>
                          Năm: <strong>{projectYears.join(', ')}</strong>
                        </span>
                        {contractorNames.length > 0 && (
                          <span>
                            • Đơn vị thi công: <strong>{contractorNames.join(', ')}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-300">
                        {repairsInProject.length} mã tài sản
                      </div>
                      {projectCost > 0 && (
                        <div className="text-[11px] text-emerald-300 font-extrabold">
                          {projectCost.toLocaleString('vi-VN')} đ
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="p-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-white"
                      title={isCollapsed ? 'Mở rộng công trình' : 'Thu gọn công trình'}
                    >
                      {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Sub-table: Assets repaired under this specific project */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="p-3 w-32">Mã tài sản</th>
                          <th className="p-3">Tên tài sản & Chủng loại</th>
                          <th className="p-3 w-28">Loại SCL</th>
                          <th className="p-3 w-28">Năm / Ngày</th>
                          <th className="p-3">Nội dung công việc sửa chữa</th>
                          <th className="p-3 w-36">Đơn vị thực hiện</th>
                          <th className="p-3 w-32">Chi phí (VNĐ)</th>
                          <th className="p-3 w-24 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {repairsInProject.map((repair) => {
                          const asset = assets.find(
                            (a) => a.assetCode.toLowerCase() === repair.assetCode.toLowerCase()
                          );

                          return (
                            <tr key={repair.id} className="hover:bg-blue-50/50 transition-colors">
                              {/* Asset Code */}
                              <td className="p-3 whitespace-nowrap">
                                <button
                                  onClick={() => setSelectedAssetCode(repair.assetCode)}
                                  className="font-mono font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center space-x-1 cursor-pointer"
                                  title="Xem chi tiết tài sản này"
                                >
                                  <span>{repair.assetCode}</span>
                                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                                </button>
                              </td>

                              {/* Asset Name & Category */}
                              <td className="p-3 font-semibold text-slate-900">
                                <div>{asset?.assetName || 'Tài sản EVN'}</div>
                                <div className="text-[10px] text-slate-500 font-normal">
                                  {asset?.category} {asset?.unit ? `• ${asset.unit}` : ''}
                                </div>
                              </td>

                              {/* Repair Type */}
                              <td className="p-3 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-extrabold text-[10px] border border-blue-200">
                                  {repair.repairType}
                                </span>
                              </td>

                              {/* Year & Date */}
                              <td className="p-3 whitespace-nowrap">
                                <div className="font-extrabold text-slate-900">Năm {repair.year}</div>
                                {(repair.endDate || repair.startDate) && (
                                  <div className="text-[10px] text-slate-500">
                                    {repair.endDate || repair.startDate}
                                  </div>
                                )}
                              </td>

                              {/* Work Content */}
                              <td className="p-3 text-slate-800 font-medium">
                                <div>{repair.workContent}</div>
                                {repair.decisionNo && (
                                  <span className="text-[10px] text-slate-500 block">
                                    Số QĐ: {repair.decisionNo}
                                  </span>
                                )}
                              </td>

                              {/* Contractor */}
                              <td className="p-3 text-slate-600 font-medium whitespace-nowrap">
                                {repair.contractor || '-'}
                              </td>

                              {/* Cost */}
                              <td className="p-3 font-bold text-emerald-700 whitespace-nowrap">
                                {repair.cost ? `${repair.cost.toLocaleString('vi-VN')} đ` : '-'}
                              </td>

                              {/* Actions */}
                              <td className="p-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end space-x-1">
                                  <button
                                    onClick={() => setSelectedAssetCode(repair.assetCode)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                    title="Xem thông tin chi tiết tài sản"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Bạn có chắc muốn xóa bản ghi SCL của tài sản ${repair.assetCode}?`)) {
                                        deleteRepairRecord(repair.id);
                                      }
                                    }}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Xóa bản ghi sửa chữa này"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Khai báo Bản ghi Lịch sử SCL Mới với chữ màu đen và ô ngày tháng chuẩn */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-blue-600" />
                Khai báo Bản ghi SCL Theo Công trình
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              {/* Tên Công Trình SCL */}
              <div>
                <label className="font-bold text-slate-900 block mb-1">
                  Tên Công trình SCL *:
                </label>
                <input
                  type="text"
                  list="project-suggestions"
                  placeholder="VD: Công trình SCL Trạm 110kV Chợ Lớn 2024..."
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="project-suggestions">
                  {existingProjectNames.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Có thể chọn tên công trình đã có hoặc nhập tên công trình mới.
                </span>
              </div>

              {/* Mã tài sản */}
              <div>
                <label className="font-bold text-slate-900 block mb-1">
                  Mã tài sản sửa chữa *:
                </label>
                <input
                  type="text"
                  list="asset-suggestions"
                  placeholder="VD: EVN-CL-MC22-01"
                  value={assetCode}
                  onChange={(e) => setAssetCode(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="asset-suggestions">
                  {assets.map((a) => (
                    <option key={a.assetCode} value={a.assetCode}>
                      {a.assetName} ({a.unit})
                    </option>
                  ))}
                </datalist>
              </div>

              {/* Loại & Năm thực hiện */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Loại sửa chữa:</label>
                  <select
                    value={repairType}
                    onChange={(e) => setRepairType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SCL">SCL (Sửa chữa lớn)</option>
                    <option value="SCTX">SCTX (Thường xuyên)</option>
                    <option value="SCDX">SCDX (Đột xuất)</option>
                    <option value="DaiTu">Đại tu thiết bị</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Năm thực hiện *:</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Ngày tháng (Chữ màu đen rõ ràng) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Ngày bắt đầu:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Ngày hoàn thành:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Nội dung công việc */}
              <div>
                <label className="font-bold text-slate-900 block mb-1">Nội dung sửa chữa chi tiết *:</label>
                <textarea
                  placeholder="Ghi rõ các hạng mục: bảo dưỡng, đại tu, thay thế phụ kiện, thí nghiệm..."
                  value={workContent}
                  onChange={(e) => setWorkContent(e.target.value)}
                  required
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Đơn vị thực hiện & Chi phí & Quyết định */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Đơn vị thực hiện:</label>
                  <input
                    type="text"
                    placeholder="Xí nghiệp Dịch vụ..."
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Số quyết định:</label>
                  <input
                    type="text"
                    placeholder="Số QĐ / VB phê duyệt"
                    value={decisionNo}
                    onChange={(e) => setDecisionNo(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Chi phí (VNĐ):</label>
                  <input
                    type="number"
                    placeholder="185000000"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  Lưu Bản ghi SCL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
