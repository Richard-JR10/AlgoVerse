import {useContext, useEffect, useState} from 'react'
import axios from "axios";
import {useAuth} from "../Auth/AuthContext.jsx";
import {ErrorContext} from "../context/errorContext.jsx";
import UsersTable from "./usersTable.jsx";

const UserManagement = () => {
    const { auth } = useAuth();
    const [users, setUsers] = useState([]);
    const { setError } = useContext(ErrorContext);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUids, setSelectedUids] = useState([]); // Track selected users
    const usersPerPage = 10;

    useEffect(() => {
        const fetchAllUsers = async () => {
            if (!auth.currentUser) return;
            const token = await auth.currentUser.getIdToken();

            try {
                const response = await axios.get('https://algoverse-backend-nodejs.onrender.com/api/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const filteredUsers = response.data.filter(
                    (user) => user.uid !== auth.currentUser.uid
                );
                setUsers(filteredUsers);
                setError(null);
            } catch (err) {
                console.error('Fetch error:', err);
                // Handle Axios-specific errors
                if (err.response) {
                    setError(err.response.data.error || 'Failed to fetch code entries');
                } else {
                    setError(err.message || 'An unexpected error occurred');
                }
            }

        }
        fetchAllUsers();
    },[auth.currentUser])

    const handleCheckboxChange = (uid) => {
        setSelectedUids((prev) =>
            prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
        );
    };

    const handleSelectAll = (isChecked) => {
        if (isChecked) {
            // Select all users across all pages
            setSelectedUids(users.map((user) => user.uid));
        } else {
            // Deselect all users
            setSelectedUids([]);
        }
    };

    const handleBulkDisable = async () => {
        if (selectedUids.length === 0) return setError('No users selected');
        if (!confirm(`Disable ${selectedUids.length} users?`)) return;
        const token = await auth.currentUser.getIdToken();
        try {
            await axios.post(
                'https://algoverse-backend-nodejs.onrender.com/api/users/disable',
                { uid: selectedUids },
                { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            setUsers((prevUsers) =>
                prevUsers.map((u) => (selectedUids.includes(u.uid) ? { ...u, disabled: true } : u))
            );
            setSelectedUids([]);
            setError(null);
        } catch (err) {
            console.error('Bulk disable error:', err);
            setError(err.response?.data?.error || 'Failed to disable users');
        }
    };

    const handleBulkEnable = async () => {
        if (selectedUids.length === 0) return setError('No users selected');
        if (!confirm(`Enable ${selectedUids.length} users?`)) return;
        const token = await auth.currentUser.getIdToken();
        try {
            await axios.post(
                'https://algoverse-backend-nodejs.onrender.com/api/users/enable',
                { uid: selectedUids },
                { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            setUsers((prevUsers) =>
                prevUsers.map((u) => (selectedUids.includes(u.uid) ? { ...u, disabled: false } : u))
            );
            setSelectedUids([]);
            setError(null);
        } catch (err) {
            console.error('Bulk enable error:', err);
            setError(err.response?.data?.error || 'Failed to enable users');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUids.length === 0) return setError('No users selected');
        if (!confirm(`Delete ${selectedUids.length} users? This is permanent!`)) return;
        const token = await auth.currentUser.getIdToken();
        try {
            await axios.post(
                'https://algoverse-backend-nodejs.onrender.com/api/users/delete',
                { uid: selectedUids },
                { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            setUsers((prevUsers) => prevUsers.filter((u) => !selectedUids.includes(u.uid)));
            setSelectedUids([]);
            if (currentPage > Math.ceil(users.length / usersPerPage)) {
                setCurrentPage((prev) => Math.max(prev - 1, 1));
            }
            setError(null);
        } catch (err) {
            console.error('Bulk delete error:', err);
            setError(err.response?.data?.error || 'Failed to delete users');
        }
    };

    const handleDisable = async (uid) => {
        if (!confirm(`Disable user ${uid}?`)) return;
        const token = await auth.currentUser.getIdToken();
        try {
            await axios.post(
                'https://algoverse-backend-nodejs.onrender.com/api/users/disable',
                { uid: [uid] },
                { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            setUsers(users.map((u) => (u.uid === uid ? { ...u, disabled: true } : u)));
            setError(null);
        } catch (err) {
            console.error('Disable error:', err); // Already present
            console.error('Error response:', err.response?.data); // Add this
            setError(err.response?.data.error || 'Failed to disable user');
        }
    };

    const handleEnable = async (uid) => {
        if (!confirm(`Enable user ${uid}?`)) return;
        const token = await auth.currentUser.getIdToken();
        try {
            await axios.post(
                'https://algoverse-backend-nodejs.onrender.com/api/users/enable',
                { uid: [uid] },
                { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            setUsers(users.map((u) => (u.uid === uid ? { ...u, disabled: false } : u)));
            setError(null);
        } catch (err) {
            console.error('Enable error:', err); // Already present
            console.error('Error response:', err.response?.data); // Add this
            setError(err.response?.data.error || 'Failed to enable user');
        }
    };

    const handleDelete = async (uid) => {
        if (!confirm(`Delete user ${uid}? This is permanent!`)) return;
        const token = await auth.currentUser.getIdToken();
        try {
            await axios.post(
                'https://algoverse-backend-nodejs.onrender.com/api/users/delete',
                { uid: [uid] },
                { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            setUsers(users.filter((u) => u.uid !== uid));
            // Adjust page if necessary after deletion
            if (currentPage > Math.ceil(users.length / usersPerPage)) {
                setCurrentPage((prev) => Math.max(prev - 1, 1));
            }
            setError(null);
        } catch (err) {
            console.error('Delete error:', err);
            setError(err.response?.data.error || 'Failed to delete user');
        }
    };

    const handleSetAdmin = async (uid) => {
        if (!confirm(`Set user ${uid} as an admin? This is permanent!`)) return;
        const token = await auth.currentUser.getIdToken();
        try {
            await axios.post(
                'https://algoverse-backend-nodejs.onrender.com/api/users/set-admin',
                { uid: [uid] },
                { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            setUsers((prevUsers) =>
                prevUsers.map((u) => (u.uid === uid ? { ...u, admin: true } : u))
            );
            setError(null);
        } catch (err) {
            console.error('Set admin error:', err);
            setError(err.response?.data?.error || 'Failed to set user admin');
        }
    }

    const handleRemoveAdmin = async (uid) => {
        if (!confirm(`Remove user ${uid} as an admin? This is permanent!`)) return;
        const token = await auth.currentUser.getIdToken();
        try {
            await axios.post(
                'https://algoverse-backend-nodejs.onrender.com/api/users/remove-admin',
                { uid: [uid] },
                { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            setUsers((prevUsers) =>
                prevUsers.map((u) => (u.uid === uid ? { ...u, admin: false } : u))
            );
            setError(null);
        } catch (err) {
            console.error('Remove admin error:', err);
            setError(err.response?.data?.error || 'Failed to remove user admin');
        }
    }

    // Pagination logic
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(users.length / usersPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="flex-3">
            <div className="mb-4 flex gap-2">
                <button
                    className="btn btn-warning"
                    onClick={handleBulkDisable}
                    disabled={selectedUids.length === 0}
                >
                    Disable Selected
                </button>
                <button
                    className="btn btn-success"
                    onClick={handleBulkEnable}
                    disabled={selectedUids.length === 0}
                >
                    Enable Selected
                </button>
                <button
                    className="btn btn-error"
                    onClick={handleBulkDelete}
                    disabled={selectedUids.length === 0}
                >
                    Delete Selected
                </button>
            </div>
            <UsersTable
                usersInfo={currentUsers}
                onDelete={handleDelete}
                onDisable={handleDisable}
                onEnable={handleEnable}
                onCheckboxChange={handleCheckboxChange}
                selectedUids={selectedUids}
                onSelectAll={handleSelectAll}
                onSetAdmin={handleSetAdmin}
                onRemoveAdmin={handleRemoveAdmin}
            />
            {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                    <div className="join">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <input
                                key={page}
                                className="join-item btn btn-square"
                                type="radio"
                                name="pagination"
                                aria-label={page.toString()}
                                checked={currentPage === page}
                                onChange={() => handlePageChange(page)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
export default UserManagement
