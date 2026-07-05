import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { getFirestore, doc, setDoc, deleteDoc, getDoc, collection, getDocs } from 'firebase/firestore'

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

export async function getBillVotes(billId) {
  const ref = doc(db, 'billVotes', billId)
  const snapshot = await getDoc(ref)
  if (snapshot.exists()) {
    return snapshot.data()
  }
  return { likes: 0, dislikes: 0 }
}

export async function getUserVote(userId, billId) {
  const ref = doc(db, 'billVotes', billId, 'userVotes', userId)
  const snapshot = await getDoc(ref)
  return snapshot.exists() ? snapshot.data().vote : null
}

export async function castVote(userId, billId, voteType) {
  const voteRef = doc(db, 'billVotes', billId, 'userVotes', userId)
  const billRef = doc(db, 'billVotes', billId)

  const existingVote = await getDoc(voteRef)
  const previousVote = existingVote.exists() ? existingVote.data().vote : null

  const billSnapshot = await getDoc(billRef)
  const current = billSnapshot.exists() ? billSnapshot.data() : { likes: 0, dislikes: 0 }

  let { likes, dislikes } = current

  if (previousVote === voteType) {
    if (voteType === 'like') likes = Math.max(0, likes - 1)
    if (voteType === 'dislike') dislikes = Math.max(0, dislikes - 1)
    await setDoc(voteRef, { vote: null })
    await setDoc(billRef, { likes, dislikes })
    return { likes, dislikes, userVote: null }
  }

  if (previousVote === 'like') likes = Math.max(0, likes - 1)
  if (previousVote === 'dislike') dislikes = Math.max(0, dislikes - 1)

  if (voteType === 'like') likes += 1
  if (voteType === 'dislike') dislikes += 1

  await setDoc(voteRef, { vote: voteType })
  await setDoc(billRef, { likes, dislikes })

  return { likes, dislikes, userVote: voteType }
}