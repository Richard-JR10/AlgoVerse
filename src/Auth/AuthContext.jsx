import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged} from 'firebase/auth';
import {
    loginWithEmail,
    loginWithGoogle,
    signupWithEmail,
    logout,
    sendResetPassword,
    resetPassword
} from './AuthService.js';
import app from '../config/firebase-config.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const auth = getAuth(app);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
            if (loading) {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [auth,loading]);

    const handleLogout = async () => {
        try {
            await logout(); // From authService
        } catch (e) {
            setError(e.message);
            throw e;
        }
    };

    const emailLogin = async (email,password) => {
        setError(null);
        setLoading(true);
        try {
            await loginWithEmail(email,password);
        } catch (e) {
            setError(e.message);
            setTimeout(() => setError(null), 4000);
            throw e;
        } finally {
            setLoading(false);
        }
    }

    const googleLogin = async () => {
        setError(null);
        setLoading(true);
        try {
            await loginWithGoogle();
        } catch (e) {
            setError(e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    const handleSignupWithEmail = async (email, password, displayName) => {
        setError(null);
        setLoading(true);
        try {
            await signupWithEmail(email, password, displayName);
        } catch (e) {
            setError(e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    const handleSendResetPassword = async (email) => {
        try {
            await sendResetPassword(email);
        } catch (e) {
            setError(e.message);
            throw e;
        }
    };

    const handleResetPassword = async (oobCode, newPassword) => {
        try {
            await resetPassword(oobCode, newPassword);
        } catch (e) {
            setError(e.message);
            throw e;
        }
    }

    return (
        <AuthContext.Provider value={{ auth, user, loading, error, logout: handleLogout, loginWithGoogle: googleLogin, loginWithEmail: emailLogin, signupWithEmail: handleSignupWithEmail, sendResetPassword: handleSendResetPassword , resetPassword: handleResetPassword } }>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};