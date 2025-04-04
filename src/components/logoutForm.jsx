import React from 'react'
import {useAuth} from "../Auth/AuthContext.jsx";
import {signOut} from "firebase/auth";

const LogoutForm = () => {
    const { user, auth } = useAuth();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (e) {
            console.error("Error signing out: ",e);
        }

    };

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="flex flex-col">
                <h1 className="mb-5"> Welcome, {user.displayName}</h1>
                <button className="btn btn-secondary" onClick={handleSignOut}>
                    Logout
                </button>
            </div>
        </div>
    )
}
export default LogoutForm
