import React, {useCallback, useContext, useState} from 'react';
import { useAuth } from "../Auth/AuthContext.jsx";
import {Link} from "react-router-dom";
import isEmail from 'validator/lib/isEmail';
import PasswordToggleIcon from "./utils/passwordToggleIcon.jsx";
import {ErrorContext} from "../context/errorContext.jsx";

const LoginForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { setError } = useContext(ErrorContext);
    const { loginWithEmail, loginWithGoogle, loading} = useAuth();

    // Email validation
    const isValidEmail = (email) => isEmail(email);

    // Google Login
    const handleGoogleAuth = useCallback(async (e) => {
        e.preventDefault();
        try {
            await loginWithGoogle();
        } catch (e) {
            setError(`Google Login Error: ${e.message}`);
        }
    }, [loginWithGoogle]);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        try {
            if (!isValidEmail(email)) {
                setError("Invalid email address.");
                return;
            }
            await loginWithEmail(email, password);
        } catch (e) {
            setError(`Email Login Error: ${e.message}`);
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
        </div>
    );
};

export default LoginForm;