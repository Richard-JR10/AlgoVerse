import { useState, useEffect, useRef } from 'react';

const FilterButton = ({
                          onFilterChange,
                          onResetFilters,
                          filters
                      }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Active filter counts - used to show the badge on filter button
    const activeFilterCount = Object.values(filters).filter(value => value !== null && value !== '').length;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleFilterChange = (filterType, value) => {
        onFilterChange(filterType, value);
    };

    const handleResetAll = () => {
        onResetFilters();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Filter Button */}
            <div className="indicator">
                {activeFilterCount > 0 && (
                    <span className="indicator-item w-6 rounded-full badge badge-secondary">{activeFilterCount}</span>
                )}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="btn btn-circle btn-sm sm:btn-md flex items-center gap-2 bg-base-100 hover:bg-base-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"/>
                    </svg>
                </button>

            </div>

            {/* Filter Dropdown */}
            {isOpen && (
                <div className="absolute top-full mt-2 right-0 z-50 w-72 sm:w-80 bg-base-200 rounded-lg shadow-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-base">Filter Questions</h3>
                        <button
                            onClick={handleResetAll}
                            className="btn btn-error btn-xs text-sm"
                        >
                            Reset All
                        </button>
                    </div>

                    {/* Filter Sections */}
                    <div className="space-y-4">
                        {/* Status Filter */}
                        <div>
                            <label className="text-sm font-medium block mb-2">Status</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleFilterChange('status', 'Not Solved')}
                                    className={`btn btn-xs ${filters.status === 'Not Solved' ? 'btn-accent' : 'btn-outline'}`}
                                >
                                    Not Solved
                                </button>
                                <button
                                    onClick={() => handleFilterChange('status', 'Solved')}
                                    className={`btn btn-xs ${filters.status === 'Solved' ? 'btn-accent' : 'btn-outline'}`}
                                >
                                    Solved
                                </button>
                            </div>
                        </div>

                        {/* Difficulty Filter */}
                        <div>
                            <label className="text-sm font-medium block mb-2">Difficulty</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleFilterChange('difficulty', 'Easy')}
                                    className={`btn btn-xs ${filters.difficulty === 'Easy' ? 'btn-success' : 'btn-outline'}`}
                                >
                                    Easy
                                </button>
                                <button
                                    onClick={() => handleFilterChange('difficulty', 'Medium')}
                                    className={`btn btn-xs ${filters.difficulty === 'Medium' ? 'btn-warning' : 'btn-outline'}`}
                                >
                                    Medium
                                </button>
                                <button
                                    onClick={() => handleFilterChange('difficulty', 'Hard')}
                                    className={`btn btn-xs ${filters.difficulty === 'Hard' ? 'btn-error' : 'btn-outline'}`}
                                >
                                    Hard
                                </button>
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label className="text-sm font-medium block mb-2">Category</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleFilterChange('category', 'Sorting')}
                                    className={`btn btn-xs ${filters.category === 'Sorting' ? 'btn-accent' : 'btn-outline'}`}
                                >
                                    Sorting
                                </button>
                                <button
                                    onClick={() => handleFilterChange('category', 'Search')}
                                    className={`btn btn-xs ${filters.category === 'Search' ? 'btn-accent' : 'btn-outline'}`}
                                >
                                    Search
                                </button>
                                <button
                                    onClick={() => handleFilterChange('category', 'Graph')}
                                    className={`btn btn-xs ${filters.category === 'Graph' ? 'btn-accent' : 'btn-outline'}`}
                                >
                                    Graph
                                </button>
                                <button
                                    onClick={() => handleFilterChange('category', 'Recursion')}
                                    className={`btn btn-xs ${filters.category === 'Recursion' ? 'btn-accent' : 'btn-outline'}`}
                                >
                                    Recursion
                                </button>
                            </div>
                        </div>

                        {/* Challenge Type Filter */}
                        <div>
                            <label className="text-sm font-medium block mb-2">Challenge Type</label>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => handleFilterChange('type', 1)}
                                    className={`btn btn-xs ${filters.type === 1 ? 'btn-accent' : 'btn-outline'}`}
                                >
                                    Multiple Choice
                                </button>
                                <button
                                    onClick={() => handleFilterChange('type', 2)}
                                    className={`btn btn-xs ${filters.type === 2 ? 'btn-accent' : 'btn-outline'}`}
                                >
                                    Sorting Arrangement
                                </button>
                                <button
                                    onClick={() => handleFilterChange('type', 3)}
                                    className={`btn btn-xs ${filters.type === 3 ? 'btn-accent' : 'btn-outline'}`}
                                >
                                    Fill in the Blanks
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default FilterButton;