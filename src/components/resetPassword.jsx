import React, {useEffect, useState} from 'react'
import {useLocation, useNavigate} from 'react-router-dom';
import {useAuth} from "../Auth/AuthContext.jsx";

function useQuery() {
    const location = useLocation();
    return new URLSearchParams(location.search);
}

const ResetNewPassword = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const {resetPassword, error: authError} = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState({});
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const query = useQuery();
    const oobCode = query.get('oobCode');

    useEffect(() => {
        if (authError && !error) setError(authError);
    }, [authError]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const getPasswordErrors = (password) => {
        return {
            minLength: password.length >= 8,
            hasNumber: /[0-9]/.test(password),
            hasSpecialChar: /[!@#$%^&*._-]/.test(password),
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
        };
    }

    useEffect(() => {
        setPasswordError(getPasswordErrors(newPassword));
    }, [newPassword]);


    const isValidPassword = (newPassword, confirmPassword) => {
        return newPassword.length >= 8 && newPassword === confirmPassword;
    }

    const handleResetNewPassword = async (e) => {
        e.preventDefault();
        try {
            if (!isValidPassword(newPassword, confirmPassword)) {
                setError("Passwords must match and be at least 8 characters.");
                return;
            }
            if (Object.values(passwordError).some(error => error === false)) {
                setError("Password does not meet requirements!");
                return;
            }
            await resetPassword(oobCode, newPassword);
            navigate('/login');
        } catch (e) {
            setError(e.message);
        }
    }

    const handleCondition = (param) => {
        if (param) {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" height="20" width="17.5" viewBox="0 0 448 512"><path fill="#ffffff" d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
            );
        } else {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" height="20" width="15"  viewBox="0 0 384 512">
                    <path fill="#ffffff" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/>
                </svg>
            );
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient relative">
            <div className="card bg-base-300 w-120 shadow-none m-5 rounded-xl">
                <div className="card-body gap-0 px-8 py-9.5">
                    <h1 className="flex justify-center card-title text-3xl mb-5 text-base-content">Reset Password</h1>
                    <form onSubmit={handleResetNewPassword}>
                        <label className="label">
                            <span className="label-text text-base-content font-medium">New Password</span>
                        </label>
                        <div className="relative mb-4">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                className="input input-primary w-full pr-10 pl-4 border-none shadow-none font-semibold rounded-lg"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute inset-y-0 right-0 px-3 flex items-center"
                                aria-label={showPassword ? "Hide password" : "Show password"}
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
                        <label className="label">
                            <span className="label-text text-base-content font-medium">Confirm New Password</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Password"
                                className="input input-primary w-full pr-10 pl-4 border-none shadow-none font-semibold rounded-lg"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={toggleConfirmPasswordVisibility}
                                className="absolute inset-y-0 right-0 px-3 flex items-center"
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                                {showConfirmPassword ? (
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
                        <div className="mt-5">
                            <div className="flex flex-row text-xs items-center gap-2">{handleCondition(passwordError.minLength)} Minimum 8 characters</div>
                            <div className="flex flex-row text-xs items-center gap-2">{handleCondition(passwordError.hasNumber)} Contains at least 1 number (0-9)</div>
                            <div className="flex flex-row text-xs items-center gap-2">{handleCondition(passwordError.hasSpecialChar)} Contains at least 1 special character (!@#$%^&*_-)</div>
                            <div className="flex flex-row text-xs items-center gap-2">{handleCondition(passwordError.hasUppercase)} Contains at least 1 uppercase letter (A-Z)</div>
                            <div className="flex flex-row text-xs items-center gap-2">{handleCondition(passwordError.hasLowercase)} Contains at least 1 lowercase letter (a-z)</div>
                        </div>
                        <div className="card-actions">
                            <button type="submit" className={`btn btn-primary mt-5 w-full rounded-lg shadow-none`}>
                                Reset Password
                            </button>
                        </div>
                    </form>

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
    )
}
export default ResetNewPassword
