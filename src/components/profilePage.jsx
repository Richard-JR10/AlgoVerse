import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from "./navBar.jsx";
import ProfileImage from "./utils/ProfileImage.jsx";
import { useAuth } from "../Auth/AuthContext.jsx";
import { ErrorContext } from '../context/errorContext.jsx';
import { EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, getAuth, updatePassword, updateProfile } from 'firebase/auth';
import PasswordToggleIcon from "./utils/passwordToggleIcon.jsx";

const ProfilePage = () => {
    const { user, deleteUser } = useAuth();
    const { setError } = useContext(ErrorContext);
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState(() => {
        if (user.displayName) {
            const parts = user.displayName.trim().split(' ');
            return parts[0] || '';
        }
        return '';
    });
    const [lastName, setLastName] = useState(() => {
        if (user.displayName) {
            const parts = user.displayName.trim().split(' ');
            return parts.length > 1 ? parts.slice(1).join(' ') : '';
        }
        return '';
    });
    const [showDeletePassword, setShowDeletePassword] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [currentNewPassword, setCurrentNewPassword] = useState('');
    const [showCurrentNewPassword, setShowCurrentNewPassword] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLocalError('');
        setSuccessMessage('');
        setIsLoading(true);

        // Validate inputs
        if (!firstName.trim() || !lastName.trim()) {
            setLocalError('First name and last name are required.');
            setIsLoading(false);
            return;
        }

        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
            setLocalError('You must be logged in to update your profile.');
            setIsLoading(false);
            return;
        }

        const newDisplayName = `${firstName.trim()} ${lastName.trim()}`;

        try {
            await updateProfile(currentUser, { displayName: newDisplayName });
            setSuccessMessage('Profile updated successfully!');
        } catch (error) {
            console.error('Profile update error:', error);
            if (error.code === 'auth/requires-recent-login') {
                // Profile update requires recent login, so re-authenticate
                try {
                    const providerId = currentUser.providerData[0]?.providerId;
                    if (providerId === 'password') {
                        if (!currentPassword) {
                            setLocalError('Please enter your current password to verify your identity.');
                            setIsLoading(false);
                            return;
                        }
                        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
                        await reauthenticateWithCredential(currentUser, credential);
                    } else if (providerId === 'google.com') {
                        const provider = new GoogleAuthProvider();
                        await reauthenticateWithPopup(currentUser, provider);
                    }
                    await updateProfile(currentUser, { displayName: newDisplayName });
                    setSuccessMessage('Profile updated successfully!');
                    setCurrentPassword('');
                } catch (reauthError) {
                    console.error('Re-authentication error:', reauthError);
                    if (reauthError.code === 'auth/wrong-password') {
                        setLocalError('Incorrect current password. Please try again.');
                    } else if (reauthError.code === 'auth/popup-closed-by-user') {
                        setLocalError('Google authentication popup was closed. Please try again.');
                    } else {
                        setLocalError(reauthError.message || 'Failed to update profile.');
                        try {
                            setError(reauthError);
                        } catch (errorHandlingError) {
                            console.error('Error while setting error state:', errorHandlingError);
                        }
                    }
                }
            } else {
                setLocalError(error.message || 'Failed to update profile.');
                try {
                    setError(error);
                } catch (errorHandlingError) {
                    console.error('Error while setting error state:', errorHandlingError);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setLocalError('');
        setSuccessMessage('');
        setIsLoading(true);

        // Validate inputs
        if (newPassword !== currentNewPassword) {
            setLocalError('New password and confirmation do not match.');
            setIsLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setLocalError('Password must be at least 6 characters long.');
            setIsLoading(false);
            return;
        }

        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
            setLocalError('You must be logged in to update your password.');
            setIsLoading(false);
            return;
        }

        try {
            await updatePassword(currentUser, newPassword);
            setSuccessMessage('Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setCurrentNewPassword('');
        } catch (error) {
            console.error('Password update error:', error);
            if (error.code === 'auth/requires-recent-login') {
                try {
                    if (!currentPassword) {
                        setLocalError('Please enter your current password to verify your identity.');
                        setIsLoading(false);
                        return;
                    }
                    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
                    await reauthenticateWithCredential(currentUser, credential);
                    await updatePassword(currentUser, newPassword);
                    setSuccessMessage('Password updated successfully!');
                    setCurrentPassword('');
                    setNewPassword('');
                    setCurrentNewPassword('');
                } catch (reauthError) {
                    console.error('Re-authentication error:', reauthError);
                    if (reauthError.code === 'auth/invalid-credential') {
                        setLocalError('Incorrect current password. Please try again.');
                    } else {
                        setLocalError(reauthError.message || 'Failed to update password.');
                        try {
                            setError(reauthError);
                        } catch (errorHandlingError) {
                            console.error('Error while setting error state:', errorHandlingError);
                        }
                    }
                }
            } else if (error.code === 'auth/weak-password') {
                setLocalError('Password must be at least 6 characters long.');
            } else {
                setLocalError(error.message || 'Failed to update password.');
                try {
                    setError(error);
                } catch (errorHandlingError) {
                    console.error('Error while setting error state:', errorHandlingError);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsLoading(true);
        setLocalError('');

        try {
            const providerId = user.providerData[0]?.providerId;
            const auth = getAuth();
            const currentUser = auth.currentUser;

            if (!currentUser) {
                setLocalError('You must be logged in to delete your account');
                setIsLoading(false);
                return;
            }

            try {
                if (providerId === 'password') {
                    if (!deletePassword) {
                        setLocalError('Password is required to delete your account');
                        setIsLoading(false);
                        return;
                    }
                    const credential = EmailAuthProvider.credential(currentUser.email, deletePassword);
                    await reauthenticateWithCredential(currentUser, credential);
                } else if (providerId === 'google.com') {
                    const provider = new GoogleAuthProvider();
                    await reauthenticateWithPopup(currentUser, provider);
                }
            } catch (reauthError) {
                console.error('Reauthentication error:', reauthError);
                throw reauthError;
            }

            try {
                await currentUser.delete();
            } catch (directDeleteError) {
                console.error('Direct delete failed, trying via context:', directDeleteError);
                await deleteUser(currentUser);
            }

            setIsModalOpen(false);
            navigate('/');
        } catch (error) {
            console.error('Delete account error:', error);
            if (error.code === 'auth/invalid-credential') {
                setLocalError('Incorrect password. Please try again.');
            } else if (error.code === 'auth/too-many-requests') {
                setLocalError('Too many unsuccessful attempts. Please try again later.');
            } else if (error.code === 'auth/popup-closed-by-user') {
                setLocalError('Authentication popup was closed. Please try again.');
            } else if (error.code === 'auth/requires-recent-login') {
                setLocalError('For security reasons, please sign in again before deleting your account.');
            } else {
                setLocalError(error.message || 'Failed to delete account. Please try again.');
                try {
                    setError(error);
                } catch (errorHandlingError) {
                    console.error('Error while setting error state:', errorHandlingError);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCurrentPasswordVisibility = () => {
        setShowCurrentPassword(!showCurrentPassword);
    };

    const toggleNewPasswordVisibility = () => {
        setShowNewPassword(!showNewPassword);
    };

    const toggleCurrentNewPasswordVisibility = () => {
        setShowCurrentNewPassword(!showCurrentNewPassword);
    };

    const toggleDeletePasswordVisibility = () => {
        setShowDeletePassword(!showDeletePassword);
    };

    const isGoogleUser = user.providerData[0]?.providerId === 'google.com';

    return (
        <div className="scrollbar-hide overflow-auto h-screen bg-base-200">
            <NavBar menuItems={[]} />
            <div className="flex flex-col items-center justify-center">
                <div className="card w-full h-fit max-w-190 mb-2">
                    <div className="card-body bg-base-300 rounded-xl flex flex-row items-center gap-4">
                        <ProfileImage size="24" type="circle"/>
                        <div className="flex flex-col gap-3">
                            <button className="btn btn-outline btn-primary w-fit rounded-lg">Upload New</button>
                            <div className="text-sm">
                                {user.email}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card w-full max-w-190 mb-2">
                    <div className="card-body bg-base-300 p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-white">Personal Information</h3>
                        <form onSubmit={handleUpdateProfile}>
                            <div className="flex flex-col md:flex-row lg:flex-row items-center gap-2">
                                <fieldset className="fieldset w-full">
                                    <legend className="fieldset-legend">First Name</legend>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="input w-full p-3 rounded text-white"
                                        placeholder="First Name"
                                    />
                                </fieldset>
                                <fieldset className="fieldset w-full">
                                    <legend className="fieldset-legend">Last Name</legend>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="input w-full p-3 rounded text-white"
                                        placeholder="Last Name"
                                    />
                                </fieldset>
                            </div>

                            {/*<fieldset className="fieldset">*/}
                            {/*    <legend className="fieldset-legend">Email</legend>*/}
                            {/*    <input*/}
                            {/*        type="text"*/}
                            {/*        value={email}*/}
                            {/*        onChange={handleEmailChange}*/}
                            {/*        className="input w-full p-3 rounded text-white"*/}
                            {/*        placeholder="mail@example.com"*/}
                            {/*        disabled*/}
                            {/*    />*/}
                            {/*</fieldset>*/}
                            {localError && <p className="text-error mt-2">{localError}</p>}
                            {successMessage && <p className="text-success mt-2">{successMessage}</p>}
                            <button
                                type="submit"
                                className="btn btn-primary rounded-lg px-4 mt-4"
                                disabled={isLoading}
                                >
                                    {isLoading ? 'Updating...' : 'Update Profile'}
                            </button>
                        </form>
                    </div>
                </div>
                <div className="card w-full max-w-190 mb-2">
                    <div className="card-body bg-base-300 p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-white">Change Password</h3>
                        {isGoogleUser ? (
                            <div className="text-info">
                                <p>You are signed in with a Google account. To change your password, please visit your <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="link link-primary">Google Account settings</a>.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdatePassword}>
                                <fieldset className="fieldset">
                                    <legend className="fieldset-legend">Current Password</legend>
                                    <div className="relative mb-4">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="input w-full p-3 rounded text-white"
                                            placeholder="Enter current password"
                                        />
                                        <PasswordToggleIcon showPassword={showCurrentPassword} onToggle={toggleCurrentPasswordVisibility} />
                                    </div>
                                </fieldset>
                                <fieldset className="fieldset">
                                    <legend className="fieldset-legend">New Password</legend>
                                    <div className="relative mb-4">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="input w-full p-3 rounded text-white"
                                            placeholder="Enter new password"
                                        />
                                        <PasswordToggleIcon showPassword={showNewPassword} onToggle={toggleNewPasswordVisibility} />
                                    </div>
                                </fieldset>
                                <fieldset className="fieldset">
                                    <legend className="fieldset-legend">Confirm New Password</legend>
                                    <div className="relative">
                                        <input
                                            type={showCurrentNewPassword ? "text" : "password"}
                                            value={currentNewPassword}
                                            onChange={(e) => setCurrentNewPassword(e.target.value)}
                                            className="input w-full p-3 rounded text-white"
                                            placeholder="Confirm new password"
                                        />
                                        <PasswordToggleIcon showPassword={showCurrentNewPassword} onToggle={toggleCurrentNewPasswordVisibility} />
                                    </div>
                                </fieldset>
                                {localError && <p className="text-error mt-2">{localError}</p>}
                                {successMessage && <p className="text-success mt-2">{successMessage}</p>}
                                <button
                                    type="submit"
                                    className="btn btn-primary rounded-lg px-4 w-fit mt-4"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
                <div className="card w-full max-w-190">
                    <div className="card-body flex flex-row items-center justify-between bg-base-300 p-6 rounded-lg">
                        <div className="flex flex-col justify-center w-fit">
                            <h3 className="text-xl font-bold text-warning">Delete Account</h3>
                            <p>Once you delete your account, there is no going back. Please be certain.</p>
                        </div>
                        <button className="btn btn-error w-fit" onClick={() => setIsModalOpen(true)}>Delete Account</button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">Confirm Account Deletion</h3>
                        <p className="py-4">This action cannot be undone. Please confirm your identity to delete your account.</p>
                        {user.providerData[0]?.providerId === 'password' && (
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">Password</legend>
                                <div className="relative mb-4">
                                    <input
                                        type={showDeletePassword ? "text" : "password"}
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        className="input w-full p-3 rounded text-white"
                                        placeholder="Enter your password"
                                    />
                                    <PasswordToggleIcon showPassword={showDeletePassword} onToggle={toggleDeletePasswordVisibility} />
                                </div>
                            </fieldset>
                        )}
                        {user.providerData[0]?.providerId === 'google.com' && (
                            <p className="text-info mb-4">You'll be prompted to sign in with Google to verify your identity.</p>
                        )}
                        {localError && <p className="text-error mt-2">{localError}</p>}
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setDeletePassword('');
                                    setLocalError('');
                                }}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-error"
                                onClick={handleDeleteAccount}
                                disabled={isLoading || (user.providerData[0]?.providerId === 'password' && !deletePassword)}
                            >
                                {isLoading ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;