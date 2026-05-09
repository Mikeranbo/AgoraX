import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  getDoc,
  serverTimestamp,
  increment,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Event, Venue, Comment } from '../types';

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

function handleFirestoreError(error: any, operationType: string, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Events ---

export const subscribeToEvents = (callback: (events: Event[]) => void) => {
  const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Event[];
    callback(events);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'events');
  });
};

export const createEvent = async (event: Omit<Event, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'events'), {
      ...event,
      createdAt: serverTimestamp(),
      participantsCount: 0,
      impressions: 0,
      clicks: 0
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'events');
  }
};

export const joinEvent = async (eventId: string, userId: string) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    const participantRef = doc(db, 'events', eventId, 'participants', userId);
    
    // Using setDoc for the subcollection join
    await setDoc(participantRef, { joinedAt: serverTimestamp() });
    
    // Increment count on main doc
    await updateDoc(eventRef, {
      participantsCount: increment(1)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `events/${eventId}/participants/${userId}`);
  }
};

export const trackImpression = async (eventId: string) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      impressions: increment(1)
    });
  } catch (error) {
    // Fail silently for analytics
    console.error('Impression tracking failed', error);
  }
};

export const trackClick = async (eventId: string) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      clicks: increment(1)
    });
  } catch (error) {
    console.error('Click tracking failed', error);
  }
};

// --- Venues ---

export const subscribeToVenues = (callback: (venues: Venue[]) => void) => {
  return onSnapshot(collection(db, 'venues'), (snapshot) => {
    const venues = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Venue[];
    callback(venues);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'venues');
  });
};

export const createVenue = async (venue: Omit<Venue, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'venues'), venue);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'venues');
  }
};

// --- Comments ---

export const subscribeToComments = (eventId: string, callback: (comments: Comment[]) => void) => {
  const q = query(collection(db, 'events', eventId, 'comments'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Comment[];
    callback(comments);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `events/${eventId}/comments`);
  });
};

export const addComment = async (eventId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
  try {
    await addDoc(collection(db, 'events', eventId, 'comments'), {
      ...comment,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `events/${eventId}/comments`);
  }
};

// --- User Profiles ---

export const syncUserProfile = async (userId: string, profile: { name: string, role: string }) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
};
