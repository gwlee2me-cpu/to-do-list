import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDQYiK8mrM49sD-p8G9pOeYF0VK8cM1eqs",
  authDomain: "to-do-list-858b8.firebaseapp.com",
  projectId: "to-do-list-858b8",
  storageBucket: "to-do-list-858b8.firebasestorage.app",
  messagingSenderId: "1015915498847",
  appId: "1:1015915498847:web:707dc4cecd264625e07aea"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
