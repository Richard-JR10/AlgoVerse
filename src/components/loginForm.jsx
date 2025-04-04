import React, {useCallback, useEffect, useState} from 'react';
import { useAuth } from "../Auth/AuthContext.jsx";
import {Link} from "react-router-dom";
import isEmail from 'validator/lib/isEmail';

const LoginForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(null);
    const { loginWithEmail, loginWithGoogle, loading, error: authError} = useAuth();

    // Email validation
    const isValidEmail = (email) => isEmail(email);

    useEffect(() => {
        if (authError && !loginError) setLoginError(authError);
    }, [authError]);

    useEffect(() => {
        if (loginError) {
            const timer = setTimeout(() => setLoginError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [loginError]);

    // Google Login
    const handleGoogleAuth = useCallback(async (e) => {
        e.preventDefault();
        setLoginError(null); // Clear previous error on new attempt
        try {
            await loginWithGoogle();
        } catch (e) {
            setLoginError(`Google Login Error: ${e.message}`);
        }
    }, [loginWithGoogle]);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoginError(null); // Clear previous error on new attempt
        try {
            if (!isValidEmail(email)) {
                setLoginError("Invalid email address.");
                return;
            }
            await loginWithEmail(email, password);
        } catch (e) {
            setLoginError(`Email Login Error: ${e.message}`);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient relative">
            <div className="card bg-base-300 w-96 shadow-none m-5 rounded-xl">
                <div className="card-body">
                    <h1 className="flex justify-center card-title text-3xl mb-5 text-base-content">Sign in</h1>

                    <form onSubmit={handleEmailLogin}>
                        <label className="label">
                            <span className="label-text text-base-content font-medium">Email</span>
                        </label>
                        <input
                            type="email"
                            placeholder="Email"
                            className="input input-primary w-full border-none shadow-none font-semibold rounded-lg pl-4"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                        />

                        <label className="label mt-4">
                            <span className="label-text text-base-content font-medium">Password</span>
                        </label>
                        <div className="relative mb-4">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                className="input input-primary w-full pr-10 pl-4 border-none shadow-none font-semibold rounded-lg"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute inset-y-0 right-0 px-3 flex items-center"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                disabled={loading}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="text-accent size-4">
                                        <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
                                        <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd"/>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="text-accent size-4">
                                        <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clipRule="evenodd"/>
                                        <path d="m10.748 13.93 2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z"/>
                                    </svg>
                                )}
                            </button>
                        </div>


                        <div className="flex justify-end mt-2">
                            <Link
                                to="/forgot-password"
                                className="!text-right text-xs font-semibold leading-[24px] text-gray-500"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        <div className="card-actions">
                            <button type="submit" className={`btn btn-primary mt-4 w-full rounded-md ${loading ? 'loading' : ''}`}>
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </div>
                    </form>

                    <div className="divider px-2 text-accent">Or continue with</div>

                    <button
                        className="btn bg-primary-content text-black border-[#e5e5e5] w-full rounded-md"
                        onClick={handleGoogleAuth}
                        disabled={loading}
                    >
                        <svg className="size-4 bg-primary-content" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
                        </svg>
                        Continue with Google
                    </button>

                    <div className="mt-4 text-center text-sm text-accent">
                        Don&apos;t have an account?{" "}
                        <Link to="/signup" className="underline underline-offset-4">
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
            {loginError && (
                <div className="absolute bottom-5 px-5 rounded-md">
                    <div className="alert alert-error rounded-md flex flex-row items-center justify-between">
                        <span>{loginError}</span>
                        <button onClick={() => setLoginError(null)} className="btn btn-sm btn-ghost">×</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginForm;