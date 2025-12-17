import {useContext, useState} from 'react'
import NavBar from "./navBar.jsx";
import axios from 'axios';
import {ErrorContext} from "../context/errorContext.jsx";

const Comparator = () => {
    const [formData, setFormData] = useState({
        category: null,
        input_size: null,
        custom_input_size: null,
        algorithms: []
    });
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { setError } = useContext(ErrorContext);
    const BASEURL = "https://algoverse-backend-python.onrender.com";

    const comparatorMenu = [
        { label: 'Visualizer', path: '/visualizer' },
        { label: 'Comparator', path: '/comparator' },
        { label: 'Challenges', path: '/challenge' },
        { label: 'Code Library', path: '/library' },
        { label: 'Examples', path: '/example' },
        { label: 'About', path: '/about' }
    ];

    const algorithmsByCategory = {
        'Sorting Algorithms': ['Bubble Sort', 'Merge Sort', 'Selection Sort', 'Insertion Sort', 'Quick Sort', 'Radix Sort', 'Heap Sort'],
        'Search Algorithms': ['Linear Search', 'Binary Search', 'Jump Search', 'Interpolation Search'],
        'Graph Traversal': ['BFS', 'DFS', 'Dijkstra', 'Kruskal', 'Tree Traversal (Pre-order)', 'Tree Traversal (In-order)', 'Tree Traversal (Post-order)'],
        'Recursion': ['Factorial', 'Tower of Hanoi']
    };

    const handleCategorySelect = (event) => {
        setFormData((prev) => ({
            ...prev,
            category: event.target.value,
            algorithms: []
        }));
    };

    const handleInputSizeSelect = (event) => {
        setFormData((prev) => ({
            ...prev,
            input_size: event.target.value,
            custom_input_size: event.target.value === 'Custom' ? prev.custom_input_size : null
        }));
    };

    const handleCustomInputSize = (event) => {
        setFormData((prev) => ({
            ...prev,
            custom_input_size: parseInt(event.target.value) || null
        }));
    };

    const handleAlgorithmToggle = (algorithm) => {
        setFormData((prev) => {
            const isSelected = prev.algorithms.includes(algorithm);
            return {
                ...prev,
                algorithms: isSelected
                    ? prev.algorithms.filter(a => a !== algorithm)
                    : [...prev.algorithms, algorithm]
            };
        });
    };

    const handleCompare = async () => {
        setResult(null);
        try {
            setIsLoading(true);

            if (!formData.input_size || !formData.category){
                setError('Select Category and Input Size.');
                return;
            }

            if (formData.input_size === 'Custom' && (!formData.custom_input_size || formData.custom_input_size <= 0)) {
                setError('Please enter a valid custom input size.');
                return;
            }

            if (formData.algorithms.length < 2) {
                setError('Select at least two algorithms to compare.');
                return;
            }

            const dataToSend = {
                category: formData.category,
                input_size: formData.input_size === 'Custom'
                    ? `Custom (n = ${formData.custom_input_size})`
                    : formData.input_size,
                algorithms: formData.algorithms
            };

            const response = await axios.post(BASEURL + "/compare", dataToSend, {
                headers: { 'Content-Type': 'application/json' },
            });
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'An error occurred while fetching data.');
        } finally {
            setIsLoading(false);
        }
    };

    const availableAlgorithms = formData.category ? algorithmsByCategory[formData.category] : [];

    return (
        <div className="scrollbar-hide overflow-auto h-screen bg-base-200">
            <NavBar menuItems={comparatorMenu} />
            <div className="flex flex-col items-center justify-center mt-8">
                <div className="card w-full h-fit max-w-270 shadow-md">
                    <div className="card-body mx-4 lg:mx-0 bg-base-100 rounded-xl">
                        <div className="flex flex-row justify-between items-center">
                            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0">Algorithm Comparison</h3>
                            <div className="badge border-2 border-base-content p-4 rounded-full font-bold">
                                <svg width="24px" height="24px" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor" className="text-base-content"><path d="M16 13C13.2386 13 11 11.8807 11 10.5C11 9.11929 13.2386 8 16 8C18.7614 8 21 9.11929 21 10.5C21 11.8807 18.7614 13 16 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M11 14.5C11 15.8807 13.2386 17 16 17C18.7614 17 21 15.8807 21 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M3 9.5C3 10.8807 5.23858 12 8 12C9.12583 12 10.1647 11.814 11.0005 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M3 13C3 14.3807 5.23858 15.5 8 15.5C9.12561 15.5 10.1643 15.314 11 15.0002" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M3 5.5V16.5C3 17.8807 5.23858 19 8 19C9.12563 19 10.1643 18.8139 11 18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M13 8.5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M11 10.5V18.5C11 19.8807 13.2386 21 16 21C18.7614 21 21 19.8807 21 18.5V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M8 8C5.23858 8 3 6.88071 3 5.5C3 4.11929 5.23858 3 8 3C10.7614 3 13 4.11929 13 5.5C13 6.88071 10.7614 8 8 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                <div className="text-base-content">10</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                                defaultValue="Select Algorithm Category"
                                className="select border-neutral-content light:border-neutral bg-base-100 rounded-lg w-full sm-w-auto sm:flex-1"
                                onChange={handleCategorySelect}
                            >
                                <option disabled={true}>Select Algorithm Category</option>
                                <option>Sorting Algorithms</option>
                                <option>Search Algorithms</option>
                                <option>Graph Traversal</option>
                                <option>Recursion</option>
                            </select>
                            <select
                                defaultValue="Input Size Range"
                                className="select border-neutral-content light:border-neutral bg-base-100 rounded-lg w-full sm-w-auto sm:flex-1"
                                onChange={handleInputSizeSelect}
                            >
                                <option disabled={true}>Input Size Range</option>
                                <option>Small (n &lt; 1000)</option>
                                <option>Medium (1000 &lt; n &lt; 100000)</option>
                                <option>Large (n &gt; 100000)</option>
                                <option>Custom</option>
                            </select>
                            {formData.input_size === 'Custom' && (
                                <input
                                    type="number"
                                    placeholder="Enter custom size (e.g., 5000)"
                                    className="input border-neutral-content light:border-neutral bg-base-100 rounded-lg w-full sm-w-auto sm:flex-1"
                                    onChange={handleCustomInputSize}
                                    value={formData.custom_input_size || ''}
                                    min="1"
                                />
                            )}
                            <div className={`dropdown ${!formData.category ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <div
                                    tabIndex={formData.category ? "0" : "-1"}
                                    role="button"
                                    className={`select border-neutral-content light:border-neutral bg-base-100 rounded-lg w-full sm-w-auto sm:flex-1 ${!formData.category ? 'pointer-events-none' : ''}`}
                                >
                                    {formData.algorithms.length > 0
                                        ? `${formData.algorithms.length} algorithm${formData.algorithms.length > 1 ? 's' : ''} selected`
                                        : 'Select Algorithms'}
                                </div>
                                {formData.category && (
                                    <div
                                        tabIndex="-1"
                                        className="dropdown-content menu outline-neutral-500 outline-1 bg-base-100 z-[1] p-2 shadow w-full sm-w-auto sm:flex-1"
                                    >
                                        <form id="multi-select-form">
                                            {availableAlgorithms.map((algo, index) => (
                                                <label
                                                    key={index}
                                                    className="label cursor-pointer block mb-2 mt-2"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-primary mr-2"
                                                        value={algo}
                                                        checked={formData.algorithms.includes(algo)}
                                                        onChange={() => handleAlgorithmToggle(algo)}
                                                    />
                                                    <span className="label-text">{algo}</span>
                                                </label>
                                            ))}
                                        </form>
                                    </div>
                                )}
                            </div>
                            <button onClick={handleCompare} disabled={isLoading}
                                    className="btn rounded-lg w-full sm-w-auto sm:flex-1 bg-base-content/92 text-base-200">Compare
                                Algorithms
                            </button>
                        </div>
                    </div>
                </div>

                {!result ? (
                    <div className="flex flex-col items-center justify-center w-full">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center w-full">
                                <div className="card w-full h-fit max-w-270 mt-2 shadow-md">
                                    <div className="card-body bg-base-100 rounded-xl mx-4 lg:mx-0">
                                        <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0">Algorithm Comparison Results</h3>
                                        <div className="overflow-x-auto">
                                            <table className="table">
                                                <thead>
                                                <tr>
                                                    <th>Algorithm</th>
                                                    <th>Input Size</th>
                                                    <th>Time Complexity</th>
                                                    <th>Space Complexity</th>
                                                    <th>Benchmark</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {formData.algorithms && formData.algorithms.map((algo, index) => (
                                                    <tr key={index}>
                                                        <td><div className="skeleton h-4 w-full"></div></td>
                                                        <td><div className="skeleton h-4 w-full"></div></td>
                                                        <td><div className="skeleton h-4 w-full"></div></td>
                                                        <td><div className="skeleton h-4 w-full"></div></td>
                                                        <td><div className="skeleton h-4 w-full"></div></td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div className="card w-full h-fit max-w-270 mt-2 shadow-md mb-6">
                                    <div className="card-body bg-base-100 rounded-xl mx-4 lg:mx-0">
                                        <div className="flex flex-row items-center justify-start gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="text-primary"><g fill="none"><path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M9.107 5.448c.598-1.75 3.016-1.803 3.725-.159l.06.16l.807 2.36a4 4 0 0 0 2.276 2.411l.217.081l2.36.806c1.75.598 1.803 3.016.16 3.725l-.16.06l-2.36.807a4 4 0 0 0-2.412 2.276l-.081.216l-.806 2.361c-.598 1.75-3.016 1.803-3.724.16l-.062-.16l-.806-2.36a4 4 0 0 0-2.276-2.412l-.216-.081l-2.36-.806c-1.751-.598-1.804-3.016-.16-3.724l.16-.062l2.36-.806A4 4 0 0 0 8.22 8.025l.081-.216zM19 2a1 1 0 0 1 .898.56l.048.117l.35 1.026l1.027.35a1 1 0 0 1 .118 1.845l-.118.048l-1.026.35l-.35 1.027a1 1 0 0 1-1.845.117l-.048-.117l-.35-1.026l-1.027-.35a1 1 0 0 1-.118-1.845l.118-.048l1.026-.35l.35-1.027A1 1 0 0 1 19 2"/></g></svg>
                                            <h3 className="text-lg sm:text-xl font-semibold">AI Analysis</h3>
                                        </div>
                                        <div className="skeleton h-28 flex flex-col items-start justify-center bg-base-200 rounded-lg px-4 py-2.5"></div>
                                        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2 w-full h-full">
                                            <div className="skeleton h-28 flex flex-col items-start justify-start w-full bg-base-200 rounded-lg px-4 py-2.5"></div>
                                            <div className="skeleton h-28 flex flex-col items-start justify-center w-full bg-base-200 rounded-lg px-4 py-2.5"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="card w-full h-fit max-w-270 mt-2 shadow-md">
                                <div className="card-body w-full bg-base-100 rounded-xl h-fit mx-4 lg:mx-0">
                                    <div className="flex flex-col items-center justify-between">
                                        <div className="flex flex-col items-center justify-between">
                                            <svg className="mb-2" xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 512 512">
                                                <path fill="currentColor" d="M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64v336c0 44.2 35.8 80 80 80h400c17.7 0 32-14.3 32-32s-14.3-32-32-32H80c-8.8 0-16-7.2-16-16zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l89.4-89.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z"/></svg>
                                            <div className="text-lg mb-2">No Comparison Results Yet</div>
                                            <p className="text-sm mb-6 text-center">Select algorithm category, input size range, and algorithms above to start comparing algorithms.</p>
                                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                                <div className="flex flex-row items-center justify-center px-4 py-2 bg-accent-content rounded-lg gap-2 w-full sm:w-auto">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="17.5" height="14" viewBox="0 0 640 512"><path fill="white" d="M32 64c17.7 0 32 14.3 32 32v320c0 17.7-14.3 32-32 32S0 433.7 0 416V96c0-17.7 14.3-32 32-32m214.6 73.4c12.5 12.5 12.5 32.8 0 45.3L205.3 224h229.5l-41.4-41.4c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l96 96c12.5 12.5 12.5 32.8 0 45.3l-96 96c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l41.3-41.3H205.2l41.4 41.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0l-96-96c-12.5-12.5-12.5-32.8 0-45.3l96-96c12.5-12.5 32.8-12.5 45.3 0M640 96v320c0 17.7-14.3 32-32 32s-32-14.3-32-32V96c0-17.7 14.3-32 32-32s32 14.3 32 32"/></svg>
                                                    <div className="light:text-white">Compare Performance</div>
                                                </div>
                                                <div className="flex flex-row items-center justify-center px-4 py-2 bg-accent-content rounded-lg gap-2 w-full sm:w-auto">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="10.5" height="14" viewBox="0 0 384 512"><path fill="white" d="M272 384c9.6-31.9 29.5-59.1 49.2-86.2c5.2-7.1 10.4-14.2 15.4-21.4c19.8-28.5 31.4-63 31.4-100.3C368 78.8 289.2 0 192 0S16 78.8 16 176c0 37.3 11.6 71.9 31.4 100.3c5 7.2 10.2 14.3 15.4 21.4c19.8 27.1 39.7 54.4 49.2 86.2h160zm-80 128c44.2 0 80-35.8 80-80v-16H112v16c0 44.2 35.8 80 80 80m-80-336c0 8.8-7.2 16-16 16s-16-7.2-16-16c0-61.9 50.1-112 112-112c8.8 0 16 7.2 16 16s-7.2 16-16 16c-44.2 0-80 35.8-80 80"/></svg>
                                                    <div className="light:text-white">Get AI Insights</div>
                                                </div>
                                                <div className="flex flex-row items-center justify-center px-4 py-2 bg-accent-content rounded-lg gap-2 w-full sm:w-auto">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="17.5" height="14" viewBox="0 0 640 512"><path fill="white" d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6m80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3l89.3 89.4l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3"/></svg>
                                                    <div className="light:text-white">View Implementation</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ):(
                    <div className="flex flex-col items-center justify-center w-full">
                        <div className="card w-full h-fit max-w-270 mt-2 shadow-md">
                            <div className="card-body bg-base-100 rounded-xl mx-4 lg:mx-0">
                                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0">Algorithm Comparison Results</h3>
                                <div className="overflow-x-auto">
                                    <table className="table">
                                        <thead>
                                        <tr>
                                            <th>Algorithm</th>
                                            <th>Input Size</th>
                                            <th>Time Complexity</th>
                                            <th>Space Complexity</th>
                                            <th>Benchmark</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {result && result.algorithms.map((algo, index) => (
                                            <tr key={index}>
                                                <td>{algo.algorithm}</td>
                                                <td>{algo.input_size}</td>
                                                <td>{algo.time_complexity}</td>
                                                <td>{algo.space_complexity}</td>
                                                <td>{algo.execution_time_seconds}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        {result.recommendations.map((rec, index) => (
                            <div key={index} className="card w-full h-fit max-w-270 mt-2 shadow-md mb-6">
                                <div className="card-body bg-base-100 rounded-xl mx-4 lg:mx-0">
                                    <div className="flex flex-row items-center justify-start gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="text-primary"><g fill="none"><path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M9.107 5.448c.598-1.75 3.016-1.803 3.725-.159l.06.16l.807 2.36a4 4 0 0 0 2.276 2.411l.217.081l2.36.806c1.75.598 1.803 3.016.16 3.725l-.16.06l-2.36.807a4 4 0 0 0-2.412 2.276l-.081.216l-.806 2.361c-.598 1.75-3.016 1.803-3.724.16l-.062-.16l-.806-2.36a4 4 0 0 0-2.276-2.412l-.216-.081l-2.36-.806c-1.751-.598-1.804-3.016-.16-3.724l.16-.062l2.36-.806A4 4 0 0 0 8.22 8.025l.081-.216zM19 2a1 1 0 0 1 .898.56l.048.117l.35 1.026l1.027.35a1 1 0 0 1 .118 1.845l-.118.048l-1.026.35l-.35 1.027a1 1 0 0 1-1.845.117l-.048-.117l-.35-1.026l-1.027-.35a1 1 0 0 1-.118-1.845l.118-.048l1.026-.35l.35-1.027A1 1 0 0 1 19 2"/></g></svg>
                                        <h3 className="text-lg sm:text-xl font-semibold">AI Analysis</h3>
                                    </div>
                                    <div className="flex flex-col items-start justify-center bg-base-200 rounded-lg px-4 py-2.5">
                                        <h4 className="font-bold text-sm mb-1 sm:mb-0">Recommended Algorithm: {rec.recommendation}</h4>
                                        <p className="font-medium text-sm">{rec.insights}</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2 w-full h-full">
                                        <div className="flex flex-col items-start justify-start w-full bg-base-200 rounded-lg px-4 py-2.5">
                                            <h4 className="font-bold text-sm mb-1 sm:mb-0">Performance Tips</h4>
                                            <ul className="list-disc list-inside">
                                                {rec.performance_tips.map((tip, i) => (
                                                    <li key={i} className="font-medium text-sm">{tip}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="flex flex-col items-start justify-center w-full bg-base-200 rounded-lg px-4 py-2.5">
                                            <h4 className="font-bold text-sm mb-1 sm:mb-0">Trade-offs</h4>
                                            <ul className="list-disc list-inside">
                                                {rec.trade_offs.map((tradeoff, i) => (
                                                    <li key={i} className="font-medium text-sm">{tradeoff}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
export default Comparator