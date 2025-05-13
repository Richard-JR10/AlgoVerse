import { useCallback, useEffect, useState } from 'react';
import { useAuth } from "../Auth/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";
import isEmail from "validator/lib/isEmail.js";
import PasswordToggleIcon from "./utils/passwordToggleIcon.jsx";
import PasswordRequirements from "./utils/passwordRequirements.jsx";

const SignupForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [signupError, setSignupError] = useState(null);
    const [success, setSuccess] = useState(null); // New state for success message
    const [isLoading, setIsLoading] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false); // Track signup process
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [passwordError, setPasswordError] = useState({});

    const { signupWithEmail, loginWithGoogle, loading, error: authError, user} = useAuth();
    const navigate = useNavigate();

    const isValidEmail = (email) => isEmail(email);
    const isValidName = (name) => {
        const lettersOnly = /^[A-Za-z]+$/; // Regex: letters only
        return name.trim().length > 0 && lettersOnly.test(name.trim());
    };

    const filterLettersOnly = (value) => value.replace(/[^A-Za-z]/g, '');

    // Redirect logged-in users to home page, but not during login process
    useEffect(() => {
        if (user && !loading && !isSigningUp) {
            navigate('/', { replace: true }); // Redirect to home page
        }
    }, [user, loading, isSigningUp, navigate]);

    useEffect(() => {
        if (authError && !signupError) setSignupError(authError);
    }, [authError]);

    useEffect(() => {
        if (signupError) {
            const timer = setTimeout(() => setSignupError(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [signupError]);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess(null);
                setIsSigningUp(false); // End signup process
                navigate('/visualizer', { replace: true }); // Navigate to visualizer
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [success, navigate]);

    const isValidPassword = (password, confirmPassword) => {
        return password === confirmPassword;
    };

    const getPasswordErrors = (password) => {
        return {
            minLength: password.length >= 8,
            hasNumber: /[0-9]/.test(password),
            hasSpecialChar: /[!@#$%^&*._-]/.test(password),
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
        };
    };

    useEffect(() => {
        setPasswordError(getPasswordErrors(password));
    }, [password]);

    const handleSignupWithEmail = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setSignupError(null);
        setIsSigningUp(true); // Start signup process
        try {
            if (!isValidEmail(email)) {
                setSignupError("Invalid email address.");
                setIsSigningUp(false);
                return;
            }
            if (!isValidPassword(password, confirmPassword)) {
                setSignupError("Passwords must match.");
                setIsSigningUp(false);
                return;
            }
            if (!isValidName(firstName)) {
                setSignupError("First name must contain letters only.");
                setIsSigningUp(false);
                return;
            }
            if (!isValidName(lastName)) {
                setSignupError("Last name must contain letters only.");
                setIsSigningUp(false);
                return;
            }
            if (Object.values(passwordError).some(error => error === false)) {
                setSignupError("Password does not meet requirements!");
                setIsSigningUp(false);
                return;
            }
            const displayName = `${firstName} ${lastName}`;
            await signupWithEmail(email, password, displayName);
            setSuccess("User has successfully signed up!"); // Show success message
            // Navigation handled by success useEffect
        } catch (e) {
            setIsSigningUp(false); // End signup process on error
            setSignupError(e.code === 'auth/email-already-in-use' ? "This email is already registered." : `Signup Error: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [signupWithEmail, email, password, confirmPassword, firstName, lastName, passwordError]);

    const handleGoogleAuth = useCallback(async () => {
        setSignupError(null);
        setIsSigningUp(true); // Start signup process
        try {
            await loginWithGoogle();
            setSuccess("User has successfully signed up!"); // Show success message
            // Navigation handled by success useEffect
        } catch (e) {
            setIsSigningUp(false); // End signup process on error
            if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
                setSignupError("Authentication canceled: Login window was closed");
            } else {
                setSignupError(`Google Signup Error: ${e.message}`);
            }
        }
    }, [loginWithGoogle]);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative">
            <div className="card bg-base-300 w-96 shadow-sm m-5 rounded-xl">
                <div className="card-body">
                    <h1 className="flex justify-center card-title text-3xl mb-5 text-base-content">Sign Up</h1>

                    <form onSubmit={handleSignupWithEmail}>
                        <div className="flex flex-row gap-2">
                            <div className="flex flex-col">
                                <label className="label">
                                    <span className="label-text text-base-content font-medium">First Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ian"
                                    className="input border-none shadow-none input-primary w-full rounded-lg"
                                    value={firstName}
                                    onChange={(e) => setFirstName(filterLettersOnly(e.target.value).charAt(0).toUpperCase() + filterLettersOnly(e.target.value).slice(1))}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="label">
                                    <span className="label-text text-base-content font-medium">Last Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Aquino"
                                    className="input border-none shadow-none input-primary w-full rounded-lg"
                                    value={lastName}
                                    onChange={(e) => setLastName(filterLettersOnly(e.target.value).charAt(0).toUpperCase() + filterLettersOnly(e.target.value).slice(1))}
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        <label className="label mt-5">
                            <span className="label-text text-base-content font-medium">Email</span>
                        </label>
                        <input
                            type="email"
                            placeholder="Email"
                            className="input border-none shadow-none input-primary w-full rounded-lg"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                        />

                        <label className="label mt-5">
                            <span className="label-text text-base-content font-medium">Password</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                className="input border-none shadow-none input-primary w-full pr-10 rounded-lg"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                            <PasswordToggleIcon showPassword={showPassword} onToggle={togglePasswordVisibility} />
                        </div>
                        <label className="label mt-5">
                            <span className="label-text text-base-content font-medium">Confirm Password</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                className="input border-none shadow-none input-primary w-full pr-10 rounded-lg"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                            <PasswordToggleIcon showPassword={showConfirmPassword} onToggle={toggleConfirmPasswordVisibility} />
                        </div>
                        <PasswordRequirements passwordError={passwordError} />
                        <div className="card-actions">
                            <button
                                type="submit"
                                className={`btn btn-primary mt-7 w-full rounded-lg`}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Signing up...' : 'Sign up'}
                            </button>
                        </div>
                    </form>

                    <div className="divider px-2 text-accent">Or continue with</div>

                    <button
                        className="btn bg-primary-content text-black w-full rounded-lg"
                        onClick={handleGoogleAuth}
                        disabled={loading}
                    >
                        {loading ? (
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
                        Already have an account?{" "}
                        <Link to="/login" className="underline underline-offset-4">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
            {success && (
                <div className="fixed left-0 right-0 bottom-5 flex justify-center z-30">
                    <div className="alert alert-success rounded-md flex flex-row items-center justify-between max-w-md">
                        <span>{success}</span>
                        <button onClick={() => setSuccess(null)} className="btn btn-sm btn-ghost">×</button>
                    </div>
                </div>
            )}
            {signupError && (
                <div className="fixed left-0 right-0 bottom-5 flex justify-center z-30">
                    <div className="alert alert-error rounded-md flex flex-row items-center justify-between max-w-md">
                        <span>{signupError}</span>
                        <button onClick={() => setSignupError(null)} className="btn btn-sm btn-ghost">×</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignupForm;