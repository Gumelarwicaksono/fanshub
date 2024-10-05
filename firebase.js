// Import the functions you need from the SDKs you need
const { initializeApp } = require('firebase/app');
const { getStorage, ref: dbsRef, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const { getDatabase, ref, set, push, get, update, remove, onValue } = require('firebase/database');

const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyBnIeWU4ARmLnxVzxRXseyCihDwzJmiA44',
  authDomain: 'bioproduct-fa5a4.firebaseapp.com',
  databaseURL: 'https://bioproduct-fa5a4-default-rtdb.firebaseio.com',
  projectId: 'bioproduct-fa5a4',
  storageBucket: 'bioproduct-fa5a4.appspot.com',
  messagingSenderId: '349999915954',
  appId: '1:349999915954:web:8cac66788e128a09667aab',
  measurementId: 'G-5D2JDZGW5W',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Fungsi authorize
function authorize(req, res, next) {
  const token = req.cookies.token;
  if (!token || token === null) {
    return res.redirect('/signinpage');
  }
  // Verifikasi token
  auth.currentUser
    .getIdToken()
    .then((token) => {
      // Periksa peran pengguna
      const userRef = ref(db, 'users/' + auth.currentUser.uid);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData && userData.role === 'admin') {
          // Pengguna adalah admin, izinkan akses
          next();
        } else {
          // Pengguna bukan admin, tolak akses
          res.status(401).send('Anda tidak memiliki akses onval');
        }
      });
    })
    .catch((error) => {
      console.log('dari errror auth', error);
      res.status(401).send('Anda tidak memiliki akses aut');
    });
}

module.exports = { db, ref, set, push, get, update, remove, storage, dbsRef, uploadBytes, getDownloadURL, deleteObject, authorize, signInWithEmailAndPassword, createUserWithEmailAndPassword, auth };
