import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  readExcelFile,
  autoDetectMappings,
  processAssetImportRows,
} from '../services/excel';
import {
  ImportPreviewRow,
  ExcelImportSummary,
  Asset,
} from '../types/asset';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';

export const ExcelImporter: React.FC = () => {
  const { assets, importAssetsBatch, importRepairsBatch, importPlansBatch } = useApp();

  const [importTarget, setImportTarget] = useState<'ASSETS' | 'REPAIRS' | 'PLANS'>('ASSETS');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [sheetsData, setSheetsData] = useState<Record<string, Record<string, unknown>[]>>({});

  // Column Mapping
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Preview & Summary
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [summary, setSummary] = useState<ExcelImportSummary | null>(null);
  const [mergeMode, setMergeMode] = useState<'CREATE' | 'UPDATE' | 'MERGE'>('MERGE');

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);
    setImportSuccessMessage(null);

    try {
      const { sheetNames, sheetsData } = await readExcelFile(file);
      setSheetNames(sheetNames);
      setSheetsData(sheetsData);

      const firstSheet = sheetNames[0];
      setSelectedSheet(firstSheet);

      const rows = sheetsData[firstSheet] || [];
      if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        setExcelHeaders(headers);
        const autoMap = autoDetectMappings(headers);
        setMapping(autoMap);
      }

      setStep(2);
    } catch (err) {
      alert('Không thể đọc file Excel. Vui lòng kiểm tra định dạng .xlsx hoặc .csv');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    const rows = sheetsData[sheetName] || [];
    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      setExcelHeaders(headers);
      const autoMap = autoDetectMappings(headers);
      setMapping(autoMap);
    }
  };

  const handleRunValidation = () => {
    const rows = sheetsData[selectedSheet] || [];
    const { previewRows, summary } = processAssetImportRows(
      rows,
      mapping,
      assets,
      mergeMode
    );

    setPreviewRows(previewRows);
    setSummary(summary);
    setStep(3);
  };

  const handleCommitImport = () => {
    if (!summary) return;

    const validRows = previewRows.filter((r) => r.isValid && r.action !== 'SKIP');

    if (importTarget === 'ASSETS') {
      const newAssetsToCommit: Asset[] = validRows.map((r) => ({
        assetCode: (r.mapped.assetCode as string).trim(),
        assetName: (r.mapped.assetName as string) || 'Tài sản nhập Excel',
        category: (r.mapped.category as any) || 'Thiết bị đóng cắt',
        unit: (r.mapped.unit as string) || 'Công ty Điện lực Chợ Lớn',
        location: (r.mapped.location as string) || 'Vị trí theo file Excel',
        quantity: Number(r.mapped.quantity) || 1,
        commissioningYear: Number(r.mapped.commissioningYear) || 2020,
        lastMajorRepairYear: r.mapped.lastMajorRepairYear
          ? Number(r.mapped.lastMajorRepairYear)
          : undefined,
        lastMajorRepairContent: r.mapped.lastMajorRepairContent
          ? (r.mapped.lastMajorRepairContent as string)
          : undefined,
        lastRenovationYear: r.mapped.lastRenovationYear
          ? Number(r.mapped.lastRenovationYear)
          : undefined,
        notes: (r.mapped.notes as string) || 'Nhập từ file Excel',
        updatedAt: new Date().toISOString(),
        updatedBy: 'Nhập file Excel',
      }));

      const res = importAssetsBatch(newAssetsToCommit, mergeMode);
      setImportSuccessMessage(
        `Đã nhập thành công ${res.created} tài sản mới và cập nhật ${res.updated} tài sản cũ.`
      );
    }

    // Reset flow
    setStep(1);
    setSelectedFile(null);
    setPreviewRows([]);
    setSummary(null);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Upload className="w-6 h-6 text-blue-600" />
          Chức năng Nhập Dữ liệu Excel Thông minh
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Tự động nhận diện tiêu đề cột tiếng Việt, kiểm tra lỗi mã trùng, năm không hợp lệ và hợp nhất dữ liệu không mất lịch sử.
        </p>
      </div>

      {importSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{importSuccessMessage}</span>
        </div>
      )}

      {/* Target Selector */}
      <div className="bg-slate-800 text-white p-4 rounded-xl flex items-center space-x-3 text-xs">
        <span className="font-bold text-slate-300">1. Chọn đối tượng nhập:</span>
        <button
          onClick={() => setImportTarget('ASSETS')}
          className={`px-3 py-1.5 rounded-lg font-bold ${
            importTarget === 'ASSETS' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}
        >
          Danh mục Tài sản
        </button>
        <button
          onClick={() => setImportTarget('REPAIRS')}
          className={`px-3 py-1.5 rounded-lg font-bold ${
            importTarget === 'REPAIRS' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}
        >
          Lịch sử Sửa chữa
        </button>
        <button
          onClick={() => setImportTarget('PLANS')}
          className={`px-3 py-1.5 rounded-lg font-bold ${
            importTarget === 'PLANS' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}
        >
          Kế hoạch SCL / ĐTXD
        </button>
      </div>

      {/* STEP 1: Upload File */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-blue-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Chọn File Excel (.xlsx, .xls) hoặc CSV để tải lên
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Hệ thống tự động hỗ trợ tiêu đề tiếng Việt có hoặc không dấu, khoảng trắng.
            </p>
          </div>

          <label className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer transition-all">
            <Upload className="w-4 h-4" />
            <span>Chọn File từ Máy tính</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* STEP 2: Mapping & Sheet Selection */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Ánh xạ Cột Excel với Trường Hệ thống</h3>
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded">
              File: {selectedFile?.name}
            </span>
          </div>

          {/* Sheet Selector */}
          {sheetNames.length > 1 && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-bold text-slate-700">Chọn Sheet dữ liệu:</span>
              <select
                value={selectedSheet}
                onChange={(e) => handleSheetChange(e.target.value)}
                className="p-1.5 bg-slate-100 border rounded font-semibold"
              >
                {sheetNames.map((name) => (
                  <option key={name} value={name}>
                    {name} ({sheetsData[name]?.length || 0} dòng)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Column Mapping Grid */}
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Kiểm tra các cột tự động nhận diện bên dưới và điều chỉnh nếu cần:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {excelHeaders.map((header) => (
                <div key={header} className="p-3 bg-slate-50 border rounded-xl space-y-1">
                  <span className="font-bold text-slate-800 truncate block">{header}</span>
                  <select
                    value={mapping[header] || ''}
                    onChange={(e) => setMapping({ ...mapping, [header]: e.target.value })}
                    className="w-full p-1.5 bg-white border rounded text-xs font-medium text-blue-900"
                  >
                    <option value="">-- Bỏ qua cột này --</option>
                    <option value="assetCode">Mã tài sản (Bắt buộc)</option>
                    <option value="assetName">Tên tài sản / Thiết bị</option>
                    <option value="category">Loại tài sản</option>
                    <option value="unit">Đơn vị quản lý</option>
                    <option value="location">Địa điểm / Vị trí</option>
                    <option value="commissioningYear">Năm vận hành</option>
                    <option value="lastMajorRepairYear">Năm SCL gần nhất</option>
                    <option value="lastMajorRepairContent">Nội dung SCL</option>
                    <option value="notes">Ghi chú</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Merge Mode Choice */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-blue-900">Chế độ ghi dữ liệu:</span>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-1.5 font-semibold text-slate-800">
                <input
                  type="radio"
                  name="mergeMode"
                  checked={mergeMode === 'MERGE'}
                  onChange={() => setMergeMode('MERGE')}
                />
                <span>Hợp nhất (Thêm mới + Cập nhật cũ)</span>
              </label>
              <label className="flex items-center space-x-1.5 font-semibold text-slate-800">
                <input
                  type="radio"
                  name="mergeMode"
                  checked={mergeMode === 'CREATE'}
                  onChange={() => setMergeMode('CREATE')}
                />
                <span>Chỉ thêm mới (Bỏ qua mã đã có)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
            >
              Chọn lại File
            </button>
            <button
              onClick={handleRunValidation}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center space-x-1"
            >
              <span>Kiểm tra & Xem trước Dữ liệu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Preview & Commit */}
      {step === 3 && summary && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 text-xs">
          {/* Summary Box */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border">
            <div>
              <span className="text-slate-500 font-medium">Tổng số dòng Excel:</span>
              <p className="text-xl font-bold text-slate-900">{summary.totalRows}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Dòng hợp lệ:</span>
              <p className="text-xl font-bold text-emerald-600">{summary.validRows}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Tài sản tạo mới:</span>
              <p className="text-xl font-bold text-blue-600">{summary.newCount}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Tài sản cập nhật:</span>
              <p className="text-xl font-bold text-amber-600">{summary.updateCount}</p>
            </div>
          </div>

          {/* Validation Errors List */}
          {summary.errorsList.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <span className="font-bold text-rose-800 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Phát hiện {summary.errorsList.length} dòng lỗi không thể ghi:
              </span>
              <ul className="list-disc pl-5 space-y-1 text-rose-700 text-[11px]">
                {summary.errorsList.slice(0, 5).map((e, idx) => (
                  <li key={idx}>
                    Dòng {e.row}: {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Commit Button */}
          <div className="flex justify-between pt-2 border-t">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold"
            >
              Quay lại Ánh xạ
            </button>
            <button
              onClick={handleCommitImport}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg flex items-center space-x-1"
            >
              <FileCheck className="w-4 h-4" />
              <span>Xác nhận Ghi vào Cơ sở dữ liệu</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
