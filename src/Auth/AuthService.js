import {
    getAuth,
    deleteUser,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    confirmPasswordReset
} from "firebase/auth";
import app from "../config/firebase-config.js"

const auth = getAuth(app);

// Logs in with email and password, returns user object or throws error
const loginWithEmail = async (email,password) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (e) {
        throw e;
    }
};

const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (e) {
        throw e;
    }
};

const signupWithEmail = async (email, password, displayName) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        return userCredential.user; // Returns the signed-in user
    } catch (e) {
        throw e;
    }
}

const sendResetPassword = async (email) => {
    const actionCodeSettings = {
        url: 'http://localhost:5173/reset-password', // Your custom reset URL
        handleCodeInApp: true, // Ensures the code is usable in your app
    };
    try {
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
    } catch (e) {
        throw e;
    }
};

const deleteAccount = async (user) => {
    try {
        // Make sure user is defined and has necessary Firebase methods
        if (!user || typeof user.delete !== 'function') {
            throw new Error('Invalid user object. Cannot delete account.');
        }

        // Call the Firebase deleteUser method on the user object directly
        await user.delete();

        console.log('Account deleted successfully');
        return true;
    } catch (e) {
        console.error('Error deleting account:', e);
        throw e;
    }
}

const resetPassword = async (oobCode, newPassword) => {
    try {
        await confirmPasswordReset(auth, oobCode, newPassword);
    } catch (e) {
        throw e;
    }
}
// Logs out the user, returns true on success or throws error
const logout = async () => {
    try {
        await signOut(auth);
        return true;
    } catch (e) {
        throw e;
    }
}

export { loginWithEmail, loginWithGoogle, signupWithEmail, sendResetPassword, logout, resetPassword, deleteAccount };
