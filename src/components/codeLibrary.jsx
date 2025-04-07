import {useContext, useEffect, useState} from 'react'
import NavBar from "./navBar.jsx";
import CodeLibraryCard from "./codeLibraryCard.jsx";
import {useAuth} from "../Auth/AuthContext.jsx";
import axios from "axios";
import {ErrorContext} from "../context/errorContext.jsx";

const CodeLibrary = () => {
    const { auth } = useAuth();
    const [codeEntries, setCodeEntries] = useState([]);
    const { setError } = useContext(ErrorContext);
    const codeMenu = [
        { label: 'Visualizer', path: '/visualizer' },
        { label: 'Comparator', path: '/comparator' },
        { label: 'Challenges', path: '/' },
        { label: 'Code Library', path: '/library' },
        { label: 'Examples', path: '/' }
    ];

    useEffect(() => {
        const fetchCodeEntries = async () => {
            try {
                if (!auth.currentUser) {
                    setError('No user is logged in');
                    return;
                }

                const token = await auth.currentUser.getIdToken();

                const response = await axios.get('http://localhost:3000/api/library', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                setCodeEntries(response.data);
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
        };
        fetchCodeEntries();
    }, []);


    return (
        <div className="scrollbar-hide overflow-auto h-screen bg-base-200">
            <NavBar menuItems={codeMenu} />
            <div className="flex flex-col justify-center items-center mt-25">
                <div className="flex flex-col items-center justify-center max-w-120 w-full">
                    <label className="input w-full">
                        <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></g></svg>
                        <input type="search" required placeholder="Search"/>
                    </label>
                    <div className="flex flex-row gap-5 mt-5">
                        <button className="btn btn-accent btn-sm rounded-3xl text-base-300">Sorting</button>
                        <button className="btn btn-accent btn-sm rounded-3xl text-base-300">Search</button>
                        <button className="btn btn-accent btn-sm rounded-3xl text-base-300">Graph</button>
                        <button className="btn btn-accent btn-sm rounded-3xl text-base-300">Recursion</button>
                        <button className="btn btn-accent btn-sm rounded-3xl text-base-300">Show All</button>
                    </div>
                </div>
                {codeEntries.map(entry => (
                    <CodeLibraryCard key={entry.id} cardInfo={entry} />
                ))}
            </div>
        </div>

    )
}
export default CodeLibrary
