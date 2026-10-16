import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Asset, RepairRecord, PlanRecord, CycleRule, AuthUser } from '../types/asset';
import { SEED_ASSETS, SEED_REPAIRS, SEED_PLANS, SEED_RULES } from './storage';

export interface FirestoreDataPayload {
  assets?: Asset[];
  repairRecords?: RepairRecord[];
  planRecords?: PlanRecord[];
  cycleRules?: CycleRule[];
  users?: AuthUser[];
}

type SyncListener = (payload: FirestoreDataPayload) => void;

class FirebaseSyncService {
  private listeners: SyncListener[] = [];
  private isSeeded = false;

  constructor() {
    this.initRealtimeListeners();
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(payload: FirestoreDataPayload) {
    this.listeners.forEach((l) => l(payload));
  }

  private initRealtimeListeners() {
    // 1. Listen to 'assets' collection
    onSnapshot(
      collection(db, 'assets'),
      (snapshot) => {
        const assets: Asset[] = [];
        snapshot.forEach((doc) => {
          assets.push(doc.data() as Asset);
        });
        if (assets.length > 0) {
          this.notify({ assets });
        } else if (!this.isSeeded) {
          this.seedInitialDataToFirestore();
        }
      },
      (error) => {
        console.error('Firestore assets listener error:', error);
      }
    );

    // 2. Listen to 'repairRecords' collection
    onSnapshot(
      collection(db, 'repairRecords'),
      (snapshot) => {
        const repairRecords: RepairRecord[] = [];
        snapshot.forEach((doc) => {
          repairRecords.push(doc.data() as RepairRecord);
        });
        this.notify({ repairRecords });
      },
      (error) => {
        console.error('Firestore repairs listener error:', error);
      }
    );

    // 3. Listen to 'planRecords' collection
    onSnapshot(
      collection(db, 'planRecords'),
      (snapshot) => {
        const planRecords: PlanRecord[] = [];
        snapshot.forEach((doc) => {
          planRecords.push(doc.data() as PlanRecord);
        });
        this.notify({ planRecords });
      },
      (error) => {
        console.error('Firestore plans listener error:', error);
      }
    );

    // 4. Listen to 'cycleRules' collection
    onSnapshot(
      collection(db, 'cycleRules'),
      (snapshot) => {
        const cycleRules: CycleRule[] = [];
        snapshot.forEach((doc) => {
          cycleRules.push(doc.data() as CycleRule);
        });
        this.notify({ cycleRules });
      },
      (error) => {
        console.error('Firestore rules listener error:', error);
      }
    );
  }

  // Seed default EVN data to Cloud Firestore if database is empty on first launch
  public async seedInitialDataToFirestore() {
    if (this.isSeeded) return;
    this.isSeeded = true;

    try {
      const snap = await getDocs(collection(db, 'assets'));
      if (!snap.empty) return;

      console.log('Seeding initial EVN data to Cloud Firestore...');
      const batch = writeBatch(db);

      SEED_ASSETS.forEach((asset) => {
        batch.set(doc(db, 'assets', asset.assetCode), asset);
      });

      SEED_REPAIRS.forEach((repair) => {
        batch.set(doc(db, 'repairRecords', repair.id), repair);
      });

      SEED_PLANS.forEach((plan) => {
        batch.set(doc(db, 'planRecords', plan.id), plan);
      });

      SEED_RULES.forEach((rule) => {
        batch.set(doc(db, 'cycleRules', rule.id), rule);
      });

      await batch.commit();
      console.log('Cloud Firestore seeded successfully!');
    } catch (err) {
      console.error('Failed to seed initial Cloud Firestore data:', err);
    }
  }

  // Write methods to persist and push updates directly to Cloud Firestore
  public async saveAsset(asset: Asset): Promise<void> {
    try {
      await setDoc(doc(db, 'assets', asset.assetCode), asset, { merge: true });
    } catch (err) {
      console.error('Failed to save asset to Firestore:', err);
    }
  }

  public async deleteAsset(assetCode: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'assets', assetCode));
    } catch (err) {
      console.error('Failed to delete asset from Firestore:', err);
    }
  }

  public async saveRepair(repair: RepairRecord): Promise<void> {
    try {
      await setDoc(doc(db, 'repairRecords', repair.id), repair, { merge: true });
    } catch (err) {
      console.error('Failed to save repair record to Firestore:', err);
    }
  }

  public async deleteRepair(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'repairRecords', id));
    } catch (err) {
      console.error('Failed to delete repair record from Firestore:', err);
    }
  }

  public async savePlan(plan: PlanRecord): Promise<void> {
    try {
      await setDoc(doc(db, 'planRecords', plan.id), plan, { merge: true });
    } catch (err) {
      console.error('Failed to save plan record to Firestore:', err);
    }
  }

  public async deletePlan(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'planRecords', id));
    } catch (err) {
      console.error('Failed to delete plan record from Firestore:', err);
    }
  }

  public async saveCycleRule(rule: CycleRule): Promise<void> {
    try {
      await setDoc(doc(db, 'cycleRules', rule.id), rule, { merge: true });
    } catch (err) {
      console.error('Failed to save cycle rule to Firestore:', err);
    }
  }

  public async deleteCycleRule(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'cycleRules', id));
    } catch (err) {
      console.error('Failed to delete cycle rule from Firestore:', err);
    }
  }

  public async saveAllAssets(assets: Asset[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      assets.forEach((a) => {
        batch.set(doc(db, 'assets', a.assetCode), a, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to save all assets to Firestore:', err);
    }
  }
}

export const firebaseSync = new FirebaseSyncService();
