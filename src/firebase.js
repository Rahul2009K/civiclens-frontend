import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { getFirestore, doc, setDoc, deleteDoc, getDoc, collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBv6MOTHCsO2gEHSlZ-wW3QLVBqdeTKdYs",
  authDomain: "civiclens-7e46e.firebaseapp.com",
  projectId: "civiclens-7e46e",
  storageBucket: "civiclens-7e46e.firebasestorage.app",
  messagingSenderId: "810697129236",
  appId: "1:810697129236:web:08965aeaf59b24b6e89601"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export function signOutUser() {
  return signOut(auth)
}

export async function saveBill(userId, bill) {
  const ref = doc(db, 'users', userId, 'savedBills', bill.id)
  await setDoc(ref, bill)
}

export async function unsaveBill(userId, billId) {
  const ref = doc(db, 'users', userId, 'savedBills', billId)
  await deleteDoc(ref)
}

export async function getSavedBills(userId) {
  const ref = collection(db, 'users', userId, 'savedBills')
  const snapshot = await getDocs(ref)
  return snapshot.docs.map(d => d.data())
}

export async function isBillSaved(userId, billId) {
  const ref = doc(db, 'users', userId, 'savedBills', billId)
  const snapshot = await getDoc(ref)
  return snapshot.exists()
}

// Votes live only in billVotes/{billId}/userVotes/{userId}: one doc per
// account per bill. Totals are counted from those docs, so nobody can
// inflate them, and the Firestore rules only let you write your own doc.
export async function getBillVotes(billId) {
  const votesRef = collection(db, 'billVotes', billId, 'userVotes')
  const [likes, dislikes] = await Promise.all([
    getCountFromServer(query(votesRef, where('vote', '==', 'like'))),
    getCountFromServer(query(votesRef, where('vote', '==', 'dislike'))),
  ])
  return { likes: likes.data().count, dislikes: dislikes.data().count }
}

export async function getUserVote(userId, billId) {
  const ref = doc(db, 'billVotes', billId, 'userVotes', userId)
  const snapshot = await getDoc(ref)
  return snapshot.exists() ? snapshot.data().vote ?? null : null
}

// Clicking the same vote again removes it; clicking the other one switches it.
export async function castVote(userId, billId, voteType) {
  const voteRef = doc(db, 'billVotes', billId, 'userVotes', userId)
  const existing = await getDoc(voteRef)
  const previousVote = existing.exists() ? existing.data().vote : null

  let userVote
  if (previousVote === voteType) {
    await deleteDoc(voteRef)
    userVote = null
  } else {
    await setDoc(voteRef, { vote: voteType })
    userVote = voteType
  }

  const counts = await getBillVotes(billId)
  return { ...counts, userVote }
}
