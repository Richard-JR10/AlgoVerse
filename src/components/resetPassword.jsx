import React, {useContext, useEffect, useState} from 'react'
import {useLocation, useNavigate} from 'react-router-dom';
import {useAuth} from "../Auth/AuthContext.jsx";
import PasswordRequirements from "./utils/passwordRequirements.jsx";
import {ErrorContext} from "../context/errorContext.jsx";
import PasswordToggleIcon from "./utils/passwordToggleIcon.jsx";

function useQuery() {
    const location = useLocation();
    return new URLSearchParams(location.search);
}

const ResetNewPassword = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const {resetPassword} = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState({});
    const { setError } = useContext(ErrorContext);
    const navigate = useNavigate();

    const query = useQuery();
    const oobCode = query.get('oobCode');


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

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative">
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
                            <PasswordToggleIcon showPassword={showPassword} onToggle={togglePasswordVisibility} />
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
                            <PasswordToggleIcon showPassword={showConfirmPassword} onToggle={toggleConfirmPasswordVisibility} />
                        </div>
                        <PasswordRequirements passwordError={passwordError} />
                        <div className="card-actions">
                            <button type="submit" className={`btn btn-primary mt-5 w-full rounded-lg shadow-none`}>
                                Reset Password
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    )
}
export default ResetNewPassword
