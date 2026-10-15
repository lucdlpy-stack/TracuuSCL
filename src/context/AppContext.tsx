import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Asset,
  RepairRecord,
  PlanRecord,
  CycleRule,
  SystemLog,
  CalculatedCycleStatus,
  CalculatedPlanStatus,
  AuthUser,
} from '../types/asset';
import {
  loadStoredData,
  saveStoredData,
  logSystemAction,
  SEED_ASSETS,
  SEED_REPAIRS,
  SEED_PLANS,
  SEED_RULES,
  SEED_LOGS,
} from '../services/storage';
import {
  calculateCycleStatus,
  calculatePlanStatus,
  getApplicableRule,
} from '../services/cycleEngine';
import { getStoredUser, clearStoredAuth, checkAuth } from '../services/auth';
import { realtimeSync } from '../services/realtimeSync';

const STORAGE_KEYS = {
  ASSETS: 'evn_assets_db_v2',
  REPAIRS: 'evn_repairs_db_v2',
  PLANS: 'evn_plans_db_v2',
  RULES: 'evn_rules_db_v2',
  LOGS: 'evn_logs_db_v2',
};

// Cross-tab broadcast channel
const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('evn_realtime_sync_channel') : null;

interface AppContextType {
  // Auth
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;

  // Data
  assets: Asset[];
  repairRecords: RepairRecord[];
  planRecords: PlanRecord[];
  cycleRules: CycleRule[];
  systemLogs: SystemLog[];
  currentYear: number;
  setCurrentYear: (year: number) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedAssetCode: string | null;
  setSelectedAssetCode: (code: string | null) => void;
  isOnline: boolean;
  lastSyncedAt: string;
  forceSyncAll: () => void;

  // Helpers
  getAssetByCode: (code: string) => Asset | undefined;
  getAssetCycleStatus: (asset: Asset) => CalculatedCycleStatus;
  getAssetPlanStatus: (asset: Asset, targetYear?: number) => CalculatedPlanStatus;

  // CRUD Asset
  addAsset: (asset: Omit<Asset, 'updatedAt' | 'updatedBy'>) => boolean;
  updateAsset: (code: string, updates: Partial<Asset>) => boolean;
  deleteAsset: (code: string) => boolean;
  setAssetCustomCycle: (code: string, years?: number, months?: number) => void;

  // CRUD Repairs
  addRepairRecord: (repair: Omit<RepairRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRepairRecord: (id: string, updates: Partial<RepairRecord>) => void;
  deleteRepairRecord: (id: string) => void;

  // CRUD Plans
  addPlanRecord: (plan: Omit<PlanRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePlanRecord: (id: string, updates: Partial<PlanRecord>) => void;
  deletePlanRecord: (id: string) => void;

  // CRUD Rules
  addCycleRule: (rule: Omit<CycleRule, 'id' | 'updatedAt' | 'updatedBy'>) => void;
  updateCycleRule: (id: string, updates: Partial<CycleRule>) => void;
  deleteCycleRule: (id: string) => void;

  // Excel Batches
  importAssetsBatch: (newAssets: Asset[], mergeMode: 'CREATE' | 'UPDATE' | 'MERGE') => { created: number; updated: number };
  importRepairsBatch: (newRepairs: RepairRecord[]) => number;
  importPlansBatch: (newPlans: PlanRecord[]) => number;

  // System
  loadTestScenarios: () => void;
  resetToSeedData: () => void;
  exportAllDataJSON: () => string;
  restoreAllDataJSON: (jsonString: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getStoredUser());

  const [assets, setAssets] = useState<Asset[]>(() =>
    loadStoredData<Asset[]>(STORAGE_KEYS.ASSETS, SEED_ASSETS)
  );
  const [repairRecords, setRepairRecords] = useState<RepairRecord[]>(() =>
    loadStoredData<RepairRecord[]>(STORAGE_KEYS.REPAIRS, SEED_REPAIRS)
  );
  const [planRecords, setPlanRecords] = useState<PlanRecord[]>(() =>
    loadStoredData<PlanRecord[]>(STORAGE_KEYS.PLANS, SEED_PLANS)
  );
  const [cycleRules, setCycleRules] = useState<CycleRule[]>(() =>
    loadStoredData<CycleRule[]>(STORAGE_KEYS.RULES, SEED_RULES)
  );
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() =>
    loadStoredData<SystemLog[]>(STORAGE_KEYS.LOGS, SEED_LOGS)
  );

  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAssetCode, setSelectedAssetCode] = useState<string | null>(null);

