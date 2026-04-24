import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface OrderItem {
  bookId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  sellerId?: string;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
}

export interface OrderRecord {
  id: string;
  orderId: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  deliveryMethod: string;
  shippingAddress: ShippingAddress;
  status: 'confirmed' | 'completed' | 'cancelled';
  createdAt?: any;
  updatedAt?: any;
}

interface CreateOrderInput {
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  deliveryMethod: string;
  shippingAddress: ShippingAddress;
}

function buildOrderNumber(orderDocId: string) {
  return `BX-${Date.now().toString().slice(-8)}-${orderDocId.slice(0, 5).toUpperCase()}`;
}

export async function createOrder(input: CreateOrderInput): Promise<{ id: string; orderId: string }> {
  const orderRef = doc(collection(db, 'orders'));
  const orderId = buildOrderNumber(orderRef.id);
  const batch = writeBatch(db);

  batch.set(orderRef, {
    orderId,
    userId: input.userId,
    items: input.items,
    subtotal: input.subtotal,
    deliveryFee: input.deliveryFee,
    total: input.total,
    paymentMethod: input.paymentMethod,
    deliveryMethod: input.deliveryMethod,
    shippingAddress: input.shippingAddress,
    status: 'confirmed',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  for (const item of input.items) {
    const bookRef = doc(db, 'books', item.bookId);
    batch.update(bookRef, {
      status: 'sold',
      orderId,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return { id: orderRef.id, orderId };
}

export async function fetchOrderById(id: string): Promise<OrderRecord | null> {
  const orderRef = doc(db, 'orders', id);
  const snapshot = await getDoc(orderRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<OrderRecord, 'id'>),
  };
}

export async function fetchUserOrders(userId: string): Promise<OrderRecord[]> {
  const ordersQuery = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    limit(20)
  );

  const snapshot = await getDocs(ordersQuery);
  return snapshot.docs
    .map((orderDoc) => ({
      id: orderDoc.id,
      ...(orderDoc.data() as Omit<OrderRecord, 'id'>),
    }))
    .sort((a, b) => {
      const aTime = typeof a.createdAt?.toDate === 'function' ? a.createdAt.toDate().getTime() : 0;
      const bTime = typeof b.createdAt?.toDate === 'function' ? b.createdAt.toDate().getTime() : 0;
      return bTime - aTime;
    });
}

export async function markOrderCompleted(orderDocId: string) {
  await updateDoc(doc(db, 'orders', orderDocId), {
    status: 'completed',
    updatedAt: serverTimestamp(),
  });
}
