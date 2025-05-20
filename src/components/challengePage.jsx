import 'react';
import NavBar from "./navBar.jsx";
import ChallengeTable from "./challengeTable.jsx";
import {useContext, useEffect, useState} from "react";
import axios from "axios";
import {useAuth} from "../Auth/AuthContext.jsx";
import {ErrorContext} from "../context/errorContext.jsx";
import FilterButton from "./challenges/filterButton.jsx";
import {ChallengeContext} from "./challenges/ChallengeContext.jsx";

const challengeMenu = [
    { label: 'Visualizer', path: '/visualizer' },
    { label: 'Comparator', path: '/comparator' },
    { label: 'Challenges', path: '/challenge' },
    { label: 'Code Library', path: '/library' },
    { label: 'Examples', path: '/example' }
];

const ChallengePage = () => {
    const { auth } = useAuth();
    const [challengeEntries, setChallengeEntries] = useState([]);
    const { setError } = useContext(ErrorContext);
    const { solvedChallenges } = useContext(ChallengeContext);

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [isFiltering, setIsFiltering] = useState(false);

    // Filter state in a single object
    const [filters, setFilters] = useState({
        status: null,
        difficulty: null,
        category: null,
        type: null
    });

    const CACHE_KEY = 'challengesEntries';
    const CACHE_DURATION = 1000 * 60 * 60;

    const baseURL = 'https://algoverse-backend-nodejs.onrender.com';

    useEffect(() => {
        const fetchChallengesEntries = async () => {
            const cached = localStorage.getItem(CACHE_KEY);

            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    setChallengeEntries(data);
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

                const response = await axios.get(`${baseURL}/api/challenges`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                setChallengeEntries(response.data);
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
        fetchChallengesEntries();
    }, [auth.currentUser]);

    useEffect(() => {
        // Check if any filtering is active
        const hasActiveFilters = searchTerm.trim() !== '' ||
            Object.values(filters).some(filter => filter !== null && filter !== '');

        setIsFiltering(hasActiveFilters);
        applyFilters();
    }, [searchTerm, filters, challengeEntries, solvedChallenges]);

    const applyFilters = () => {
        // Only proceed if we have challenge entries to filter
        if (challengeEntries.length === 0) return;

        // If no search or filters are active, show all entries
        const hasActiveFilters = searchTerm.trim() !== '' ||
            Object.values(filters).some(filter => filter !== null && filter !== '');

        if (!hasActiveFilters) {
            setFilteredEntries(challengeEntries);
            return;
        }

        let results = [...challengeEntries];

        // Apply search term filter
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            results = results.filter(entry =>
                entry.title?.toLowerCase().includes(term) ||
                entry.description?.toLowerCase().includes(term)
            );
        }

        // Apply status filter
        if (filters.status) {
            results = results.filter(entry =>
                filters.status === 'Solved'
                    ? solvedChallenges.includes(entry.id)
                    : !solvedChallenges.includes(entry.id)
            );
        }

        // Apply difficulty filter
        if (filters.difficulty) {
            results = results.filter(entry => entry.difficulty === filters.difficulty);
        }

        // Apply category filter
        if (filters.category) {
            results = results.filter(entry => entry.category === filters.category);
        }

        // Apply challenge type filter
        if (filters.type) {
            results = results.filter(entry => entry.type === filters.type);
        }

        setFilteredEntries(results);
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    }

    const handleFilterChange = (filterType, value) => {
        // If the same value is clicked again, toggle it off
        setFilters(prev => ({
            ...prev,
            [filterType]: prev[filterType] === value ? null : value
        }));
    }

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilters({
            status: null,
            difficulty: null,
            category: null,
            type: null
        });
    }

    // Determine which entries to display
    const displayEntries = isFiltering ? filteredEntries : challengeEntries;

    return (
        <div className="scrollbar-hide overflow-auto h-screen bg-base-200 flex flex-col items-center">
            <NavBar menuItems={challengeMenu} />
            <div className="flex flex-col items-center justify-center w-full max-w-7xl px-4 mt-6 sm:mt-8 md:mt-10 gap-3 sm:gap-4">
                {/* Top Cards - Responsive grid that adjusts from 1 column on mobile to 4 on large screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
                    {/* Rankings Card */}
                    <div className="card w-full bg-base-300 shadow-xl">
                        <div className="card-body p-4 sm:p-6">
                            <div className="flex flex-row justify-between items-center">
                                <div className="text-neutral-content font-medium text-sm sm:text-base">Rankings</div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="sm:w-[22px] sm:h-[22px]">
                                    <path fill="#e6d8d8" d="M12 5.5A3.5 3.5 0 0 1 15.5 9a3.5 3.5 0 0 1-3.5 3.5A3.5 3.5 0 0 1 8.5 9A3.5 3.5 0 0 1 12 5.5M5 8c.56 0 1.08.15 1.53.42c-.15 1.43.27 2.85 1.13 3.96C7.16 13.34 6.16 14 5 14a3 3 0 0 1-3-3a3 3 0 0 1 3-3m14 0a3 3 0 0 1 3 3a3 3 0 0 1-3 3c-1.16 0-2.16-.66-2.66-1.62a5.54 5.54 0 0 0 1.13-3.96c.45-.27.97-.42 1.53-.42M5.5 18.25c0-2.07 2.91-3.75 6.5-3.75s6.5 1.68 6.5 3.75V20h-13zM0 20v-1.5c0-1.39 1.89-2.56 4.45-2.9c-.59.68-.95 1.62-.95 2.65V20zm24 0h-3.5v-1.75c0-1.03-.36-1.97-.95-2.65c2.56.34 4.45 1.51 4.45 2.9z" />
                                </svg>
                            </div>
                            <div className="stat-value text-xl sm:text-2xl md:text-3xl font-bold">0</div>
                        </div>
                    </div>

                    {/* Completed Tasks Card */}
                    <div className="card w-full bg-base-300 shadow-xl">
                        <div className="card-body p-4 sm:p-6">
                            <div className="flex flex-row justify-between items-center">
                                <div className="text-neutral-content font-medium text-sm sm:text-base">Completed Tasks</div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512" className="sm:w-[20px] sm:h-[20px]">
                                    <path fill="#e6d8d8" d="M139.61 35.5a12 12 0 0 0-17 0L58.93 98.81l-22.7-22.12a12 12 0 0 0-17 0L3.53 92.41a12 12 0 0 0 0 17l47.59 47.4a12.78 12.78 0 0 0 17.61 0l15.59-15.62L156.52 69a12.09 12.09 0 0 0 .09-17zm0 159.19a12 12 0 0 0-17 0l-63.68 63.72l-22.7-22.1a12 12 0 0 0-17 0L3.53 252a12 12 0 0 0 0 17L51 316.5a12.77 12.77 0 0 0 17.6 0l15.7-15.69l72.2-72.22a12 12 0 0 0 .09-16.9zM64 368c-26.49 0-48.59 21.5-48.59 48S37.53 464 64 464a48 48 0 0 0 0-96m432 16H208a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h288a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16m0-320H208a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h288a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16m0 160H208a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h288a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16" />
                                </svg>
                            </div>
                            <div className="stat-value text-xl sm:text-2xl md:text-3xl font-bold">0</div>
                        </div>
                    </div>

                    {/* Total Points Card */}
                    <div className="card w-full bg-base-300 shadow-xl">
                        <div className="card-body p-4 sm:p-6">
                            <div className="flex flex-row justify-between items-center">
                                <div className="text-neutral-content font-medium text-sm sm:text-base">Total Points</div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" className="sm:w-[21px] sm:h-[21px]">
                                    <g fill="none" fillRule="evenodd">
                                        <path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z" />
                                        <path fill="#e6d8d8" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2m0 1a9 9 0 0 1-9 9a9 9 0 0 1 9 9a9 9 0 0 1 9-9a9 9 0 0 1-9-9" />
                                    </g>
                                </svg>
                            </div>
                            <div className="stat-value text-xl sm:text-2xl md:text-3xl font-bold">0</div>
                        </div>
                    </div>

                    {/* Badges Earned Card */}
                    <div className="card w-full bg-base-300 shadow-xl">
                        <div className="card-body p-4 sm:p-6">
                            <div className="flex flex-row justify-between items-center">
                                <div className="text-neutral-content font-medium text-sm sm:text-base">Badges Earned</div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512" className="sm:w-[20px] sm:h-[20px]">
                                    <path fill="#e6d8d8" d="M4.1 38.2C1.4 34.2 0 29.4 0 24.6C0 11 11 0 24.6 0h109.3c11.2 0 21.7 5.9 27.4 15.5l68.5 114.1c-48.2 6.1-91.3 28.6-123.4 61.9zm503.7 0L405.6 191.5c-32.1-33.3-75.2-55.8-123.4-61.9l68.5-114.1C356.5 5.9 366.9 0 378.1 0h109.3C501 0 512 11 512 24.6c0 4.8-1.4 9.6-4.1 13.6zM80 336a176 176 0 1 1 352 0a176 176 0 1 1-352 0m184.4-94.9c-3.4-7-13.3-7-16.8 0l-22.4 45.4c-1.4 2.8-4 4.7-7 5.1l-50.2 7.3c-7.7 1.1-10.7 10.5-5.2 16l36.3 35.4c2.2 2.2 3.2 5.2 2.7 8.3l-8.6 49.9c-1.3 7.6 6.7 13.5 13.6 9.9l44.8-23.6c2.7-1.4 6-1.4 8.7 0l44.8 23.6c6.9 3.6 14.9-2.2 13.6-9.9l-8.6-49.9c-.5-3 .5-6.1 2.7-8.3l36.3-35.4c5.6-5.4 2.5-14.8-5.2-16l-50.1-7.3c-3-.4-5.7-2.4-7-5.1z" />
                                </svg>
                            </div>
                            <div className="stat-value text-xl sm:text-2xl md:text-3xl font-bold">0</div>
                        </div>
                    </div>
                </div>

                {/* Bottom Content Cards - Responsive grid that changes layout on different screens */}
                <div className="w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
                        {/* Main Content Card - Full width on mobile, 3/4 width on large screens */}
                        <div className="col-span-1 lg:col-span-3">
                            <div className="card w-full bg-base-300 shadow-xl min-h-64">
                                <div className="card-body p-4 sm:p-6">
                                    <div className="flex flex-row items-start justify-end lg:items-center gap-3 lg:gap-0">
                                        {/* Search bar - Full width on mobile to md, auto width on lg */}
                                        <label className="input input-sm sm:input-md w-full lg:max-w-69 mr-2">
                                            <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                                <g
                                                    strokeLinejoin="round"
                                                    strokeLinecap="round"
                                                    strokeWidth="2.5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                >
                                                    <circle cx="11" cy="11" r="8"></circle>
                                                    <path d="m21 21-4.3-4.3"></path>
                                                </g>
                                            </svg>
                                            <input onChange={handleSearch} type="search" required placeholder="Search" className="w-full" />
                                        </label>

                                        {/* New FilterButton Component */}
                                        <FilterButton
                                            filters={filters}
                                            onFilterChange={handleFilterChange}
                                            onResetFilters={handleResetFilters}
                                        />
                                    </div>
                                    <ChallengeTable challenges={displayEntries}/>
                                </div>
                            </div>
                        </div>
                        {/* Side Card - Full width on mobile, 1/4 width on large screens */}
                        <div className="col-span-1">
                            <div className="card w-full bg-base-300 shadow-xl min-h-64">
                                <div className="card-body p-4 sm:p-6">
                                    <h2 className="card-title text-lg sm:text-xl">Leaderboard</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChallengePage;