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
            throw e;
        }
    };

    const emailLogin = async (email,password) => {
        setLoading(true);
        try {
            await loginWithEmail(email,password);
        } catch (e) {
            throw e;
        } finally {
            setLoading(false);
        }
    }

    const googleLogin = async () => {
        setLoading(true);
        try {
            await loginWithGoogle();
        } catch (e) {
            throw e;
        } finally {
            setLoading(false);
        }
    };

    const handleSignupWithEmail = async (email, password, displayName) => {
        setLoading(true);
        try {
            await signupWithEmail(email, password, displayName);
        } catch (e) {
            throw e;
        } finally {
            setLoading(false);
        }
    };

    const handleSendResetPassword = async (email) => {
        try {
            await sendResetPassword(email);
        } catch (e) {
            throw e;
        }
    };

    const handleResetPassword = async (oobCode, newPassword) => {
        try {
            await resetPassword(oobCode, newPassword);
        } catch (e) {
            throw e;
        }
    }

    return (
        <AuthContext.Provider value={{ auth, user, loading, logout: handleLogout, loginWithGoogle: googleLogin, loginWithEmail: emailLogin, signupWithEmail: handleSignupWithEmail, sendResetPassword: handleSendResetPassword , resetPassword: handleResetPassword } }>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};