import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { MarketItem } from '../types';

const ITEMS_COLLECTION = 'items';

export function subscribeToMarketItems(
  onUpdate: (items: MarketItem[]) => void,
  onError?: (err: any) => void
) {
  try {
    const q = query(collection(db, ITEMS_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: MarketItem[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<MarketItem, 'id'>),
          });
        });
        onUpdate(fetched);
      },
      (error) => {
        console.warn('Firestore snapshot warning:', error);
        if (onError) onError(error);
        try {
          handleFirestoreError(error, OperationType.LIST, ITEMS_COLLECTION);
        } catch (e) {
          // Logged
        }
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('Failed to attach snapshot listener:', error);
    return () => {};
  }
}

export async function addMarketItemToFirestore(item: MarketItem): Promise<void> {
  const path = `${ITEMS_COLLECTION}/${item.id}`;
  try {
    const { id, ...data } = item;
    await setDoc(doc(db, ITEMS_COLLECTION, item.id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateMarketItemInFirestore(
  itemId: string,
  data: Partial<MarketItem>
): Promise<void> {
  const path = `${ITEMS_COLLECTION}/${itemId}`;
  try {
    await updateDoc(doc(db, ITEMS_COLLECTION, itemId), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteMarketItemFromFirestore(itemId: string): Promise<void> {
  const path = `${ITEMS_COLLECTION}/${itemId}`;
  try {
    await deleteDoc(doc(db, ITEMS_COLLECTION, itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
