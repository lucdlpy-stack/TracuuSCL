/**
 * Data structures for EVN Asset Search & Management Handbook
 * Focused on Sửa chữa lớn (SCL) & Maintenance Cycle Management
 */

export type AssetCategory =
  | 'Thiết bị đóng cắt'
  | 'Máy biến áp / Trạm biến áp'
  | 'Đường dây trung thế / hạ thế'
  | 'Đường dây truyền tải'
  | 'Nhà cửa & Công trình xây dựng'
  | 'Ô tô & Xe chuyên dùng'
  | 'Thiết bị đo lường & Rơ le'
  | 'Tài sản khác';

export type ManagementUnit =
  | 'Công ty Điện lực Chợ Lớn'
  | 'Công ty Điện lực Tân Thuận'
  | 'Công ty Điện lực Gia Định'
  | 'Công ty Điện lực Bình Phú'
  | 'Công ty Truyền tải Điện 1'
  | 'Công ty Truyền tải Điện 2'
  | 'Ban Quản lý Dự án Lưới điện'
  | 'Trung tâm Điều độ Hệ thống điện';

export type RepairType = 'SCL' | 'SCTX' | 'SCDX' | 'DaiTu' | 'Khac';

export type RepairStatus = 'Completed' | 'InProgress' | 'InPlan';

export type PlanApprovalStatus =
  | 'Proposed'    // Đề xuất
  | 'Reviewing'   // Đang thẩm định
  | 'Approved'    // Đã phê duyệt
  | 'Executing'   // Đang thực hiện
  | 'Completed'   // Hoàn thành
  | 'Postponed'   // Hoãn
  | 'Cancelled';  // Hủy

export type PlanStatusGroupColor =
  | 'GREEN'    // Chưa có trong kế hoạch SCL đã nhập
  | 'BLUE'     // Đã có trong kế hoạch SCL
  | 'YELLOW';  // Thiếu dữ liệu hoặc chưa xác minh

export type CycleStatusGroupColor =
  | 'RED'      // Chưa đủ chu kỳ (< chu kỳ)
  | 'YELLOW'   // Đạt mốc chu kỳ (bằng chu kỳ / thiếu dữ liệu)
  | 'GREEN';   // Đủ điều kiện (> chu kỳ)

export type RuleMode = 'Greater' | 'Exact'; // 'Greater': > mốc mới đủ điều kiện (mặc định), 'Exact': >= mốc

export interface RepairRecord {
  id: string;
  assetCode: string;
  repairType: RepairType;
  projectName?: string; // Tên công trình
  startDate?: string;
  endDate?: string;
  year: number;
  workContent: string;
  cause?: string;
  contractor?: string;
  decisionNo?: string;
  cost?: number;
  acceptanceResult?: 'Đã nghiệm thu' | 'Đang nghiệm thu' | 'Chưa đạt' | 'Chưa nghiệm thu';
  status: RepairStatus;
  notes?: string;
  dataSource: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanRecord {
  id: string;
  assetCode: string;
  planYear: number;
  planCode?: string;
  projectName: string; // Tên Công trình
  workContent?: string;
  proposedUnit?: string;
  proposedDate?: string;
  approvalDate?: string;
  decisionNo?: string;
  estimatedCost?: number;
  status: PlanApprovalStatus;
  notes?: string;
  dataSource: string;
  createdAt: string;
  updatedAt: string;
}

export interface CycleRule {
  id: string;
  groupName: string;
  category: AssetCategory | 'Tất cả';
  cycleYears: number;
  cycleMonths?: number; // Cấu hình bổ sung theo tháng
  basisWorkType: RepairType;
  ruleMode: RuleMode; // 'Greater' (vượt mốc) hoặc 'Exact' (đủ mốc)
  documentNo?: string;
  documentSource?: string;
  effectiveDate?: string;
  status: 'Active' | 'Inactive';
  updatedBy?: string;
  updatedAt: string;
}

export interface Asset {
  assetCode: string; // Required, unique key
  assetName: string;
  category: AssetCategory;
  unit: ManagementUnit | string;
  location: string;
  quantity: number;
  commissioningYear: number; // Năm đưa vào sử dụng
  
  // Custom cycle override for specific asset (if defined)
  customCycleYears?: number;
  customCycleMonths?: number;

  // Historical summary fields (derived or updated from repair records)
  lastMajorRepairYear?: number;
  lastMajorRepairDate?: string;
  lastMajorRepairContent?: string;
  lastMajorRepairProject?: string; // Tên công trình SCL gần nhất
  
  notes?: string;
  updatedAt: string;
  updatedBy: string;

  // Custom metadata fields
  customFields?: Record<string, string>;
}

export interface CalculatedCycleStatus {
  yearsElapsed: number | null; // Số năm kể từ SCL gần nhất
  milestoneYear: number | null; // Năm đạt mốc chu kỳ (VD: 2024 + 5 = 2029)
  eligibleYear: number | null; // Năm dự kiến đủ điều kiện tiếp theo
  statusColor: CycleStatusGroupColor;
  statusLabel: string;
  isOverdue: boolean; // Đã quá mốc hay chưa
  reason: string; // Giải thích chi tiết
  calculationMode: RuleMode;
  appliedCycleYears: number;
  appliedCycleMonths?: number;
  lastRepairTypeUsed: string;
  isEstimatedByYear: boolean;
  isCustomCycle: boolean; // Có phải chu kỳ riêng được chỉnh sửa không?
}

export interface CalculatedPlanStatus {
  planColor: PlanStatusGroupColor;
  statusLabel: string;
  inSCL: boolean;
  sclPlanDetails: PlanRecord[];
  summaryText: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  user: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT_EXCEL' | 'CONFIG_CHANGE' | 'RESTORE';
  targetType: 'ASSET' | 'REPAIR' | 'PLAN' | 'RULE' | 'SYSTEM';
  targetId: string;
  details: string;
}

export interface ImportPreviewRow {
  rowNumber: number;
  raw: Record<string, unknown>;
  mapped: Record<string, unknown>;
  errors: string[];
  warnings: string[];
  isValid: boolean;
  action: 'CREATE' | 'UPDATE' | 'SKIP' | 'INVALID';
}

export interface ExcelImportSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  newCount: number;
  updateCount: number;
  skipCount: number;
  errorsList: Array<{ row: number; reason: string }>;
}

export interface UserPermissions {
  canView: boolean;      // Quyền Xem
  canEdit: boolean;      // Quyền Chỉnh sửa
  canUpdate: boolean;    // Quyền Cập nhật / Thêm mới
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  unit: string;
  permissions?: UserPermissions;
}

export interface PasswordValidationResult {
  valid: boolean;
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  message?: string;
}