  // Network & Sync status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(new Date().toISOString());

  // Check auth session on startup
  useEffect(() => {
    checkAuth().then((user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
      } else {
        // if token invalid
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real-time synchronization subscription (SSE Stream from server)
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe((remotePayload) => {
      if (Array.isArray(remotePayload.assets)) {
        setAssets(remotePayload.assets);
        saveStoredData(STORAGE_KEYS.ASSETS, remotePayload.assets);
      }
      if (Array.isArray(remotePayload.repairRecords)) {
        setRepairRecords(remotePayload.repairRecords);
        saveStoredData(STORAGE_KEYS.REPAIRS, remotePayload.repairRecords);
      }
      if (Array.isArray(remotePayload.planRecords)) {
        setPlanRecords(remotePayload.planRecords);
        saveStoredData(STORAGE_KEYS.PLANS, remotePayload.planRecords);
      }
      if (Array.isArray(remotePayload.cycleRules)) {
        setCycleRules(remotePayload.cycleRules);
        saveStoredData(STORAGE_KEYS.RULES, remotePayload.cycleRules);
      }
      if (Array.isArray(remotePayload.systemLogs)) {
        setSystemLogs(remotePayload.systemLogs);
        saveStoredData(STORAGE_KEYS.LOGS, remotePayload.systemLogs);
      }
      setLastSyncedAt(new Date().toISOString());
    });

    // Also pull latest data from server immediately on startup
    fetch('/api/sync/pull')
      .then((res) => res.json())
      .then((data) => {
        if (!data.data || !Array.isArray(data.data.assets) || data.data.assets.length === 0) {
          // Push local seed data to server so all devices receive it
          realtimeSync.pushUpdate({
            assets,
            repairRecords,
            planRecords,
            cycleRules,
            systemLogs,
          });
        } else {
          // Sync server data to client
          if (Array.isArray(data.data.assets)) {
            setAssets(data.data.assets);
            saveStoredData(STORAGE_KEYS.ASSETS, data.data.assets);
          }
          if (Array.isArray(data.data.repairRecords)) {
            setRepairRecords(data.data.repairRecords);
            saveStoredData(STORAGE_KEYS.REPAIRS, data.data.repairRecords);
          }
          if (Array.isArray(data.data.planRecords)) {
            setPlanRecords(data.data.planRecords);
            saveStoredData(STORAGE_KEYS.PLANS, data.data.planRecords);
          }
          if (Array.isArray(data.data.cycleRules)) {
            setCycleRules(data.data.cycleRules);
            saveStoredData(STORAGE_KEYS.RULES, data.data.cycleRules);
          }
          if (Array.isArray(data.data.systemLogs)) {
            setSystemLogs(data.data.systemLogs);
            saveStoredData(STORAGE_KEYS.LOGS, data.data.systemLogs);
          }
          setLastSyncedAt(new Date().toISOString());
        }
      })
      .catch(() => {});

    return () => {
      unsubscribe();
    };
  }, []);

  // Broadcast channel for same-origin tabs
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
        forceSyncAllFromStorage();
      }
    };

