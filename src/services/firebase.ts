import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const DAILY_LIMIT = 25;

function getUserId() {
  let userId = localStorage.getItem('plantcare_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('plantcare_user_id', userId);
  }
  return userId;
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export async function checkAndIncrementUsage(): Promise<{ allowed: boolean; remaining: number }> {
  const userId = getUserId();
  const today = getTodayStr();
  const usageId = `${userId}_${today}`;
  const usageRef = doc(db, 'usage', usageId);

  try {
    const docSnap = await getDoc(usageRef);
    const currentCount = docSnap.exists() ? docSnap.data().count : 0;

    if (currentCount >= DAILY_LIMIT) {
      return { allowed: false, remaining: 0 };
    }

    await setDoc(usageRef, {
      count: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    return { allowed: true, remaining: DAILY_LIMIT - (currentCount + 1) };
  } catch (error) {
    console.error("Usage tracking error:", error);
    // If tracking fails, we default to allowed to not block user, but ideally we'd handle this better
    return { allowed: true, remaining: 1 };
  }
}
