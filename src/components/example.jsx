import 'react'
import NavBar from "./navBar.jsx";
import {useContext, useEffect, useState} from "react";
import {useAuth} from "../Auth/AuthContext.jsx";
import {ErrorContext} from "../context/errorContext.jsx";
import axios from "axios";
import ExampleCard from "./exampleCard.jsx";

const Example = () => {
    const { auth } = useAuth();
    const [exampleEntries, setExampleEntries] = useState([]);
    const { setError } = useContext(ErrorContext);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [isFiltering, setIsFiltering] = useState(false);

    const exampleMenu = [
        { label: 'Visualizer', path: '/visualizer' },
        { label: 'Comparator', path: '/comparator' },
        { label: 'Challenges', path: '/challenge' },
        { label: 'Code Library', path: '/library' },
        { label: 'Examples', path: '/example' }
    ];

    const CACHE_KEY = 'exampleEntries';
    const CACHE_DURATION = 1000 * 60 * 5;

    useEffect(() => {
        const fetchExampleEntries = async () => {
            const cached = localStorage.getItem(CACHE_KEY);

            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    setExampleEntries(data);
                    setFilteredEntries(data);
                    setError(null);
                    return;
                }
            }

            try {
                if (!auth.currentUser) {
                    setError('No user is logged in');
                    return;
                }

                const token = await auth.currentUser.getIdToken();

                const response = await axios.get('https://algoverse-backend-nodejs.onrender.com/api/example', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                setExampleEntries(response.data);
                setFilteredEntries(response.data); // Initialize filtered entries with all entries
                setError(null);

                localStorage.setItem(CACHE_KEY, JSON.stringify({ data: response.data, timestamp: Date.now() }));
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
        fetchExampleEntries();
    }, []);

    useEffect(() => {
        // Check if any filtering is active
        const filtering = searchTerm.trim() !== '' || activeFilter !== '';
        setIsFiltering(filtering);

        applySearchAndFilter();
    }, [searchTerm, activeFilter, exampleEntries]);

    const applySearchAndFilter = () => {
        // Only proceed if we have code entries to filter
        if (exampleEntries.length === 0) return;

        // If no search or filter is active, show all entries
        if (searchTerm.trim() === '' && activeFilter === '') {
            setFilteredEntries(exampleEntries);
            return;
        }

        let results = [...exampleEntries];

        // Apply search
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            results = results.filter(entry =>
                entry.title?.toLowerCase().includes(term) ||
                entry.description?.toLowerCase().includes(term)
            );
        }

        // Apply category filter
        if (activeFilter !== '') {
            results = results.filter(entry => entry.category === activeFilter);
        }

        setFilteredEntries(results);
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    }

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setActiveFilter('');
    }

    // Determine which entries to display
    const displayEntries = isFiltering ? filteredEntries : exampleEntries;

    return (
        <div className="scrollbar-hide overflow-auto h-screen bg-base-200">
            <NavBar menuItems={exampleMenu} />
            <div className="flex flex-col justify-center items-center mt-25  mx-4 sm:mx-0">
                <div className="flex flex-col items-center justify-center max-w-120 w-full">
                    <label className="input w-full">
                        <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></g></svg>
                        <input
                            type="search"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </label>
                    <form className="filter mt-5 flex justify-center items-center">
                        <input
                            className="btn btn-square btn-error"
                            type="reset"
                            value="✕"
                            onClick={handleResetFilters}
                        />

                        {['Sorting', 'Search', 'Graph', 'Recursion'].map(filter => (
                            <input
                                key={filter}
                                className="btn btn-accent btn-sm rounded-3xl text-base-300 shadow-sm ml-2"
                                type="radio"
                                name="frameworks"
                                aria-label={filter}
                                onClick={() => handleFilterChange(filter)}
                            />
                        ))}
                    </form>
                </div>

                {isFiltering && filteredEntries.length === 0 ? (
                    <div className="mt-10 text-center">
                        <h3 className="text-xl">No matching example entries found</h3>
                        <p className="mt-2">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-10">
                        {displayEntries.map(entry => (
                            <div key={entry.id} className="rounded-lg flex flex-col">
                                <ExampleCard cardInfo={entry} />
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    )
}
export default Example