    const handleChannelMessage = (e: MessageEvent) => {
      if (e.data === 'SYNC_ALL') {
        forceSyncAllFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    if (syncChannel) syncChannel.addEventListener('message', handleChannelMessage);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      if (syncChannel) syncChannel.removeEventListener('message', handleChannelMessage);
    };
  }, []);

  const forceSyncAllFromStorage = () => {
    setAssets(loadStoredData<Asset[]>(STORAGE_KEYS.ASSETS, SEED_ASSETS));
    setRepairRecords(loadStoredData<RepairRecord[]>(STORAGE_KEYS.REPAIRS, SEED_REPAIRS));
    setPlanRecords(loadStoredData<PlanRecord[]>(STORAGE_KEYS.PLANS, SEED_PLANS));
    setCycleRules(loadStoredData<CycleRule[]>(STORAGE_KEYS.RULES, SEED_RULES));
    setSystemLogs(loadStoredData<SystemLog[]>(STORAGE_KEYS.LOGS, SEED_LOGS));
    setLastSyncedAt(new Date().toISOString());
  };

  const broadcastAndPushSync = (newAssets?: Asset[], newRepairs?: RepairRecord[], newPlans?: PlanRecord[], newRules?: CycleRule[], newLogs?: SystemLog[]) => {
    setLastSyncedAt(new Date().toISOString());
    if (syncChannel) syncChannel.postMessage('SYNC_ALL');

    // Push to server immediately for instant cross-device sync (smartphone & web)
    realtimeSync.pushUpdate({
      assets: newAssets ?? assets,
      repairRecords: newRepairs ?? repairRecords,
      planRecords: newPlans ?? planRecords,
      cycleRules: newRules ?? cycleRules,
      systemLogs: newLogs ?? systemLogs,
    });
  };

  // Sync state changes to storage
  useEffect(() => {
    saveStoredData(STORAGE_KEYS.ASSETS, assets);
  }, [assets]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.REPAIRS, repairRecords);
  }, [repairRecords]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.PLANS, planRecords);
  }, [planRecords]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.RULES, cycleRules);
  }, [cycleRules]);

  const forceSyncAll = () => {
    realtimeSync.checkAndSyncNow().then(() => {
      setLastSyncedAt(new Date().toISOString());
    });
    fetch('/api/sync/pull')
      .then((res) => res.json())
      .then((res) => {
        if (res.data) {
          if (Array.isArray(res.data.assets)) setAssets(res.data.assets);
          if (Array.isArray(res.data.repairRecords)) setRepairRecords(res.data.repairRecords);
          if (Array.isArray(res.data.planRecords)) setPlanRecords(res.data.planRecords);
          if (Array.isArray(res.data.cycleRules)) setCycleRules(res.data.cycleRules);
          if (Array.isArray(res.data.systemLogs)) setSystemLogs(res.data.systemLogs);
        }
        setLastSyncedAt(new Date().toISOString());
      })
      .catch(() => {
        forceSyncAllFromStorage();
      });
  };

  const login = (user: AuthUser, token: string) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearStoredAuth();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const getAssetByCode = (code: string) => {
    return assets.find((a) => a.assetCode.toUpperCase() === code.toUpperCase());
  };

  const getAssetCycleStatus = (asset: Asset): CalculatedCycleStatus => {
    const rule = getApplicableRule(asset, cycleRules);
    return calculateCycleStatus(asset, repairRecords, rule, currentYear);
  };

  const getAssetPlanStatus = (asset: Asset, targetYear?: number): CalculatedPlanStatus => {
    return calculatePlanStatus(asset, planRecords, targetYear ?? currentYear);
  };

  // CRUD Asset
  const addAsset = (data: Omit<Asset, 'updatedAt' | 'updatedBy'>): boolean => {
    const upper = data.assetCode.trim().toUpperCase();
    if (assets.some((a) => a.assetCode.toUpperCase() === upper)) {
      return false; // Code exists
    }

    const newAsset: Asset = {
      ...data,
      assetCode: data.assetCode.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Cán bộ Kỹ thuật',
    };

    const nextAssets = [newAsset, ...assets];
    setAssets(nextAssets);
    const newLog = logSystemAction('CREATE', 'ASSET', newAsset.assetCode, `Thêm mới tài sản: ${newAsset.assetName}`);
    const nextLogs = [newLog, ...systemLogs];
    setSystemLogs(nextLogs);

    broadcastAndPushSync(nextAssets, repairRecords, planRecords, cycleRules, nextLogs);
    return true;
  };

  const updateAsset = (code: string, updates: Partial<Asset>): boolean => {
    let updated = false;
    const nextAssets = assets.map((a) => {
      if (a.assetCode.toUpperCase() === code.toUpperCase()) {
        updated = true;
        return {
          ...a,
          ...updates,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.name || 'Cán bộ Kỹ thuật',
        };
      }
      return a;
    });

    if (updated) {
      setAssets(nextAssets);
      const newLog = logSystemAction('UPDATE', 'ASSET', code, `Cập nhật thông tin tài sản: ${code}`);
      const nextLogs = [newLog, ...systemLogs];
      setSystemLogs(nextLogs);
      broadcastAndPushSync(nextAssets, repairRecords, planRecords, cycleRules, nextLogs);
    }
    return updated;
  };

  const setAssetCustomCycle = (code: string, years?: number, months?: number) => {
    updateAsset(code, {
      customCycleYears: years,
      customCycleMonths: months,
    });
    logSystemAction(
      'CONFIG_CHANGE',
      'ASSET',
      code,
      `Chỉnh sửa chu kỳ riêng cho tài sản ${code}: ${years ?? 'mặc định'} năm`
    );
  };

  const deleteAsset = (code: string): boolean => {
    let deleted = false;
    const nextAssets = assets.filter((a) => a.assetCode.toUpperCase() !== code.toUpperCase());
    if (nextAssets.length !== assets.length) deleted = true;

    if (deleted) {
      setAssets(nextAssets);
      const newLog = logSystemAction('DELETE', 'ASSET', code, `Xóa tài sản khỏi danh mục: ${code}`);
      const nextLogs = [newLog, ...systemLogs];
      setSystemLogs(nextLogs);
      broadcastAndPushSync(nextAssets, repairRecords, planRecords, cycleRules, nextLogs);
    }
    return deleted;
  };

  // CRUD Repairs
  const addRepairRecord = (repair: Omit<RepairRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecord: RepairRecord = {
      ...repair,
      id: `REP-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextRepairs = [newRecord, ...repairRecords];
    setRepairRecords(nextRepairs);

    let nextAssets = assets;
    if (newRecord.repairType === 'SCL' && newRecord.status === 'Completed') {
      nextAssets = assets.map((a) => {
        if (a.assetCode.toUpperCase() === newRecord.assetCode.toUpperCase()) {
          return {
            ...a,
            lastMajorRepairYear: newRecord.year,
            lastMajorRepairDate: newRecord.endDate || newRecord.startDate,
            lastMajorRepairContent: newRecord.workContent,
            lastMajorRepairProject: newRecord.projectName,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.name || 'Cán bộ Kỹ thuật',
          };
        }
        return a;
      });
      setAssets(nextAssets);
    }

    const newLog = logSystemAction('CREATE', 'REPAIR', newRecord.id, `Thêm bản ghi SCL cho tài sản ${newRecord.assetCode} (Công trình: ${newRecord.projectName || 'Mặc định'})`);
    const nextLogs = [newLog, ...systemLogs];
    setSystemLogs(nextLogs);

    broadcastAndPushSync(nextAssets, nextRepairs, planRecords, cycleRules, nextLogs);
  };

  const updateRepairRecord = (id: string, updates: Partial<RepairRecord>) => {
    const nextRepairs = repairRecords.map((r) =>
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    );
    setRepairRecords(nextRepairs);
    const newLog = logSystemAction('UPDATE', 'REPAIR', id, `Cập nhật bản ghi sửa chữa ${id}`);
    const nextLogs = [newLog, ...systemLogs];
    setSystemLogs(nextLogs);
    broadcastAndPushSync(assets, nextRepairs, planRecords, cycleRules, nextLogs);
  };

  const deleteRepairRecord = (id: string) => {
    const nextRepairs = repairRecords.filter((r) => r.id !== id);
    setRepairRecords(nextRepairs);
    const newLog = logSystemAction('DELETE', 'REPAIR', id, `Xóa bản ghi sửa chữa ${id}`);
    const nextLogs = [newLog, ...systemLogs];
    setSystemLogs(nextLogs);
    broadcastAndPushSync(assets, nextRepairs, planRecords, cycleRules, nextLogs);
  };

  // CRUD Plans
  const addPlanRecord = (plan: Omit<PlanRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecord: PlanRecord = {
      ...plan,
      id: `PLAN-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextPlans = [newRecord, ...planRecords];
    setPlanRecords(nextPlans);
    const newLog = logSystemAction('CREATE', 'PLAN', newRecord.id, `Thêm SCL vào Công trình "${newRecord.projectName}" năm ${newRecord.planYear} cho tài sản ${newRecord.assetCode}`);
    const nextLogs = [newLog, ...systemLogs];
    setSystemLogs(nextLogs);
    broadcastAndPushSync(assets, repairRecords, nextPlans, cycleRules, nextLogs);
  };

  const updatePlanRecord = (id: string, updates: Partial<PlanRecord>) => {
    const nextPlans = planRecords.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    setPlanRecords(nextPlans);
    const newLog = logSystemAction('UPDATE', 'PLAN', id, `Cập nhật kế hoạch SCL ${id}`);
    const nextLogs = [newLog, ...systemLogs];
    setSystemLogs(nextLogs);
    broadcastAndPushSync(assets, repairRecords, nextPlans, cycleRules, nextLogs);
  };

  const deletePlanRecord = (id: string) => {
    const nextPlans = planRecords.filter((p) => p.id !== id);
    setPlanRecords(nextPlans);
    const newLog = logSystemAction('DELETE', 'PLAN', id, `Xóa bản ghi kế hoạch ${id}`);
    const nextLogs = [newLog, ...systemLogs];
    setSystemLogs(nextLogs);
    broadcastAndPushSync(assets, repairRecords, nextPlans, cycleRules, nextLogs);
  };

  // CRUD Cycle Rules
  const addCycleRule = (rule: Omit<CycleRule, 'id' | 'updatedAt' | 'updatedBy'>) => {
    const newRule: CycleRule = {
      ...rule,
      id: `RULE-${Date.now()}`,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Cán bộ Quản trị',
    };

    const nextRules = [newRule, ...cycleRules];
    setCycleRules(nextRules);
    const newLog = logSystemAction('CONFIG_CHANGE', 'RULE', newRule.id, `Tạo mới quy tắc chu kỳ bảo trì: ${newRule.groupName}`);
    const nextLogs = [newLog, ...systemLogs];
    setSystemLogs(nextLogs);
    broadcastAndPushSync(assets, repairRecords, planRecords, nextRules, nextLogs);
  };

  const updateCycleRule = (id: string, updates: Partial<CycleRule>) => {
    const nextRules = cycleRules.map((r) =>
      r.id === id
        ? { ...r, ...updates, updatedAt: new Date().toISOString(), updatedBy: currentUser?.name || 'Cán bộ Quản trị' }
        : r
    );
    setCycleRules(nextRules);
    const newLog = logSystemAction('CONFIG_CHANGE', 'RULE', id, `Cập nhật quy tắc chu kỳ bảo trì nhóm tài sản: ${id}`);
    const nextLogs = [newLog, ...systemLogs];
    setSystemLogs(nextLogs);
    broadcastAndPushSync(assets, repairRecords, planRecords, nextRules, nextLogs);
  };

  const deleteCycleRule = (id: string) => {
    const nextRules = cycleRules.filter((r) => r.id !== id);
    setCycleRules(nextRules);
    const newLog = logSystemAction('CONFIG_CHANGE', 'RULE', id, `Xóa quy tắc chu kỳ bảo trì: ${id}`);
    const nextLogs = [newLog, ...systemLogs];
    setSystemLogs(nextLogs);
    broadcastAndPushSync(assets, repairRecords, planRecords, nextRules, nextLogs);
  };

  // Excel Batches
  const importAssetsBatch = (
    newAssets: Asset[],
    mergeMode: 'CREATE' | 'UPDATE' | 'MERGE'
  ): { created: number; updated: number } => {
    let created = 0;
    let updated = 0;

    const assetMap = new Map(assets.map((a) => [a.assetCode.toUpperCase(), a]));

    newAssets.forEach((incoming) => {
      const key = incoming.assetCode.toUpperCase();
      if (assetMap.has(key)) {
        if (mergeMode !== 'CREATE') {
          const existing = assetMap.get(key)!;
          assetMap.set(key, {
            ...existing,
            ...incoming,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.name || 'Nhập từ Excel',
          });
          updated++;
        }
      } else {
        assetMap.set(key, {
          ...incoming,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.name || 'Nhập từ Excel',
        });
        created++;
      }
    });

    const nextAssets = Array.from(assetMap.values());
    setAssets(nextAssets);
    const newLog = logSystemAction(
      'IMPORT_EXCEL',
      'ASSET',
      'BATCH',
      `Nhập Excel danh mục tài sản: thêm mới ${created}, cập nhật ${updated}`
    );
    const nextLogs = [newLog, ...systemLogs];
    setSystemLogs(nextLogs);
    broadcastAndPushSync(nextAssets, repairRecords, planRecords, cycleRules, nextLogs);

    return { created, updated };
  };

  const importRepairsBatch = (newRepairs: RepairRecord[]): number => {
    const nextRepairs = [...newRepairs, ...repairRecords];
    setRepairRecords(nextRepairs);
    const newLog = logSystemAction('IMPORT_EXCEL', 'REPAIR', 'BATCH', `Nhập Excel lịch sử sửa chữa: ${newRepairs.length} bản ghi`);
    const nextLogs = [newLog, ...systemLogs];
    setSystemLogs(nextLogs);
    broadcastAndPushSync(assets, nextRepairs, planRecords, cycleRules, nextLogs);
    return newRepairs.length;
  };

  const importPlansBatch = (newPlans: PlanRecord[]): number => {
    const nextPlans = [...newPlans, ...planRecords];
    setPlanRecords(nextPlans);
    const newLog = logSystemAction('IMPORT_EXCEL', 'PLAN', 'BATCH', `Nhập Excel kế hoạch SCL: ${newPlans.length} bản ghi`);
    const nextLogs = [newLog, ...systemLogs];
    setSystemLogs(nextLogs);
    broadcastAndPushSync(assets, repairRecords, nextPlans, cycleRules, nextLogs);
    return newPlans.length;
  };

  const loadTestScenarios = () => {
    const testAssets: Asset[] = [
      {
        assetCode: 'TEST-01-2024',
        assetName: 'Thiết bị Test Case 1: SCL 2024 (Hiện tại 2026 => Mới qua 2 năm)',
        category: 'Thiết bị đóng cắt',
        unit: 'Công ty Điện lực Chợ Lớn',
        location: 'Trạm 110kV Chợ Lớn',
        quantity: 1,
        commissioningYear: 2018,
        lastMajorRepairYear: 2024,
        lastMajorRepairDate: '2024-06-01',
        lastMajorRepairContent: 'SCL toàn bộ buồng dập hồ quang',
        lastMajorRepairProject: 'Công trình SCL Trạm 110kV Chợ Lớn 2024',
        customCycleYears: 5,
        notes: 'Kịch bản: Đỏ - Chưa đủ chu kỳ 5 năm (mới qua 2 năm)',
        updatedAt: new Date().toISOString(),
        updatedBy: 'Test Runner',
      },
      {
        assetCode: 'TEST-02-2021',
        assetName: 'Thiết bị Test Case 2: SCL 2021 (Hiện tại 2026 => Đạt đúng mốc 5 năm)',
        category: 'Máy biến áp / Trạm biến áp',
        unit: 'Công ty Điện lực Gia Định',
        location: 'Trạm 110kV Bình Phú',
        quantity: 1,
        commissioningYear: 2015,
        lastMajorRepairYear: 2021,
        lastMajorRepairDate: '2021-05-10',
        lastMajorRepairContent: 'SCL bộ OLTC',
        lastMajorRepairProject: 'Công trình SCL Máy biến áp Gia Định',
        customCycleYears: 5,
        notes: 'Kịch bản: Vàng - Đạt mốc 5 năm, cần xác minh quy tắc',
        updatedAt: new Date().toISOString(),
        updatedBy: 'Test Runner',
      },
      {
        assetCode: 'TEST-03-2020',
        assetName: 'Thiết bị Test Case 3: SCL 2020 (Hiện tại 2026 => Đã qua 6 năm, vượt 5 năm)',
        category: 'Đường dây trung thế / hạ thế',
        unit: 'Công ty Điện lực Tân Thuận',
        location: 'Tuyến 471 Tân Thuận',
        quantity: 5,
        commissioningYear: 2010,
        lastMajorRepairYear: 2020,
        lastMajorRepairDate: '2020-09-15',
        lastMajorRepairContent: 'SCL đại tu toàn bộ cáp bọc',
        lastMajorRepairProject: 'Công trình SCL Tuyến 471 Tân Thuận 2020',
        customCycleYears: 5,
        notes: 'Kịch bản: Xanh - Vượt chu kỳ 5 năm (đã qua 6 năm)',
        updatedAt: new Date().toISOString(),
        updatedBy: 'Test Runner',
      },
      {
        assetCode: 'TEST-04-CUSTOM3Y',
        assetName: 'Thiết bị Test Case 4: Chu kỳ riêng được chỉnh sửa (3 năm)',
        category: 'Thiết bị đóng cắt',
        unit: 'Công ty Điện lực Bình Phú',
        location: 'Trạm 110kV An Lạc',
        quantity: 1,
        commissioningYear: 2018,
        lastMajorRepairYear: 2022,
        lastMajorRepairDate: '2022-02-12',
        lastMajorRepairContent: 'SCL thay bộ truyền động',
        lastMajorRepairProject: 'Công trình SCL Thiết bị Đóng cắt Bình Phú',
        customCycleYears: 3,
        notes: 'Kịch bản: Chu kỳ tùy chỉnh 3 năm (SCL 2022 => Hiện tại 2026 đã qua 4 năm => Đã vượt chu kỳ riêng 3 năm)',
        updatedAt: new Date().toISOString(),
        updatedBy: 'Test Runner',
      },
    ];

    const testRepairs: RepairRecord[] = [
      {
        id: 'REP-TEST-01',
        assetCode: 'TEST-01-2024',
        repairType: 'SCL',
        projectName: 'Công trình SCL Trạm 110kV Chợ Lớn 2024',
        year: 2024,
        endDate: '2024-06-01',
        workContent: 'SCL toàn bộ buồng dập hồ quang',
        status: 'Completed',
        dataSource: 'Test Runner',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'REP-TEST-02',
        assetCode: 'TEST-02-2021',
        repairType: 'SCL',
        projectName: 'Công trình SCL Máy biến áp Gia Định',
        year: 2021,
        endDate: '2021-05-10',
        workContent: 'SCL bộ OLTC',
        status: 'Completed',
        dataSource: 'Test Runner',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const testPlans: PlanRecord[] = [
      {
        id: 'PLAN-TEST-01',
        assetCode: 'TEST-03-2020',
        planYear: 2026,
        planCode: 'KH-SCL-2026-TEST-01',
        projectName: 'Công trình SCL Tuyến 471 Tân Thuận Năm 2026',
        workContent: 'SCL thay mới chuỗi cách điện và xà đỡ cáp',
        status: 'Approved',
        dataSource: 'Test Runner',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const nextAssets = [...testAssets, ...assets];
    const nextRepairs = [...testRepairs, ...repairRecords];
    const nextPlans = [...testPlans, ...planRecords];
    setAssets(nextAssets);
    setRepairRecords(nextRepairs);
    setPlanRecords(nextPlans);

    const newLog = logSystemAction(
      'CREATE',
      'SYSTEM',
      'TEST_SCENARIOS',
      'Nạp thành công các kịch bản kiểm thử nghiệp vụ SCL EVN'
    );
    const nextLogs = [newLog, ...systemLogs];
    setSystemLogs(nextLogs);
    broadcastAndPushSync(nextAssets, nextRepairs, nextPlans, cycleRules, nextLogs);
  };

  const resetToSeedData = () => {
    setAssets(SEED_ASSETS);
    setRepairRecords(SEED_REPAIRS);
    setPlanRecords(SEED_PLANS);
    setCycleRules(SEED_RULES);
    setSystemLogs(SEED_LOGS);

    saveStoredData(STORAGE_KEYS.ASSETS, SEED_ASSETS);
    saveStoredData(STORAGE_KEYS.REPAIRS, SEED_REPAIRS);
    saveStoredData(STORAGE_KEYS.PLANS, SEED_PLANS);
    saveStoredData(STORAGE_KEYS.RULES, SEED_RULES);
    saveStoredData(STORAGE_KEYS.LOGS, SEED_LOGS);

    logSystemAction('RESTORE', 'SYSTEM', 'RESET', 'Khôi phục lại dữ liệu mẫu khởi tạo ban đầu');
    broadcastAndPushSync(SEED_ASSETS, SEED_REPAIRS, SEED_PLANS, SEED_RULES, SEED_LOGS);
  };

  const exportAllDataJSON = (): string => {
    return JSON.stringify(
      {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        assets,
        repairRecords,
        planRecords,
        cycleRules,
        systemLogs,
      },
      null,
      2
    );
  };

  const restoreAllDataJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.assets && Array.isArray(parsed.assets)) {
        setAssets(parsed.assets);
        if (parsed.repairRecords) setRepairRecords(parsed.repairRecords);
        if (parsed.planRecords) setPlanRecords(parsed.planRecords);
        if (parsed.cycleRules) setCycleRules(parsed.cycleRules);
        if (parsed.systemLogs) setSystemLogs(parsed.systemLogs);

        logSystemAction('RESTORE', 'SYSTEM', 'JSON', 'Khôi phục dữ liệu toàn bộ hệ thống từ file JSON');
        broadcastAndPushSync(parsed.assets, parsed.repairRecords, parsed.planRecords, parsed.cycleRules, parsed.systemLogs);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to parse restore JSON', e);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        logout,

        assets,
        repairRecords,
        planRecords,
        cycleRules,
        systemLogs,
        currentYear,
        setCurrentYear,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        selectedAssetCode,
        setSelectedAssetCode,
        isOnline,
        lastSyncedAt,
        forceSyncAll,

        getAssetByCode,
        getAssetCycleStatus,
        getAssetPlanStatus,

        addAsset,
        updateAsset,
        deleteAsset,
        setAssetCustomCycle,

        addRepairRecord,
        updateRepairRecord,
        deleteRepairRecord,

        addPlanRecord,
        updatePlanRecord,
        deletePlanRecord,

        addCycleRule,
        updateCycleRule,
        deleteCycleRule,

        importAssetsBatch,
        importRepairsBatch,
        importPlansBatch,

        loadTestScenarios,
        resetToSeedData,
        exportAllDataJSON,
        restoreAllDataJSON,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
