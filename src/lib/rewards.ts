import { doc, updateDoc, increment, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const REWARD_POINTS = {
  SELL: 10,
  BUY: 10,
  DONATE: 20,
  THRESHOLD: 2000,
  DISCOUNT: 0.2 // 20%
};

export async function addRewardPoints(userId: string, points: number, type?: 'purchased' | 'sold' | 'donated') {
  if (!userId) return;

  const userRef = doc(db, 'users', userId);
  
  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const data = userSnap.data();
    const currentPoints = data.rewardPoints || 0;
    const newPoints = currentPoints + points;

    const updates: any = {};

    if (type === 'purchased') updates.purchasedCount = increment(1);
    if (type === 'sold') updates.soldCount = increment(1);
    if (type === 'donated') updates.donatedCount = increment(1);

    if (newPoints >= REWARD_POINTS.THRESHOLD) {
      // Reset points and add a coupon/gift
      const remainingPoints = newPoints - REWARD_POINTS.THRESHOLD;
      updates.rewardPoints = remainingPoints;
      updates.coupons = arrayUnion({
        id: `COUPON_${Date.now()}`,
        discount: REWARD_POINTS.DISCOUNT,
        code: `GIFT20_${Math.random().toString(36).substring(7).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        used: false
      });
      await updateDoc(userRef, updates);
    } else {
      updates.rewardPoints = increment(points);
      await updateDoc(userRef, updates);
    }
  } catch (error) {
    console.error("Error updating reward points:", error);
  }
}
