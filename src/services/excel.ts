import * as XLSX from 'xlsx';
import {
  Asset,
  RepairRecord,
  PlanRecord,
  ExcelImportSummary,
  ImportPreviewRow,
} from '../types/asset';

// Column title mapping dictionary
const COLUMN_HEADER_MAP: Record<string, keyof Asset> = {
  'mã tài sản': 'assetCode',
  'ma tai san': 'assetCode',
  'mats': 'assetCode',
  'ma_ts': 'assetCode',
  'mã ts': 'assetCode',
  'mã thiết bị': 'assetCode',
  'số no': 'assetCode',
  'so no': 'assetCode',
  'no.': 'assetCode',
  'no': 'assetCode',

  'tên tài sản': 'assetName',
  'ten tai san': 'assetName',
  'tên thiết bị': 'assetName',
  'tên công trình': 'assetName',
  'tài sản': 'assetName',

  'loại tài sản': 'category',
  'loai tai san': 'category',
  'chủng loại': 'category',
  'nhóm tài sản': 'category',

  'đơn vị quản lý': 'unit',
  'don vi quan ly': 'unit',
  'đơn vị': 'unit',
  'don vi': 'unit',
  'quản lý': 'unit',

  'địa điểm': 'location',
  'dia diem': 'location',
  'vị trí': 'location',
  'vi tri': 'location',
  'vị trí lắp đặt': 'location',

  'số lượng': 'quantity',
  'so luong': 'quantity',
  'sl': 'quantity',

  'năm đưa vào sử dụng': 'commissioningYear',
  'năm đưa vào vận hành': 'commissioningYear',
  'nam dua vao su dung': 'commissioningYear',
  'năm vận hành': 'commissioningYear',
  'năm sd': 'commissioningYear',
  'năm vh': 'commissioningYear',

  'năm sửa chữa lớn': 'lastMajorRepairYear',
  'năm scl': 'lastMajorRepairYear',
  'nam sua chua lon': 'lastMajorRepairYear',
  'năm scl gần nhất': 'lastMajorRepairYear',

  'nội dung sửa chữa': 'lastMajorRepairContent',
  'noi dung sua chua': 'lastMajorRepairContent',
  'nội dung scl': 'lastMajorRepairContent',

  'năm cải tạo đtxd': 'lastRenovationYear',
  'năm đtxd': 'lastRenovationYear',
  'nam cai tao đtxd': 'lastRenovationYear',
  'năm cải tạo': 'lastRenovationYear',

  'nội dung cải tạo': 'lastRenovationContent',
  'noi dung đtxd': 'lastRenovationContent',

  'ghi chú': 'notes',
  'ghi chu': 'notes',
};

/**
 * Normalizes string for fuzzy matching
 */
function normalizeHeader(header: string): string {
  return header
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Auto-detects column mapping for an array of Excel header strings
 */
export function autoDetectMappings(excelHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  excelHeaders.forEach((header) => {
    const norm = normalizeHeader(header);
    if (COLUMN_HEADER_MAP[norm]) {
      mapping[header] = COLUMN_HEADER_MAP[norm];
    } else {
      // Partial match attempt
      for (const [key, field] of Object.entries(COLUMN_HEADER_MAP)) {
        if (norm.includes(key) || key.includes(norm)) {
          mapping[header] = field;
          break;
        }
      }
    }
  });

  return mapping;
}

/**
 * Reads an Excel file buffer or File object and returns sheet names & raw data
 */
export async function readExcelFile(file: File): Promise<{
  sheetNames: string[];
  sheetsData: Record<string, Record<string, unknown>[]>;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const sheetNames = workbook.SheetNames;
        const sheetsData: Record<string, Record<string, unknown>[]> = {};

        sheetNames.forEach((name) => {
          const sheet = workbook.Sheets[name];
          const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
            defval: '',
          });
          sheetsData[name] = json;
        });

        resolve({ sheetNames, sheetsData });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses and validates raw Excel sheet rows against target assets schema
 */
