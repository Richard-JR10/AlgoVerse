import {ErrorContext} from "../context/errorContext.jsx";
import {useContext} from "react";

const ErrorPopup = () => {
    const { error, setError } = useContext(ErrorContext);

    if (!error) return null;

    return (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 items-center justify-center animate-fade-in-out">
            <div className="alert alert-error rounded-md flex flex-row items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">
                    <svg xmlns="http://www.w3.org/2000/svg" height="20" width="15" viewBox="0 0 384 512"><path fill="#ffffff" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
                </button>
            </div>
        </div>
    )
}

export default ErrorPopup
