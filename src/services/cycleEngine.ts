import {
  Asset,
  RepairRecord,
  PlanRecord,
  CycleRule,
  CalculatedCycleStatus,
  CalculatedPlanStatus,
  RuleMode,
  PlanStatusGroupColor,
} from '../types/asset';

/**
 * Default rule if no custom rule matches the asset group
 */
export const DEFAULT_CYCLE_RULE: CycleRule = {
  id: 'DEFAULT_5Y',
  groupName: 'Quy tắc mặc định EVN (5 năm)',
  category: 'Tất cả',
  cycleYears: 5,
  basisWorkType: 'SCL',
  ruleMode: 'Greater',
  documentNo: 'QĐ-EVN/2023/SCL',
  documentSource: 'Quy định bảo trì sửa chữa thiết bị điện lực EVN',
  effectiveDate: '2023-01-01',
  status: 'Active',
  updatedBy: 'Hệ thống',
  updatedAt: new Date().toISOString(),
};

/**
 * Finds the applicable maintenance cycle rule for a given asset.
 */
export function getApplicableRule(asset: Asset, rules: CycleRule[]): CycleRule {
  const activeRules = rules.filter((r) => r.status === 'Active');
  const exactMatch = activeRules.find((r) => r.category === asset.category);
  if (exactMatch) return exactMatch;

  const defaultMatch = activeRules.find((r) => r.category === 'Tất cả');
  return defaultMatch || DEFAULT_CYCLE_RULE;
}

/**
 * Calculates Repair Cycle Warning Status strictly based on code logic.
 * Respects individual asset customCycleYears / customCycleMonths if defined.
 */