export function processAssetImportRows(
  rows: Record<string, unknown>[],
  columnMapping: Record<string, string>,
  existingAssets: Asset[],
  mergeMode: 'CREATE' | 'UPDATE' | 'MERGE'
): {
  previewRows: ImportPreviewRow[];
  summary: ExcelImportSummary;
} {
  const existingMap = new Map(existingAssets.map((a) => [a.assetCode.toUpperCase(), a]));
  const seenInFile = new Set<string>();

  const previewRows: ImportPreviewRow[] = [];
  let newCount = 0;
  let updateCount = 0;
  let skipCount = 0;
  const errorsList: Array<{ row: number; reason: string }> = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // header is row 1
    const mapped: Record<string, unknown> = {};
    const errors: string[] = [];
    const warnings: string[] = [];

    // Map Excel values to fields
    Object.entries(columnMapping).forEach(([excelCol, targetField]) => {
      if (targetField && row[excelCol] !== undefined) {
        mapped[targetField] = row[excelCol];
      }
    });

    const assetCodeRaw = (mapped.assetCode || '').toString().trim();

    // Check mandatory Asset Code
    if (!assetCodeRaw) {
      errors.push('Mã tài sản bị trống.');
    } else {
      const upperCode = assetCodeRaw.toUpperCase();
      mapped.assetCode = assetCodeRaw; // keep case

      if (seenInFile.has(upperCode)) {
        errors.push(`Mã tài sản "${assetCodeRaw}" bị trùng lặp trong file nhập.`);
      } else {
        seenInFile.add(upperCode);
      }
    }

    // Validate commissioning year if provided
    if (mapped.commissioningYear) {
      const yr = Number(mapped.commissioningYear);
      if (isNaN(yr) || yr < 1900 || yr > 2030) {
        warnings.push(`Năm vận hành (${mapped.commissioningYear}) không hợp lệ.`);
        delete mapped.commissioningYear;
      } else {
        mapped.commissioningYear = yr;
      }
    }

    // Validate last SCL year if provided
    if (mapped.lastMajorRepairYear) {
      const yr = Number(mapped.lastMajorRepairYear);
      if (isNaN(yr) || yr < 1900 || yr > 2030) {
        warnings.push(`Năm SCL (${mapped.lastMajorRepairYear}) không hợp lệ.`);
        delete mapped.lastMajorRepairYear;
      } else {
        mapped.lastMajorRepairYear = yr;
      }
    }

    // Default category fallback
    if (!mapped.category) {
      mapped.category = 'Thiết bị đóng cắt';
    }

    // Default unit fallback
    if (!mapped.unit) {
      mapped.unit = 'Công ty Điện lực Chợ Lớn';
    }

    // Default quantity
    mapped.quantity = Number(mapped.quantity) || 1;

    const existsInDb = assetCodeRaw ? existingMap.has(assetCodeRaw.toUpperCase()) : false;
    let action: ImportPreviewRow['action'] = 'CREATE';

    if (errors.length > 0) {
      action = 'INVALID';
      errorsList.push({ row: rowNumber, reason: errors.join('; ') });
    } else if (existsInDb) {
      if (mergeMode === 'CREATE') {
        action = 'SKIP';
        skipCount++;
      } else {
        action = 'UPDATE';
        updateCount++;
      }
    } else {
      action = 'CREATE';
      newCount++;
    }

    previewRows.push({
      rowNumber,
      raw: row,
      mapped,
      errors,
      warnings,
      isValid: errors.length === 0,
      action,
    });
  });

  return {
    previewRows,
    summary: {
      totalRows: rows.length,
      validRows: previewRows.filter((r) => r.isValid).length,
      errorRows: previewRows.filter((r) => !r.isValid).length,
      newCount,
      updateCount,
      skipCount,
      errorsList,
    },
  };
}

/**
 * Export data to an formatted Excel (.xlsx) file
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  fileName: string,
  sheetName: string = 'Danh_Muc_Tai_San'
): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto column width calculation
  const max_widths: number[] = [];
  data.forEach((row) => {
    Object.values(row).forEach((val, idx) => {
      const len = val ? val.toString().length : 10;
      max_widths[idx] = Math.max(max_widths[idx] || 10, len + 3);
    });
  });

  worksheet['!cols'] = max_widths.map((w) => ({ wch: Math.min(w, 50) }));

  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
