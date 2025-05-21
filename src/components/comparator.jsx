import {useContext, useState} from 'react'
import NavBar from "./navBar.jsx";
import axios from 'axios';
import {ErrorContext} from "../context/errorContext.jsx";

const Comparator = () => {
    const [formData, setFormData] = useState({
        category: null,
        input_size: null,
    });
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { setError } = useContext(ErrorContext);

    const comparatorMenu = [
        { label: 'Visualizer', path: '/visualizer' },
        { label: 'Comparator', path: '/comparator' },
        { label: 'Challenges', path: '/challenge' },
        { label: 'Code Library', path: '/library' },
        { label: 'Examples', path: '/example' }
    ];

    const categories = [
        'Sorting Algorithms',
        'Search Algorithms',
        'Graph Traversal',
        'Recursion Algorithms',
    ];

    const inputSizes = [
        'Small (n < 1000)',
        'Medium (1000 < n < 100000)',
        'Large (n > 100000)',
    ];

    const handleCategorySelect = (event) => {
        setFormData((prev) => ({
            ...prev,
            category: event.target.value, // Normalize for backend
        }));
    };

    const handleInputSizeSelect = (event) => {
        setFormData((prev) => ({
            ...prev,
            input_size: event.target.value,
        }));
    };

    const handleCompare = async () => {
        setResult(null);
        try {
            setIsLoading(true);
            if (!formData.input_size || !formData.category){
                setError('Select Category and Input Size.');
                return;
            }
            const response = await axios.post('https://algoverse-backend-python.onrender.com/compare', formData, {
                headers: { 'Content-Type': 'application/json' },
            });
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'An error occurred while fetching data.');
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <div className="scrollbar-hide overflow-auto h-screen bg-base-200">
            <NavBar menuItems={comparatorMenu} />
            <div className="flex flex-col items-center justify-center mt-8">
                <div className="card w-full h-fit max-w-270 shadow-md">
                    <div className="card-body mx-4 lg:mx-0 bg-base-300 rounded-xl">
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0">Algorithm Category</h3>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                            <select
                                defaultValue="Select Algorithm"
                                className="select border-neutral-content bg-base-300 rounded-lg w-full sm-w-auto sm:flex-1"
                                onChange={handleCategorySelect}
                            >
                                <option disabled={true}>Select Algorithm</option>
                                <option>Sorting Algorithms</option>
                                <option>Search Algorithms</option>
                                <option>Graph Traversal</option>
                                <option>Recursion</option>
                            </select>
                            <select
                                defaultValue="Input Size Range"
                                className="select border-neutral-content bg-base-300 rounded-lg w-full sm-w-auto sm:flex-1"
                                onChange={handleInputSizeSelect}
                            >
                                <option disabled={true}>Input Size Range</option>
                                <option>Small (n &lt; 1000)</option>
                                <option>Medium (1000 &lt; n &lt; 100000)</option>
                                <option>Large (n &gt; 100000)</option>
                            </select>
                            <button onClick={handleCompare} disabled={isLoading} className="btn rounded-lg w-full sm-w-auto sm:flex-1">Compare Algorithms</button>
                        </div>
                    </div>
                </div>



                {!result ? (
                    <div className="card w-full h-fit max-w-270 mt-2 shadow-md">
                        <div className="card-body bg-base-300 rounded-xl h-fit mx-4 lg:mx-0">
                            <div className="flex flex-col items-center justify-between">
                                {isLoading ? (
                                    <span className="loading loading-infinity loading-xl"></span>
                                ):(
                                    <div className="flex flex-col items-center justify-between">
                                        <svg className="mb-2" xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 512 512"><path fill="currentColor" d="M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64v336c0 44.2 35.8 80 80 80h400c17.7 0 32-14.3 32-32s-14.3-32-32-32H80c-8.8 0-16-7.2-16-16zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l89.4-89.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z"/></svg>
                                        <div className="text-lg mb-2">No Comparison Results Yet</div>
                                        <p className="text-sm mb-6 text-center">Select algorithm categories and input size range above to start comparing algorithms.</p>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                            <div className="flex flex-row items-center justify-center px-4 py-2 bg-accent-content rounded-lg gap-2 w-full sm:w-auto">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="17.5" height="14" viewBox="0 0 640 512"><path fill="currentColor" d="M32 64c17.7 0 32 14.3 32 32v320c0 17.7-14.3 32-32 32S0 433.7 0 416V96c0-17.7 14.3-32 32-32m214.6 73.4c12.5 12.5 12.5 32.8 0 45.3L205.3 224h229.5l-41.4-41.4c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l96 96c12.5 12.5 12.5 32.8 0 45.3l-96 96c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l41.3-41.3H205.2l41.4 41.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0l-96-96c-12.5-12.5-12.5-32.8 0-45.3l96-96c12.5-12.5 32.8-12.5 45.3 0M640 96v320c0 17.7-14.3 32-32 32s-32-14.3-32-32V96c0-17.7 14.3-32 32-32s32 14.3 32 32"/></svg>
                                                <div>Compare Performance</div>
                                            </div>
                                            <div className="flex flex-row items-center justify-center px-4 py-2 bg-accent-content rounded-lg gap-2 w-full sm:w-auto">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10.5" height="14" viewBox="0 0 384 512"><path fill="currentColor" d="M272 384c9.6-31.9 29.5-59.1 49.2-86.2c5.2-7.1 10.4-14.2 15.4-21.4c19.8-28.5 31.4-63 31.4-100.3C368 78.8 289.2 0 192 0S16 78.8 16 176c0 37.3 11.6 71.9 31.4 100.3c5 7.2 10.2 14.3 15.4 21.4c19.8 27.1 39.7 54.4 49.2 86.2h160zm-80 128c44.2 0 80-35.8 80-80v-16H112v16c0 44.2 35.8 80 80 80m-80-336c0 8.8-7.2 16-16 16s-16-7.2-16-16c0-61.9 50.1-112 112-112c8.8 0 16 7.2 16 16s-7.2 16-16 16c-44.2 0-80 35.8-80 80"/></svg>
                                                <div>Get AI Insights</div>
                                            </div>
                                            <div className="flex flex-row items-center justify-center px-4 py-2 bg-accent-content rounded-lg gap-2 w-full sm:w-auto">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="17.5" height="14" viewBox="0 0 640 512"><path fill="currentColor" d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6m80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3l89.3 89.4l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3"/></svg>
                                                <div>View Implementation</div>
                                            </div>
                                        </div>
                                    </div>
                                    )}
                            </div>
                        </div>
                    </div>
                ):(
                    <div className="flex flex-col items-center justify-center w-full">
                        <div className="card w-full h-fit max-w-270 mt-2 shadow-md">
                            <div className="card-body bg-base-300 rounded-xl mx-4 lg:mx-0">
                                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0">Algorithm Comparison</h3>
                                <div className="overflow-x-auto">
                                    <table className="table">
                                        {/* head */}
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
                            <div key={index} className="card w-full h-fit max-w-270 mt-2 shadow-md">
                                <div className="card-body bg-base-300 rounded-xl mx-4 lg:mx-0">
                                    <div className="flex flex-row items-center justify-start gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none"><path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M9.107 5.448c.598-1.75 3.016-1.803 3.725-.159l.06.16l.807 2.36a4 4 0 0 0 2.276 2.411l.217.081l2.36.806c1.75.598 1.803 3.016.16 3.725l-.16.06l-2.36.807a4 4 0 0 0-2.412 2.276l-.081.216l-.806 2.361c-.598 1.75-3.016 1.803-3.724.16l-.062-.16l-.806-2.36a4 4 0 0 0-2.276-2.412l-.216-.081l-2.36-.806c-1.751-.598-1.804-3.016-.16-3.724l.16-.062l2.36-.806A4 4 0 0 0 8.22 8.025l.081-.216zM19 2a1 1 0 0 1 .898.56l.048.117l.35 1.026l1.027.35a1 1 0 0 1 .118 1.845l-.118.048l-1.026.35l-.35 1.027a1 1 0 0 1-1.845.117l-.048-.117l-.35-1.026l-1.027-.35a1 1 0 0 1-.118-1.845l.118-.048l1.026-.35l.35-1.027A1 1 0 0 1 19 2"/></g></svg>
                                        <h3 className="text-lg sm:text-xl font-semibold">AI Analysis</h3>
                                    </div>

                                    <div className="flex flex-col items-start justify-center bg-base-100 rounded-lg px-4 py-2.5">
                                        <h4 className="font-bold text-sm mb-1 sm:mb-0">Recommended Algorithm: {rec.recommendation}</h4>
                                        <p className="font-medium text-sm">{rec.insights}</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2 w-full h-full">
                                        <div className="flex flex-col items-start justify-start w-full bg-base-100 rounded-lg px-4 py-2.5">
                                            <h4 className="font-bold text-sm mb-1 sm:mb-0">Performance Tips</h4>
                                            <ul className="list-disc list-inside">
                                                {rec.performance_tips.map((tip, i) => (
                                                    <li key={i} className="font-medium text-sm">{tip}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="flex flex-col items-start justify-center w-full bg-base-100 rounded-lg px-4 py-2.5">
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
