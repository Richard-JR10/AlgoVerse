// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCmfFI0ham_JOOjj3hEMr-p8a046CxiNCc",
    authDomain: "algoverse-auth.firebaseapp.com",
    projectId: "algoverse-auth",
    storageBucket: "algoverse-auth.firebasestorage.app",
    messagingSenderId: "853637004998",
    appId: "1:853637004998:web:7a36237394b1f4f43761c7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;

