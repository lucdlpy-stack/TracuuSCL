import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportToExcel } from '../services/excel';
import { PrintableReportModal } from './PrintableReportModal';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  Printer,
  FileText,
} from 'lucide-react';

export const ReportGenerator: React.FC = () => {
  const { assets, currentYear, getAssetCycleStatus, getAssetPlanStatus } = useApp();

  const [selectedReportId, setSelectedReportId] = useState<number>(1);
  const [reportYear, setReportYear] = useState<number>(currentYear);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printType, setPrintType] = useState<'CATALOG' | 'REPAIR_HISTORY'>('CATALOG');

  const reportPresets = [
    { id: 1, name: '1. Báo cáo Danh mục Tổng thể Tài sản EVN' },
    { id: 2, name: '2. Danh sách Tài sản CHƯA CÓ TRONG KẾ HOẠCH SCL' },
    { id: 3, name: '3. Danh sách Tài sản ĐÃ CÓ trong Công trình Kế hoạch SCL' },
    { id: 4, name: '4. Danh sách Tài sản CHƯA ĐỦ CHU KỲ (Mới SCL gần đây)' },
    { id: 5, name: '5. Danh sách Tài sản ĐÃ VƯỢT CHU KỲ (Đủ điều kiện SCL tiếp)' },
    { id: 6, name: '6. Danh sách Tài sản THIẾU DỮ LIỆU / Cần xác minh' },
    {
      id: 7,
      name: '7. Danh sách ĐỀ XUẤT RÀ SOÁT ĐƯA VÀO CÔNG TRÌNH SCL TIẾP THEO (Ưu tiên)',
    },
  ];

  // Generate target dataset based on selected preset
  const getReportData = () => {
    return assets.filter((asset) => {
      const cycleStatus = getAssetCycleStatus(asset);
      const planStatus = getAssetPlanStatus(asset, reportYear);

      switch (selectedReportId) {
        case 1:
          return true;
        case 2:
          return !planStatus.inSCL;
        case 3:
          return planStatus.inSCL;
        case 4:
          return cycleStatus.statusColor === 'RED';
        case 5:
          return cycleStatus.statusColor === 'GREEN' || cycleStatus.isOverdue;
        case 6:
          return cycleStatus.statusColor === 'YELLOW';
        case 7:
          return (cycleStatus.statusColor === 'GREEN' || cycleStatus.isOverdue) && !planStatus.inSCL;
        default:
          return true;
      }
    });
  };

  const currentReportAssets = getReportData();

  const handleExport = () => {
    const presetName = reportPresets.find((r) => r.id === selectedReportId)?.name || 'Bao_Cao';

    const exportData = currentReportAssets.map((asset) => {
      const cycleStatus = getAssetCycleStatus(asset);
      const planStatus = getAssetPlanStatus(asset, reportYear);

      return {
        'Mã tài sản': asset.assetCode,
        'Tên tài sản': asset.assetName,
        'Loại thiết bị': asset.category,
        'Đơn vị quản lý': asset.unit,
        'Vị trí lắp đặt': asset.location,
        'Năm vận hành': asset.commissioningYear || '',
        'Chu kỳ áp dụng': `${cycleStatus.appliedCycleYears} năm`,
        'Năm SCL gần nhất': asset.lastMajorRepairYear || 'Chưa SCL',
        'Công trình SCL gần nhất': asset.lastMajorRepairProject || '',
        'Nội dung SCL gần nhất': asset.lastMajorRepairContent || '',
        'Số năm kể từ SCL': cycleStatus.yearsElapsed ?? 'Thiếu DL',
        'Năm đạt mốc chu kỳ': cycleStatus.milestoneYear ?? '',
        'Trạng thái Cảnh báo SCL': cycleStatus.statusLabel,
        'Tình trạng KH SCL': planStatus.statusLabel,
        'Công trình SCL năm KH': planStatus.summaryText,
        'Ghi chú': asset.notes || '',
      };
    });

    exportToExcel(exportData, `EVN_Bao_Cao_SCL_${selectedReportId}_Nam_${reportYear}`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Trung tâm Báo cáo & In ấn / Xuất PDF - Excel Chuẩn EVN
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Xuất file Excel có định dạng hoặc In ấn trực tiếp / Lưu PDF có đầy đủ Quốc hiệu, tiêu ngữ và chữ ký phê duyệt cho công tác lưu trữ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setPrintType('CATALOG');
              setShowPrintModal(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-extrabold text-xs shadow-lg transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>In Bản Cứng / Lưu PDF</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel ({currentReportAssets.length} TS)</span>
          </button>
        </div>
      </div>

      {/* Preset Selector & Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Preset List */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block px-2">
            Chọn Biểu mẫu Báo cáo SCL:
          </span>
          <div className="space-y-1">
            {reportPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedReportId(preset.id)}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border ${
                  selectedReportId === preset.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Preview & Notice Box */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                Xem trước Báo cáo #{selectedReportId}
              </h3>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500">Năm xem kế hoạch SCL:</span>
                <select
                  value={reportYear}
                  onChange={(e) => setReportYear(Number(e.target.value))}
                  className="p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                  <option value={2028}>2028</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-800">
                Tìm thấy {currentReportAssets.length} tài sản thỏa mãn điều kiện báo cáo.
              </span>
              <p className="text-slate-600 leading-relaxed">
                Hệ thống hỗ trợ xuất file Excel chuyên nghiệp hoặc tạo văn bản báo cáo in ấn / lưu PDF chuẩn văn thư với Quốc hiệu tiêu ngữ và các mục chữ ký nghiệm thu.
              </p>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] font-medium leading-relaxed">
            <strong>Ghi chú nghiệp vụ:</strong> Báo cáo đề xuất là căn cứ quản lý rà soát lập công trình SCL tiếp theo cho công tác lưu trữ.
          </div>
        </div>
      </div>

      {/* PRINT & PDF PREVIEW MODAL */}
      {showPrintModal && (
        <PrintableReportModal
          reportType={printType}
          reportYear={reportYear}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
