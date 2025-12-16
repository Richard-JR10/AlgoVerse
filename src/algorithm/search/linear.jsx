import { useEffect, useRef, useState } from 'react';
import NavBar from "../../components/navBar.jsx";
import axios from "axios";
import AlgorithmNavbar from "../algorithmNavbar.jsx";
import {useSound} from "../../context/soundContext.jsx";
import * as Tone from "tone";
import SoundToggle from "../../components/utils/soundToggle.jsx";

const Linear = () => {
    const [inputValue, setInputValue] = useState("");
    const [data, setData] = useState([]);
    const [size, setSize] = useState(10);
    const [searchValue, setSearchValue] = useState("");
    const [error, setError] = useState(null);
    const [speed, setSpeed] = useState(500);
    const [isSearching, setIsSearching] = useState(false);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step controls
    const [searchSteps, setSearchSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [isAnimating, setIsAnimating] = useState(false);
    const initialArrayRef = useRef([]);

    // Complexity display
    const [showComplexity, setShowComplexity] = useState(false);
    const [executionTime, setExecutionTime] = useState(null);
    const synthRef = useRef(null);
    const { soundEnabled } = useSound();
    const soundRef = useRef(soundEnabled);

    // Visualization states
    const [highlightedIndex, setHighlightedIndex] = useState(null);
    const [searchResult, setSearchResult] = useState(null);

    const isInitializedRef = useRef(false);

    useEffect(() => {
        soundRef.current = soundEnabled;
    }, [soundEnabled]);

    useEffect(() => {
        synthRef.current = new Tone.Synth().toDestination();
        return () => {
            if (synthRef.current) synthRef.current.dispose();
        };
    }, []);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    function generateRandomArray(size) {
        const sizeInput = Number(size);
        if (!Number.isInteger(sizeInput) || sizeInput < 0) {
            setError("Size must be a non-negative integer");
            return [];
        }
        return Array(sizeInput).fill(0).map(() => Math.floor(Math.random() * 100));
    }

    const handleRandom = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting || isAnimating) return;

        const randomArray = generateRandomArray(size);
        setData(randomArray);
        initialArrayRef.current = [...randomArray];
        setSearchSteps([]);
        setCurrentStepIndex(-1);
        setHighlightedIndex(null);
        setSearchResult(null);
    };

    const handleSize = (e) => {
        if (e) e.preventDefault();
        if (e.target.value > 50) {
            setError("Maximum size is 50.");
            return;
        }
        if (e.target.value < 0) {
            setError("Minimum size is 0.");
            return;
        }
        setSize(e.target.value);
    }

    const handleInputChange = (e) => {
        e.preventDefault();
        setInputValue(e.target.value);
    };

    const handleTargetInput = (e) => {
        e.preventDefault();
        setSearchValue(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting || isAnimating) return;

        isCancelledRef.current = false;
        const inputArray = inputValue.split(",").map(item => parseInt(item.trim())).filter(item => !isNaN(item));
        setData(inputArray);
        initialArrayRef.current = [...inputArray];
        setSearchSteps([]);
        setCurrentStepIndex(-1);
        setHighlightedIndex(null);
        setSearchResult(null);
    };

    const executeStep = (step) => {
        if (step.type === "checking") {
            setHighlightedIndex(step.index);
            if (soundRef.current) synthRef.current.triggerAttackRelease('E4', '16n');
            setSearchResult(null);
        } else if (step.type === "found") {
            setHighlightedIndex(step.index);
            if (soundRef.current) synthRef.current.triggerAttackRelease('C5', '32n');
            setSearchResult({ found: true, index: step.index });
        } else if (step.type === "not_found") {
            setHighlightedIndex(null);
            if (soundRef.current) synthRef.current.triggerAttackRelease('C4', '16n');
            setSearchResult({ found: false });
        }
    };

    const stepForward = async () => {
        if (isAnimating || currentStepIndex >= searchSteps.length - 1 || searchSteps.length === 0) return;
        await Tone.start();
        setIsAnimating(true);
        const nextStepIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextStepIndex);
        executeStep(searchSteps[nextStepIndex]);
        await new Promise(resolve => setTimeout(resolve, speedRef.current));
        setIsAnimating(false);
    };

    const stepBackward = async () => {
        if (isAnimating || currentStepIndex <= -1 || searchSteps.length === 0) return;

        setIsAnimating(true);
        const prevStepIndex = currentStepIndex - 1;
        setCurrentStepIndex(prevStepIndex);

        if (prevStepIndex === -1) {
            setHighlightedIndex(null);
            setSearchResult(null);
            setIsAnimating(false);
            return;
        }

        const prevStep = searchSteps[prevStepIndex];
        executeStep(prevStep);
        setIsAnimating(false);
    };

    const startSearching = async () => {
        try {
            await Tone.start();
            setIsSearching(true);
            setIsAnimating(true);
            isCancelledRef.current = false;
            setCurrentStepIndex(-1);
            setHighlightedIndex(null);
            setSearchResult(null);

            let arrayToSearch;
            if (Array.isArray(data) && data.length > 0) {
                arrayToSearch = data;
            } else {
                setError("Please enter or generate an array first");
                setIsSearching(false);
                setIsAnimating(false);
                return;
            }

            if (!searchValue || searchValue === "") {
                setError("Please enter a search value");
                setIsSearching(false);
                setIsAnimating(false);
                return;
            }

            const startTime = performance.now();

            const response = await axios.post('https://algoverse-backend-python.onrender.com/search/linear', {
                array: arrayToSearch,
                value: parseInt(searchValue)
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const endTime = performance.now();
            setExecutionTime((endTime - startTime) / 1000);

            if (response.data && response.data.steps) {
                setSearchSteps(response.data.steps);
                await animateSearchSteps(response.data.steps);
                setCurrentStepIndex(response.data.steps.length - 1);
            } else {
                setError("Received unexpected response format from server");
            }
        } catch (err) {
            console.error("Error during search:", err);
            setError(err.response?.data?.error || 'Failed to process search request');
        } finally {
            setIsSearching(false);
            setIsAnimating(false);
        }
    };

    const animateSearchSteps = async (steps) => {
        setIsAnimating(true);
        for (let i = 0; i < steps.length; i++) {
            if (isCancelledRef.current) break;
            setCurrentStepIndex(i);
            const step = steps[i];

            executeStep(step);
            await new Promise(resolve => setTimeout(resolve, speedRef.current));
        }
        setIsAnimating(false);
    };

    useEffect(() => {
        const initializeVisualization = async () => {
            if (!isInitializedRef.current) {
                isInitializedRef.current = true;
                const initialArray = generateRandomArray(size);
                setData(initialArray);
                initialArrayRef.current = [...initialArray];
            }
        };

        const timer = setTimeout(initializeVisualization, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    const getCurrentStep = () => {
        if (currentStepIndex >= 0 && currentStepIndex < searchSteps.length) {
            return searchSteps[currentStepIndex];
        }
        return null;
    };

    const currentStep = getCurrentStep();

    return (
        <div className="flex flex-col scrollbar-hide overflow-auto h-screen bg-base-200 relative">
            <NavBar/>
            <AlgorithmNavbar/>

            {/* Complexity Information Panel */}
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="collapse collapse-arrow bg-base-100 shadow-md border border-base-300 rounded-2xl overflow-hidden">
                        <input
                            type="checkbox"
                            checked={showComplexity}
                            onChange={(e) => setShowComplexity(e.target.checked)}
                        />
                        <div className="collapse-title text-xl font-bold flex items-center justify-between bg-base-200/50 border-b border-base-300">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M20 12a2 2 0 0 0-.703.133l-2.398-1.963c.059-.214.101-.436.101-.67C17 8.114 15.886 7 14.5 7S12 8.114 12 9.5c0 .396.1.765.262 1.097l-2.909 3.438A2 2 0 0 0 9 14c-.179 0-.348.03-.512.074l-2.563-2.563C5.97 11.348 6 11.179 6 11c0-1.108-.892-2-2-2s-2 .892-2 2s.892 2 2 2c.179 0 .348-.03.512-.074l2.563 2.563A2 2 0 0 0 7 16c0 1.108.892 2 2 2s2-.892 2-2c0-.237-.048-.46-.123-.671l2.913-3.442c.227.066.462.113.71.113a2.5 2.5 0 0 0 1.133-.281l2.399 1.963A2 2 0 0 0 18 14c0 1.108.892 2 2 2s2-.892 2-2s-.892-2-2-2" />
                                    </svg>
                                </div>
                                <span className="text-primary">
                                   Algorithm Performance Analysis
                               </span>
                            </div>
                        </div>
                        <div className="collapse-content bg-base-50">
                            <div className="pt-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Theoretical Complexity */}
                                    <div className="card bg-base-100 border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
                                        <div className="card-body p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                                    <span className="text-white text-sm font-bold">T</span>
                                                </div>
                                                <h3 className="card-title text-primary text-lg">Theoretical Complexity</h3>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                    <span className="font-semibold text-base-content/80">Time Complexity:</span>
                                                    <div className="badge badge-primary badge-lg font-mono font-bold">O(n)</div>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                    <span className="font-semibold text-base-content/80">Space Complexity:</span>
                                                    <div className="badge badge-primary badge-outline badge-lg font-mono font-bold">O(1)</div>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-4 bg-info/10 rounded-xl border-l-4 border-info">
                                                <p className="text-sm text-base-content/80 leading-relaxed">
                                                    Linear search checks each element in a sequence one by one until a match is found or the end is reached,
                                                    resulting in linear time complexity with constant space usage.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Execution Time */}
                                    <div className="card bg-base-100 border border-secondary/20 shadow-lg hover:shadow-xl transition-all duration-300">
                                        <div className="card-body p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                                                    <span className="text-white text-sm font-bold">⚡</span>
                                                </div>
                                                <h3 className="card-title text-secondary text-lg">Execution Metrics</h3>
                                            </div>

                                            {executionTime !== null ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-xl border border-secondary/10">
                                                        <span className="font-semibold text-base-content/80">Execution Time:</span>
                                                        <div className="badge badge-secondary badge-lg font-mono font-bold">
                                                            {executionTime.toFixed(3)}s
                                                        </div>
                                                    </div>
                                                    <div className="stats stats-vertical bg-success/5 rounded-xl border border-success/20">
                                                        <div className="stat p-4">
                                                            <div className="stat-title text-xs">Performance</div>
                                                            <div className="stat-value text-lg text-success">
                                                                {executionTime < 0.001 ? 'Excellent' : executionTime < 0.01 ? 'Good' : 'Fair'}
                                                            </div>
                                                            <div className="stat-desc text-xs">
                                                                {executionTime < 0.001 ? '< 1ms execution' : `${(executionTime * 1000).toFixed(1)}ms`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-full">
                                                    <div className="flex flex-col h-full items-center justify-center p-8 bg-neutral/5 rounded-xl border-2 border-dashed border-base-300">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="w-12 h-12 rounded-full bg-neutral/10 flex items-center justify-center mb-3">
                                                                <span className="text-2xl">⏱️</span>
                                                            </div>
                                                            <p className="flex-1 text-sm text-base-content/60 text-center">
                                                                Run a search operation to see<br />detailed execution metrics
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visualization Area */}
            <div className="flex-grow flex flex-col items-center justify-start mt-6 px-4 overflow-auto">
                {currentStep && (
                    <div className="mb-4">
                        <div className="badge badge-primary badge-lg">
                            {currentStep.type === "checking"
                                ? `Checking index ${currentStep.index}: value = ${data[currentStep.index]}`
                                : currentStep.type === "found"
                                    ? `Found ${searchValue} at index ${currentStep.index}!`
                                    : `Value ${searchValue} not found in array`
                            }
                        </div>
                    </div>
                )}

                {/* Array Visualization */}
                <div className="w-full max-w-6xl mb-6">
                    <h3 className="text-lg font-bold mb-3 text-center">Array</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                        {data.map((num, idx) => {
                            const isHighlighted = highlightedIndex === idx;
                            const isFound = searchResult?.found && searchResult?.index === idx;

                            let bgColor = 'bg-purple-100';
                            let borderColor = 'border-purple-300';

                            if (isFound) {
                                bgColor = 'bg-green-300';
                                borderColor = 'border-green-500';
                            } else if (isHighlighted) {
                                bgColor = 'bg-yellow-300';
                                borderColor = 'border-yellow-500';
                            }

                            return (
                                <div
                                    key={idx}
                                    className={`
                                        w-16 h-16 flex flex-col items-center justify-center 
                                        rounded-lg border-2 font-bold text-lg transition-all duration-300
                                        ${bgColor} ${borderColor}
                                        ${isHighlighted || isFound ? 'scale-110 shadow-lg' : ''}
                                    `}
                                >
                                    <span className="text-xl text-black">{num}</span>
                                    <span className="text-xs text-gray-600 mt-1">idx: {idx}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Search Result Display */}
                {searchResult !== null && (
                    <div className="mb-6">
                        {searchResult.found ? (
                            <div className="alert alert-success shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Target found at index {searchResult.index}!</span>
                            </div>
                        ) : (
                            <div className="alert alert-error shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Target not found in array</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-4 justify-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-yellow-300 border-2 border-yellow-500 rounded"></div>
                        <span className="text-sm">Current Position</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-300 border-2 border-green-500 rounded"></div>
                        <span className="text-sm">Found</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 border-2 border-purple-300 rounded"></div>
                        <span className="text-sm">Unvisited</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center mb-4 px-4 sm:px-6 lg:px-8 mt-6">
                <div className="flex flex-col xl:flex-row justify-center items-center gap-3 sm:gap-4 w-full xl:w-auto">
                    <div className="flex items-center gap-2 w-full mr-2 xl:w-auto">
                        <span className="text-xs font-semibold">SPEED:</span>
                        <input
                            type="range"
                            min={50}
                            max="1000"
                            value={speed}
                            className="range range-primary range-xs w-full xl:w-32"
                            onChange={(e) => setSpeed(Number(e.target.value))}
                        />
                        <span className="text-xs text-base-content/70 whitespace-nowrap w-12">{speed} ms</span>
                    </div>

                    <div className="flex flex-row items-center gap-1 w-full min-w-3xs">
                        <div className="font-semibold text-sm">Target:</div>
                        <div className="join w-full">
                            <input
                                value={searchValue}
                                onChange={handleTargetInput}
                                className="input join-item w-full"
                                type="number"
                                placeholder="e.g., 1"
                            />
                            <button
                                className="btn btn-primary join-item"
                                onClick={startSearching}
                                disabled={isSubmitting || isAnimating || !searchValue}
                            >
                                Search
                            </button>
                        </div>
                    </div>

                    {/* Step Navigation Buttons */}
                    <div className="flex flex-row gap-2 md:gap-4 items-center justify-center w-full">
                        <button
                            className={`btn btn-accent btn-sm lg:btn-md flex-1 lg:w-auto ${
                                isAnimating || currentStepIndex <= -1 || searchSteps.length === 0 ? 'btn-disabled' : ''
                            }`}
                            onClick={stepBackward}
                            disabled={isAnimating || currentStepIndex <= -1 || searchSteps.length === 0}
                            aria-label="Step backward"
                        >
                            Step Backward
                        </button>
                        <button
                            className={`btn btn-accent btn-sm lg:btn-md flex-1 lg:w-auto ${
                                isAnimating || currentStepIndex >= searchSteps.length - 1 || searchSteps.length === 0 ? 'btn-disabled' : ''
                            }`}
                            onClick={stepForward}
                            disabled={isAnimating || currentStepIndex >= searchSteps.length - 1 || searchSteps.length === 0}
                            aria-label="Step forward"
                        >
                            Step Forward
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 md:gap-4 items-center justify-center w-full">
                        <div className="flex flex-row items-center gap-1 w-full min-w-3xs">
                            <div className="font-semibold text-sm">Array:</div>
                            <div className="join w-full">
                                <input
                                    className="input join-item w-full"
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 5, 3, 8"
                                />
                                <button className="btn btn-secondary join-item" onClick={handleSubmit}>
                                    GO
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-row items-center gap-1 w-full md:w-auto">
                            <div className="font-semibold text-sm">Size:</div>
                            <div className="join w-full">
                                <input
                                    type="number"
                                    className="input join-item md:w-13 w-full"
                                    value={size}
                                    onChange={handleSize}
                                    placeholder="Size"
                                />
                                <button
                                    className="btn btn-primary join-item"
                                    onClick={handleRandom}
                                    disabled={isAnimating}
                                >
                                    Random
                                </button>
                            </div>
                        </div>
                        <SoundToggle/>
                    </div>
                </div>
            </div>

            {error && (
                <div className="fixed left-0 right-0 top-35 flex justify-center z-20">
                    <div className="alert alert-error rounded-md flex flex-row items-center justify-between max-w-md">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">×</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Linear;