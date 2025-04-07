import {useContext, useState} from 'react';
import { Link } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext.jsx";
import isEmail from "validator/lib/isEmail";
import {ErrorContext} from "../context/errorContext.jsx";

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const { setError } = useContext(ErrorContext);
    const [success, setSuccess] = useState(false);
    const { sendResetPassword } = useAuth();

    const isValidEmail = (email) => isEmail(email);


    const handleSendResetPassword = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            if (!isValidEmail(email)) {
                setError("Invalid email address.");
                return;
            }
            await sendResetPassword(email);
            setSuccess(true);
        } catch (e) {
            setError(e.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen relative">
            <div className="card w-120 bg-base-300 rounded-xl">
                <div className="card-body">
                    <h1 className="flex justify-center card-title text-3xl mb-5 text-base-content">Forgot Your Password?</h1>
                    {success ? (
                        <div role="alert" className="alert alert-success">
                            <span>A password reset link has been sent to your email, if an account exists. Check your inbox or spam folder!</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSendResetPassword}>
                            <label className="label">
                                <span className="label-text text-base-content font-semibold">Email</span>
                            </label>
                            <input
                                type="email"
                                placeholder="Enter your Email"
                                className="input input-primary w-full pl-5 border-none shadow-none font-semibold focus:ring-0 focus:outline-none rounded-md"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <div className="card-actions">
                                <button
                                    type="submit"
                                    className="btn btn-primary mt-5 w-full rounded-md"
                                >
                                    Reset Password
                                </button>
                            </div>
                        </form>
                    )}
                    <div className="mt-6 text-center text-sm text-accent">
                        <Link to="/login" className="underline underline-offset-2">
                            Back to Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;