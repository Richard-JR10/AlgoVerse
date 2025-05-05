import {ErrorContext} from "../context/errorContext.jsx";
import {useContext} from "react";

const ErrorPopup = () => {
    const { error, setError } = useContext(ErrorContext);

    if (!error) return null;

    // Safely extract error message
    let errorMessage = 'An unknown error occurred';

    if (typeof error === 'string') {
        errorMessage = error;
    } else if (error && typeof error === 'object') {
        // Handle both Error objects and Firebase error objects
        errorMessage = error.message || error.code || 'An unknown error occurred';
    }

    return (
        <div className="fixed top-35 left-1/2 transform -translate-x-1/2 z-50 items-center justify-center animate-fade-in-out">
            <div className="alert alert-error rounded-md flex flex-row items-center justify-between shadow-lg">
                <span>{errorMessage}</span>
                <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">
                    ×
                </button>
            </div>
        </div>
    )
}

export default ErrorPopup