export function calculateCycleStatus(
  asset: Asset,
  repairRecords: RepairRecord[],
  rule: CycleRule,
  currentYear: number = new Date().getFullYear()
): CalculatedCycleStatus {
  // Check if asset has custom cycle override
  const isCustomCycle = asset.customCycleYears !== undefined && asset.customCycleYears > 0;
  const appliedCycle = isCustomCycle ? asset.customCycleYears! : (rule.cycleYears || 5);
  const appliedMonths = asset.customCycleMonths ?? rule.cycleMonths;
  const mode: RuleMode = rule.ruleMode || 'Greater';

  // Filter for completed major repair records for this asset
  const assetRepairs = repairRecords.filter(
    (r) =>
      r.assetCode.toUpperCase() === asset.assetCode.toUpperCase() &&
      r.repairType === rule.basisWorkType &&
      r.status === 'Completed'
  );

  // Sort by end date or year descending
  assetRepairs.sort((a, b) => {
    if (a.endDate && b.endDate) {
      return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
    }
    return b.year - a.year;
  });

  const latestRepair = assetRepairs[0];
  let lastRepairYear: number | undefined = latestRepair?.year;
  let isEstimatedByYear = true;
  let repairTypeLabel = rule.basisWorkType;

  if (latestRepair?.endDate) {
    const endYear = new Date(latestRepair.endDate).getFullYear();
    if (!isNaN(endYear)) {
      lastRepairYear = endYear;
      isEstimatedByYear = false;
    }
  }

  // Fallback to asset's explicit lastMajorRepairYear if repair records are not yet added
  if (lastRepairYear === undefined && asset.lastMajorRepairYear) {
    lastRepairYear = asset.lastMajorRepairYear;
    isEstimatedByYear = !asset.lastMajorRepairDate;
  }

  // If still missing, check commissioning year as baseline reference
  if (lastRepairYear === undefined) {
    if (asset.commissioningYear) {
      const yearsFromComm = currentYear - asset.commissioningYear;
      const milestoneComm = asset.commissioningYear + appliedCycle;
      const eligibleComm = mode === 'Greater' ? milestoneComm + 1 : milestoneComm;
      const isOver = currentYear > milestoneComm;

      return {
        yearsElapsed: yearsFromComm,
        milestoneYear: milestoneComm,
        eligibleYear: eligibleComm,
        statusColor: isOver ? 'GREEN' : 'YELLOW',
        statusLabel: isOver ? `Đã vận hành > ${appliedCycle} năm (Chưa SCL lần nào)` : `Mới vận hành (< ${appliedCycle} năm)`,
        isOverdue: isOver,
        reason: `Tài sản chưa có lịch sử SCL. Vận hành từ năm ${asset.commissioningYear} (đã qua ${yearsFromComm} năm). Đạt mốc chu kỳ ${appliedCycle} năm vận hành vào năm ${milestoneComm}.${isCustomCycle ? ' (Sử dụng chu kỳ riêng được điều chỉnh)' : ''}`,
        calculationMode: mode,
        appliedCycleYears: appliedCycle,
        appliedCycleMonths: appliedMonths,
        lastRepairTypeUsed: 'Vận hành ban đầu',
        isEstimatedByYear: true,
        isCustomCycle,
      };
    }

    // Completely missing date information
    return {
      yearsElapsed: null,
      milestoneYear: null,
      eligibleYear: null,
      statusColor: 'YELLOW',
      statusLabel: 'Thiếu dữ liệu năm SCL',
      isOverdue: false,
      reason: 'Thiếu thông tin năm SCL và năm vận hành. Không đủ dữ liệu để tính chu kỳ bảo trì.',
      calculationMode: mode,
      appliedCycleYears: appliedCycle,
      appliedCycleMonths: appliedMonths,
      lastRepairTypeUsed: 'Chưa có',
      isEstimatedByYear: true,
      isCustomCycle,
    };
  }

  // Check for invalid future repair year
  if (lastRepairYear > currentYear) {
    return {
      yearsElapsed: null,
      milestoneYear: lastRepairYear + appliedCycle,
      eligibleYear: lastRepairYear + appliedCycle + (mode === 'Greater' ? 1 : 0),
      statusColor: 'YELLOW',
      statusLabel: 'Năm SCL ở tương lai',
      isOverdue: false,
      reason: `Năm SCL được ghi nhận (${lastRepairYear}) lớn hơn năm hiện tại (${currentYear}). Vui lòng kiểm tra lại dữ liệu.`,
      calculationMode: mode,
      appliedCycleYears: appliedCycle,
      appliedCycleMonths: appliedMonths,
      lastRepairTypeUsed: repairTypeLabel,
      isEstimatedByYear,
      isCustomCycle,
    };
  }

  const yearsElapsed = currentYear - lastRepairYear;
  const milestoneYear = lastRepairYear + appliedCycle;
  const eligibleYear = mode === 'Greater' ? milestoneYear + 1 : milestoneYear;

  if (mode === 'Greater') {
    // Mode: Phải lớn hơn chu kỳ (Vượt mốc) mới đủ điều kiện (Mặc định)
    if (yearsElapsed < appliedCycle) {
      const remainingYears = appliedCycle - yearsElapsed;
      return {
        yearsElapsed,
        milestoneYear,
        eligibleYear,
        statusColor: 'RED',
        statusLabel: 'Chưa đủ chu kỳ',
        isOverdue: false,
        reason: `SCL gần nhất năm ${lastRepairYear} (mới qua ${yearsElapsed} năm). Cần chờ đến năm ${milestoneYear} để đạt mốc ${appliedCycle} năm (còn ${remainingYears} năm). Dự kiến đủ điều kiện vượt ${appliedCycle} năm vào năm ${eligibleYear}.${isCustomCycle ? ' [Áp dụng chu kỳ riêng]' : ''}`,
        calculationMode: mode,
        appliedCycleYears: appliedCycle,
        appliedCycleMonths: appliedMonths,
        lastRepairTypeUsed: repairTypeLabel,
        isEstimatedByYear,
        isCustomCycle,
      };
    } else if (yearsElapsed === appliedCycle) {
      return {
        yearsElapsed,
        milestoneYear,
        eligibleYear,
        statusColor: 'YELLOW',
        statusLabel: `Đạt mốc ${appliedCycle} năm (Cần xác nhận)`,
        isOverdue: false,
        reason: `Đã đúng ${appliedCycle} năm kể từ lần SCL năm ${lastRepairYear}. Theo quy tắc "vượt mốc > ${appliedCycle} năm", tài sản sẽ đủ điều kiện thời gian vào năm ${eligibleYear}.${isCustomCycle ? ' [Áp dụng chu kỳ riêng]' : ''}`,
        calculationMode: mode,
        appliedCycleYears: appliedCycle,
        appliedCycleMonths: appliedMonths,
        lastRepairTypeUsed: repairTypeLabel,
        isEstimatedByYear,
        isCustomCycle,
      };
    } else {
      // yearsElapsed > appliedCycle
      const overYears = yearsElapsed - appliedCycle;
      return {
        yearsElapsed,
        milestoneYear,
        eligibleYear,
        statusColor: 'GREEN',
        statusLabel: 'Đủ điều kiện thời gian',
        isOverdue: true,
        reason: `Lần SCL gần nhất năm ${lastRepairYear} (đã qua ${yearsElapsed} năm). Đã vượt mốc ${appliedCycle} năm (${overYears} năm) - Đủ điều kiện thời gian để đề xuất SCL tiếp theo.${isCustomCycle ? ' [Áp dụng chu kỳ riêng]' : ''}`,
        calculationMode: mode,
        appliedCycleYears: appliedCycle,
        appliedCycleMonths: appliedMonths,
        lastRepairTypeUsed: repairTypeLabel,
        isEstimatedByYear,
        isCustomCycle,
      };
    }
  } else {
    // Mode: Exact (Đủ mốc)
    if (yearsElapsed < appliedCycle) {
      return {
        yearsElapsed,
        milestoneYear,
        eligibleYear,
        statusColor: 'RED',
        statusLabel: 'Chưa đủ chu kỳ',
        isOverdue: false,
        reason: `SCL gần nhất năm ${lastRepairYear} (mới qua ${yearsElapsed} năm). Cần chờ đến năm ${milestoneYear} để đủ ${appliedCycle} năm.`,
        calculationMode: mode,
        appliedCycleYears: appliedCycle,
        appliedCycleMonths: appliedMonths,
        lastRepairTypeUsed: repairTypeLabel,
        isEstimatedByYear,
        isCustomCycle,
      };
    } else {
      return {
        yearsElapsed,
        milestoneYear,
        eligibleYear,
        statusColor: 'GREEN',
        statusLabel: 'Đạt / Vượt mốc chu kỳ',
        isOverdue: yearsElapsed > appliedCycle,
        reason: `Đã qua ${yearsElapsed} năm kể từ lần SCL năm ${lastRepairYear}. Đã đạt/vượt mốc ${appliedCycle} năm (${milestoneYear}) - Đủ điều kiện đề xuất.`,
        calculationMode: mode,
        appliedCycleYears: appliedCycle,
        appliedCycleMonths: appliedMonths,
        lastRepairTypeUsed: repairTypeLabel,
        isEstimatedByYear,
        isCustomCycle,
      };
    }
  }
}

/**
 * Calculates SCL Plan Status for an asset.
 */
export function calculatePlanStatus(
  asset: Asset,
  planRecords: PlanRecord[],
  targetYear?: number
): CalculatedPlanStatus {
  const sclPlans = planRecords.filter(
    (p) =>
      p.assetCode.toUpperCase() === asset.assetCode.toUpperCase() &&
      (targetYear ? p.planYear === targetYear : true) &&
      p.status !== 'Cancelled'
  );

  const inSCL = sclPlans.length > 0;

  let planColor: PlanStatusGroupColor = 'GREEN';
  let statusLabel = 'Chưa có trong KH SCL';
  let summaryText = `Chưa tìm thấy trong Kế hoạch SCL ${
    targetYear ? `năm ${targetYear}` : 'đã nhập'
  }.`;

  if (inSCL) {
    planColor = 'BLUE';
    statusLabel = 'Đã có trong KH SCL';
    summaryText = `Nằm trong KH SCL năm ${sclPlans
      .map((p) => `${p.planYear} (Công trình: ${p.projectName})`)
      .join('; ')}.`;
  }

  return {
    planColor,
    statusLabel,
    inSCL,
    sclPlanDetails: sclPlans,
    summaryText,
  };
}
