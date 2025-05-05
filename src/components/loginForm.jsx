import {useCallback, useEffect, useState} from 'react';
import { useAuth } from "../Auth/AuthContext.jsx";
import {Link} from "react-router-dom";
import isEmail from 'validator/lib/isEmail';
import PasswordToggleIcon from "./utils/passwordToggleIcon.jsx";

const LoginForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState(null);
    const { loginWithEmail, loginWithGoogle, loading } = useAuth();

    // Reset google loading state when main loading state changes
    useEffect(() => {
        if (!loading) {
            setGoogleLoading(false);
        }
    }, [loading]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Email validation
    const isValidEmail = (email) => isEmail(email);

    // Google Login with improved error handling
    const handleGoogleAuth = useCallback(async (e) => {
        e.preventDefault();

        // Set local loading state
        setGoogleLoading(true);

        try {
            await loginWithGoogle();
            // If successful, the AuthContext will handle the rest
        } catch (e) {
            // Provide more user-friendly error messages
            if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
                setError("Authentication canceled: Login window was closed");
            } else {
                setError(`Google Login Error: ${e.message}`);
            }

            // Reset local loading state immediately
            setGoogleLoading(false);
        }
    }, [loginWithGoogle, setError]);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        try {
            if (!isValidEmail(email)) {
                setError("Invalid email address.");
                return;
            }
            await loginWithEmail(email, password);
        } catch (e) {
            if (e.code === 'auth/invalid-credential') {
                setError('Invalid Credentials');
            } else {
                setError(`Email Login Error: ${e.message}`);
            }
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Determine which loading state to use for the Google button
    const isGoogleButtonLoading = googleLoading || loading;

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
                            <PasswordToggleIcon showPassword={showPassword} onToggle={togglePasswordVisibility} />
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
                            <button type="submit" className={`btn btn-primary mt-4 w-full rounded-md`} disabled={loading}>
                                {loading ?
                                    'Logging in...'
                                    :
                                    'Login'}
                            </button>
                        </div>
                    </form>

                    <div className="divider px-2 text-accent">Or continue with</div>

                    <button
                        className="btn bg-primary-content text-black w-full rounded-md"
                        onClick={handleGoogleAuth}
                        disabled={isGoogleButtonLoading}
                    >
                        {isGoogleButtonLoading ? (
                            <span className="loading loading-spinner loading-xl"></span>
                        ) : (
                            <>
                                <svg className="size-4 bg-primary-content" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
                                </svg>
                                Continue with Google
                            </>
                        )}
                    </button>

                    <div className="mt-4 text-center text-sm text-accent">
                        Don&apos;t have an account?{" "}
                        <Link to="/signup" className="underline underline-offset-4">
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
            {error && (
                <div className="absolute bottom-5 px-5 rounded-md">
                    <div className="alert alert-error rounded-md flex flex-row items-center justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">×</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginForm;