import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Asset, RepairRecord } from '../types/asset';
import { Printer, FileText, Download, X, Building2, CheckCircle2 } from 'lucide-react';

interface PrintableReportModalProps {
  reportType: 'CATALOG' | 'REPAIR_HISTORY' | 'SINGLE_ASSET';
  singleAssetCode?: string;
  reportYear?: number;
  unitFilter?: string;
  onClose: () => void;
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  reportType,
  singleAssetCode,
  reportYear = 2026,
  unitFilter = 'ALL',
  onClose,
}) => {
  const { assets, repairRecords, getAssetCycleStatus, getAssetPlanStatus, getAssetByCode } =
    useApp();

  const printAreaRef = useRef<HTMLDivElement>(null);

  const singleAsset = singleAssetCode ? getAssetByCode(singleAssetCode) : undefined;

  // Filter assets
  const filteredAssets = assets.filter((a) => {
    if (unitFilter !== 'ALL' && a.unit !== unitFilter) return false;
    return true;
  });

  // Filter repairs
  const filteredRepairs = repairRecords.filter((r) => {
    const asset = assets.find((a) => a.assetCode === r.assetCode);
    if (unitFilter !== 'ALL' && asset?.unit !== unitFilter) return false;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const currentDateStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-h-none print:w-full print:rounded-none">
        {/* Modal Controls Bar (Hidden during printing) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">
              Xem trước Bản in & Xuất PDF Chuyên nghiệp EVN
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>In Báo cáo / Lưu PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT AREA */}
        <div
          ref={printAreaRef}
          className="p-8 sm:p-12 overflow-y-auto flex-1 font-serif space-y-6 print:p-0 print:overflow-visible text-slate-950 bg-white"
          id="printable-report-area"
        >
          {/* Official Document Header (EVN & Quốc hiệu) */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-900 text-center leading-snug">
            <div className="text-left space-y-1">
              <p className="font-bold uppercase text-xs tracking-tight">
                TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM
              </p>
              <p className="font-extrabold uppercase text-xs text-blue-900 border-b border-slate-400 inline-block pb-0.5">
                CÔNG TY ĐIỆN LỰC / TRUYỀN TẢI ĐIỆN
              </p>
              <p className="text-[10px] text-slate-600 font-sans italic">
                Số: ....../BC-PCCL-KT
              </p>
            </div>

            <div className="text-right space-y-1">
              <p className="font-bold uppercase text-xs">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </p>
              <p className="font-bold text-xs underline">
                Độc lập - Tự do - Hạnh phúc
              </p>
              <p className="text-[10px] text-slate-600 font-sans italic">
                TP. Hồ Chí Minh, ngày {currentDateStr.split('/')[0]} tháng {currentDateStr.split('/')[1]} năm {currentDateStr.split('/')[2]}
              </p>
            </div>
          </div>

          {/* REPORT TITLE 1: CATALOG REPORT */}
          {reportType === 'CATALOG' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h1 className="text-lg font-black uppercase tracking-tight text-slate-950">
                  BÁO CÁO TỔNG HỢP DANH MỤC TÀI SẢN VÀ CHU KỲ SỬA CHỮA LỚN
                </h1>
                <p className="text-xs font-sans text-slate-700 italic">
                  (Kèm theo Kế hoạch SCL năm {reportYear} - Đơn vị: {unitFilter === 'ALL' ? 'Toàn Công ty' : unitFilter})
                </p>
              </div>

              {/* Table Data */}
              <table className="w-full border-collapse border border-slate-900 text-[11px] font-sans">
                <thead>
                  <tr className="bg-slate-100 text-slate-950 font-bold uppercase text-center border-b border-slate-900">
                    <th className="border border-slate-900 p-2 w-8">STT</th>
                    <th className="border border-slate-900 p-2 w-28">Mã Tài Sản</th>
                    <th className="border border-slate-900 p-2">Tên Tài Sản / Thiết Bị</th>
                    <th className="border border-slate-900 p-2 w-24">Năm VH</th>
                    <th className="border border-slate-900 p-2 w-24">Lần SCL Gần Nhất</th>
                    <th className="border border-slate-900 p-2 w-20">Chu Kỳ</th>
                    <th className="border border-slate-900 p-2 w-28">Cảnh Báo Chu Kỳ</th>
                    <th className="border border-slate-900 p-2 w-32">Công Trình KH SCL {reportYear}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset, idx) => {
                    const cycleStatus = getAssetCycleStatus(asset);
                    const planStatus = getAssetPlanStatus(asset, reportYear);

                    return (
                      <tr key={asset.assetCode} className="border-b border-slate-800">
                        <td className="border border-slate-800 p-1.5 text-center font-bold">{idx + 1}</td>
                        <td className="border border-slate-800 p-1.5 font-mono font-bold">{asset.assetCode}</td>
                        <td className="border border-slate-800 p-1.5">
                          <div className="font-bold">{asset.assetName}</div>
                          <div className="text-[10px] text-slate-600">{asset.location}</div>
                        </td>
                        <td className="border border-slate-800 p-1.5 text-center">{asset.commissioningYear || '-'}</td>
                        <td className="border border-slate-800 p-1.5 text-center font-semibold">
                          {asset.lastMajorRepairYear ? `Năm ${asset.lastMajorRepairYear}` : 'Chưa SCL'}
                        </td>
                        <td className="border border-slate-800 p-1.5 text-center font-bold">
                          {cycleStatus.appliedCycleYears} năm
                        </td>
                        <td className="border border-slate-800 p-1.5 text-center font-bold">
                          {cycleStatus.statusLabel}
                        </td>
                        <td className="border border-slate-800 p-1.5 font-semibold text-[10px]">
                          {planStatus.inSCL ? planStatus.summaryText : 'Chưa có trong KH'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT TITLE 2: REPAIR HISTORY */}
          {reportType === 'REPAIR_HISTORY' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h1 className="text-lg font-black uppercase tracking-tight text-slate-950">
                  BÁO CÁO TỔNG HỢP LỊCH SỬ SỬA CHỮA LỚN THEO CÔNG TRÌNH
                </h1>
                <p className="text-xs font-sans text-slate-700 italic">
                  (Theo dõi công tác SCL thiết bị lưới điện - Năm {reportYear})
                </p>
              </div>

              <table className="w-full border-collapse border border-slate-900 text-[11px] font-sans">
                <thead>
                  <tr className="bg-slate-100 text-slate-950 font-bold uppercase text-center border-b border-slate-900">
                    <th className="border border-slate-900 p-2 w-8">STT</th>
                    <th className="border border-slate-900 p-2 w-28">Mã Tài Sản</th>
                    <th className="border border-slate-900 p-2">Tên Công Trình SCL</th>
                    <th className="border border-slate-900 p-2 w-16">Loại/Năm</th>
                    <th className="border border-slate-900 p-2">Nội Dung Công Việc</th>
                    <th className="border border-slate-900 p-2 w-28">Đơn Vị Thực Hiện</th>
                    <th className="border border-slate-900 p-2 w-24">Chi Phí (VNĐ)</th>
                    <th className="border border-slate-900 p-2 w-20">Số QĐ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepairs.map((r, idx) => {
                    const asset = assets.find((a) => a.assetCode === r.assetCode);
                    return (
                      <tr key={r.id} className="border-b border-slate-800">
                        <td className="border border-slate-800 p-1.5 text-center font-bold">{idx + 1}</td>
                        <td className="border border-slate-800 p-1.5 font-mono font-bold">{r.assetCode}</td>
                        <td className="border border-slate-800 p-1.5 font-bold text-blue-950">
                          {r.projectName || 'Mặc định'}
                        </td>
                        <td className="border border-slate-800 p-1.5 text-center font-bold">
                          {r.repairType} - {r.year}
                        </td>
                        <td className="border border-slate-800 p-1.5">{r.workContent}</td>
                        <td className="border border-slate-800 p-1.5 text-slate-700">{r.contractor || '-'}</td>
                        <td className="border border-slate-800 p-1.5 text-right font-bold">
                          {r.cost ? `${r.cost.toLocaleString('vi-VN')} đ` : '-'}
                        </td>
                        <td className="border border-slate-800 p-1.5 text-center font-mono text-[10px]">
                          {r.decisionNo || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT TITLE 3: SINGLE ASSET PROFILE */}
          {reportType === 'SINGLE_ASSET' && singleAsset && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h1 className="text-lg font-black uppercase tracking-tight text-slate-950">
                  HỒ SƠ LÝ LỊCH VẬN HÀNH VÀ LỊCH SỬ SCL TÀI SẢN
                </h1>
                <p className="text-xs font-sans text-slate-700 font-bold">
                  MÃ TÀI SẢN: {singleAsset.assetCode}
                </p>
              </div>

              {/* Asset Identifiers */}
              <div className="border border-slate-900 p-4 font-sans text-xs grid grid-cols-2 gap-3 bg-slate-50">
                <div>
                  <strong>Tên thiết bị:</strong> {singleAsset.assetName}
                </div>
                <div>
                  <strong>Loại tài sản:</strong> {singleAsset.category}
                </div>
                <div>
                  <strong>Đơn vị quản lý:</strong> {singleAsset.unit}
                </div>
                <div>
                  <strong>Vị trí lắp đặt:</strong> {singleAsset.location}
                </div>
                <div>
                  <strong>Năm vận hành:</strong> {singleAsset.commissioningYear || 'N/A'}
                </div>
                <div>
                  <strong>Chu kỳ SCL áp dụng:</strong> {singleAsset.customCycleYears || 5} năm
                </div>
              </div>

              {/* SCL Repair History Section */}
              <div className="space-y-2 font-sans text-xs">
                <h3 className="font-extrabold uppercase border-b border-slate-900 pb-1">
                  1. Lịch sử Sửa chữa lớn & Bảo trì đã thực hiện:
                </h3>
                <table className="w-full border-collapse border border-slate-900 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold uppercase border-b border-slate-900 text-center">
                      <th className="border border-slate-900 p-1.5">Năm</th>
                      <th className="border border-slate-900 p-1.5">Công Trình SCL</th>
                      <th className="border border-slate-900 p-1.5">Nội Dung Thực Hiện</th>
                      <th className="border border-slate-900 p-1.5">Đơn Vị SCL</th>
                      <th className="border border-slate-900 p-1.5">Số Quyết Định</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repairRecords
                      .filter((r) => r.assetCode === singleAsset.assetCode)
                      .map((r) => (
                        <tr key={r.id}>
                          <td className="border border-slate-800 p-1.5 text-center font-bold">{r.year}</td>
                          <td className="border border-slate-800 p-1.5 font-bold">{r.projectName || '-'}</td>
                          <td className="border border-slate-800 p-1.5">{r.workContent}</td>
                          <td className="border border-slate-800 p-1.5">{r.contractor || '-'}</td>
                          <td className="border border-slate-800 p-1.5 text-center font-mono">{r.decisionNo || '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Official Signatures Section */}
          <div className="grid grid-cols-3 gap-4 pt-12 text-center text-xs font-sans leading-relaxed">
            <div>
              <p className="font-bold uppercase">NGƯỜI LẬP BIỂU</p>
              <p className="text-[10px] text-slate-500 italic mb-16">(Ký và ghi rõ họ tên)</p>
              <p className="font-bold">Nguyễn Văn Kỹ Thuật</p>
            </div>

            <div>
              <p className="font-bold uppercase">CÁN BỘ QUẢN LÝ TÀI SẢN</p>
              <p className="text-[10px] text-slate-500 italic mb-16">(Ký và ghi rõ họ tên)</p>
              <p className="font-bold">Trần Thanh Sơn</p>
            </div>

            <div>
              <p className="font-bold uppercase">TRƯỞNG ĐƠN VỊ PHÊ DUYỆT</p>
              <p className="text-[10px] text-slate-500 italic mb-16">(Ký tên và đóng dấu)</p>
              <p className="font-bold">Giám Đốc Công Ty</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
