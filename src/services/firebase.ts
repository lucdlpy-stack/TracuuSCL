import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Test Firestore connection on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'assets', '_health_check'));
    console.log('Firestore connected successfully.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firestore offline or checking connection.');
    }
  }
}

testFirestoreConnection();
