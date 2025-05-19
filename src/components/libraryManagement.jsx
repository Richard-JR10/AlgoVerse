import {useContext, useEffect, useState} from 'react'
import {useAuth} from "../Auth/AuthContext.jsx";
import {ErrorContext} from "../context/errorContext.jsx";
import axios from "axios";
import LibraryTable from "./libraryTable.jsx";
import LibraryAddData from "./libraryAddData.jsx";

const LibraryManagement = () => {
    const { auth } = useAuth();
    const { setError } = useContext(ErrorContext);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedId, setSelectedId] = useState([]);
    const [data, setData] = useState([]);
    const contentsPerPage = 10;
    const baseURL = "https://algoverse-backend-nodejs.onrender.com";

    useEffect(() => {
        const fetchLibraryData = async () => {
            if (!auth.currentUser) return;
            const token = await auth.currentUser.getIdToken();
            
            try {
                const response = await axios.get(`${baseURL}/api/library`,{
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });
                setData(response.data);
                setError(null);
            } catch (err) {
                if (err.response) {
                    setError(err.response.data.error || 'Failed to fetch code entries');
                } else {
                    setError(err.message || 'An unexpected error occurred');
                }
            }
        }
        fetchLibraryData();
    }, [auth.currentUser])

    const handleAddData = async(data) => {
        const token = await auth.currentUser.getIdToken();
        try{
            const response = await axios.post(
                `${baseURL}/api/addLibrary`,
                data, // Send the data directly
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            const newItem = {
                id: response.data.id, // Get the id from the backend response
                ...data, // Spread the original libraryData (title, category, description, codeData)
            };
            setData((prev) => [...prev, newItem]);
            setError(null);
        } catch (err) {
            setError(err.response?.data.error || 'Failed to add data');
        }
    }

    const handleEditData = async(id,data) => {
        const token = await auth.currentUser.getIdToken();

        try {
            await axios.put(
                `${baseURL}/api/updateLibrary`,
                {
                    id: id,
                    ...data
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Update the parent component
            setData(prevData =>
                prevData.map(item =>
                    item.id === id
                        ? { id: id, ...data }
                        : item
                )
            );

            setError(null);
        } catch (err) {
            setError(err.response?.data.error || 'Failed to update data');
        }
    }

    const handleCheckboxChange = (id) => {
        setSelectedId((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev,id]
        );
    }

    const handleSelectAll = (isChecked) => {
        if (isChecked) {
            setSelectedId(data.map((item) => item.id));
        } else {
            setSelectedId([]);
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this data?')) return;
        const token = await auth.currentUser.getIdToken();
        try {
            await axios.delete(
                `${baseURL}/api/library/delete`,{
                data: {id: [id]},
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            setData(data.filter((item) => item.id !== id));
            setError(null);
        } catch (err) {
            setError(err.response?.data.error || 'Failed to delete data');
        }
    }

    const handleBulkDelete = async () => {
        if (selectedId.length === 0) return setError('No users selected');
        if (!confirm(`Delete ${selectedId.length} data? This is permanent!`)) return;
        const token = await auth.currentUser.getIdToken();
        try {
            await axios.delete(
                `${baseURL}/api/library/delete`,{
                    data: {id: selectedId},
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                });
            setData((prevItems) => prevItems.filter((i) => !selectedId.includes(i.id)));
            setSelectedId([]);
            setError(null);
        } catch (err) {
            setError(err.response?.data.error || 'Failed to delete data');
        }
    }

    // Pagination logic
    const indexOfLastUser = currentPage * contentsPerPage;
    const indexOfFirstUser = indexOfLastUser - contentsPerPage;
    const currentData = data.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(data.length / contentsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };


    return (
        <div className="flex-3">
            <div className="flex items-center gap-3 mb-2">
                <h1 className="font-bold text-xl">Library Management</h1>
                <LibraryAddData onAddData={handleAddData}/>
                <button
                    className="btn btn-error"
                    onClick={handleBulkDelete}
                    disabled={selectedId.length === 0}
                >
                    Delete Selected
                </button>
            </div>
            <LibraryTable
                libraryInfo={currentData}
                onCheckboxChange={handleCheckboxChange}
                selectedIds={selectedId}
                onSelectAll={handleSelectAll}
                onDelete={handleDelete}
                onEditData={handleEditData}
            />
            {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                    <div className="join">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page,i) => (
                            <input
                                key={i}
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
export default LibraryManagement
