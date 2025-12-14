import {useState, useEffect, useRef} from 'react';
import NavBar from "../../components/navBar.jsx";
import AlgorithmNavbar from "../algorithmNavbar.jsx";

const InterpolationSearch = () => {
    const [inputValue, setInputValue] = useState("");
    const [numberArr, setNumberArr] = useState([]);
    const [targetValue, setTargetValue] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [isAnimating, setIsAnimating] = useState(false);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);
    const [size, setSize] = useState(10);
    const initialArrayRef = useRef([]);
    const [showComplexity, setShowComplexity] = useState(false);
    const [executionTime, setExecutionTime] = useState(null);
    const [highlightedIndices, setHighlightedIndices] = useState([]);
    const [searchRange, setSearchRange] = useState(null);
    const [searchResult, setSearchResult] = useState(null);
    const [probePosition, setProbePosition] = useState(null);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleInput = (e) => {
        e.preventDefault();
        setInputValue(e.target.value);
    };

    const handleTargetInput = (e) => {
        e.preventDefault();
        setTargetValue(e.target.value);
    };

    const handleSizeInput = (e) => {
        e.preventDefault();
        if (e.target.value > 50) {
            setError("Maximum size is 50.");
            return;
        }
        if (e.target.value < 0) {
            setError("Minimum size is 0.");
            return;
        }
        setSize(e.target.value);
    };

    // Interpolation Search implementation
    const interpolationSearch = (arr, target) => {
        const steps = [];
        const n = arr.length;

        if (n === 0) {
            steps.push({
                type: "not_found",
                array: [...arr],
                indices: [],
                target: target,
                message: `Array is empty`
            });
            return steps;
        }

        let low = 0;
        let high = n - 1;

        steps.push({
            type: "start",
            array: [...arr],
            range: {low, high},
            target: target,
            message: `Starting search for ${target} in range [${low}...${high}]`
        });

        while (low <= high && target >= arr[low] && target <= arr[high]) {
            // If the range has converged to one element
            if (low === high) {
                steps.push({
                    type: "check",
                    array: [...arr],
                    indices: [low],
                    range: {low, high},
                    target: target,
                    message: `Checking single element at index ${low}: arr[${low}] = ${arr[low]}`
                });

                if (arr[low] === target) {
                    steps.push({
                        type: "found",
                        array: [...arr],
                        indices: [low],
                        foundIndex: low,
                        target: target,
                        message: `Target ${target} found at index ${low}!`
                    });
                    return steps;
                }
                break;
            }

            // Calculate probe position using interpolation formula
            const pos = low + Math.floor(
                ((target - arr[low]) * (high - low)) / (arr[high] - arr[low])
            );

            steps.push({
                type: "interpolate",
                array: [...arr],
                indices: [pos],
                range: {low, high},
                probePos: pos,
                target: target,
                message: `Interpolated position: ${pos}, arr[${pos}] = ${arr[pos]}`
            });

            // Target found
            if (arr[pos] === target) {
                steps.push({
                    type: "found",
                    array: [...arr],
                    indices: [pos],
                    foundIndex: pos,
                    target: target,
                    message: `Target ${target} found at index ${pos}!`
                });
                return steps;
            }

            // If target is larger, search in right subarray
            if (arr[pos] < target) {
                steps.push({
                    type: "narrow_right",
                    array: [...arr],
                    indices: [pos],
                    range: {low: pos + 1, high},
                    target: target,
                    message: `arr[${pos}] = ${arr[pos]} < ${target}, search right: [${pos + 1}...${high}]`
                });
                low = pos + 1;
            }
            // If target is smaller, search in left subarray
            else {
                steps.push({
                    type: "narrow_left",
                    array: [...arr],
                    indices: [pos],
                    range: {low, high: pos - 1},
                    target: target,
                    message: `arr[${pos}] = ${arr[pos]} > ${target}, search left: [${low}...${pos - 1}]`
                });
                high = pos - 1;
            }
        }

        steps.push({
            type: "not_found",
            array: [...arr],
            indices: [],
            target: target,
            message: `Target ${target} not found in array`
        });

        return steps;
    };

    const animateSearch = async (input, target) => {
        try {
            setIsAnimating(true);
            const stringArray = input;
            if (stringArray.length === 0) {
                setError("Please enter at least one number");
                return;
            }
            const numArray = stringArray.map((numStr, index) => {
                const num = parseInt(numStr, 10);
                if (isNaN(num)) {
                    setError(`Invalid number at position ${index + 1}: "${numStr}"`);
                    return;
                }
                return num;
            });

            if (numArray.some(n => n === undefined)) {
                setIsAnimating(false);
                return;
            }

            const targetNum = parseInt(target, 10);
            if (isNaN(targetNum)) {
                setError("Please enter a valid target number");
                setIsAnimating(false);
                return;
            }

            // Sort the array for interpolation search
            const sortedArray = [...numArray].sort((a, b) => a - b);

            setError(null);
            setIsSubmitting(true);
            if (isSearching || isAnimating) {
                isCancelledRef.current = true;
                setIsSearching(false);
            }

            setNumberArr(sortedArray);
            initialArrayRef.current = [...sortedArray];
            setCurrentStepIndex(-1);
            setHighlightedIndices([]);
            setSearchRange(null);
            setSearchResult(null);
            setProbePosition(null);

            const startTime = performance.now();
            const searchSteps = interpolationSearch(sortedArray, targetNum);
            const endTime = performance.now();

            setSteps(searchSteps);
            setExecutionTime((endTime - startTime) / 1000);
            setIsSubmitting(false);
            isCancelledRef.current = false;
            setIsAnimating(false);
        } catch (err) {
            setError(err.message || 'Failed to process');
            setNumberArr([]);
            setIsSubmitting(false);
            isCancelledRef.current = false;
            setIsAnimating(false);
        }
    };

    function generateRandomArray(size) {
        const sizeInput = Number(size);
        if (!Number.isInteger(sizeInput) || sizeInput < 0) {
            setError("Size must be a non-negative integer");
            return;
        }
        const randomArray = Array(sizeInput).fill(0).map(() => Math.floor(Math.random() * 100));
        return randomArray.sort((a, b) => a - b);
    }

    const handleRandom = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting || isAnimating) return;

        const input = generateRandomArray(size);
        setNumberArr(input);
        initialArrayRef.current = [...input];
        setSteps([]);
        setCurrentStepIndex(-1);
        setHighlightedIndices([]);
        setSearchRange(null);
        setSearchResult(null);
        setProbePosition(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || isAnimating) return;
        const input = inputValue.split(",").map(item => item.trim()).filter(Boolean);
        await animateSearch(input, targetValue);
    };

    const isInitializedRef = useRef(false);

    useEffect(() => {
        const initializeVisualization = async () => {
            if (!isInitializedRef.current) {
                isInitializedRef.current = true;
                await handleRandom();
            }
        };

        const timer = setTimeout(initializeVisualization, 100);
        return () => clearTimeout(timer);
    }, []);

    const animateSingleStep = async (step, isForward = true) => {
        setIsAnimating(true);

        setNumberArr([...step.array]);
        setHighlightedIndices(step.indices || []);
        setSearchRange(step.range || null);
        setProbePosition(step.probePos !== undefined ? step.probePos : null);

        if (step.type === "found") {
            setSearchResult({found: true, index: step.foundIndex});
        } else if (step.type === "not_found") {
            setSearchResult({found: false});
        }

        await new Promise(resolve => setTimeout(resolve, speedRef.current));
        setIsAnimating(false);
    };

    const handleStepForward = async () => {
        if (isAnimating || currentStepIndex >= steps.length - 1 || steps.length === 0) return;

        const nextStepIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextStepIndex);
        await animateSingleStep(steps[nextStepIndex], true);
    };

    const handleStepBackward = async () => {
        if (isAnimating || currentStepIndex <= -1 || steps.length === 0) return;

        setIsAnimating(true);
        const prevStepIndex = currentStepIndex - 1;
        setCurrentStepIndex(prevStepIndex);

        if (prevStepIndex === -1) {
            setNumberArr([...initialArrayRef.current]);
            setHighlightedIndices([]);
            setSearchRange(null);
            setSearchResult(null);
            setProbePosition(null);
            setIsAnimating(false);
            return;
        }

        const prevStep = steps[prevStepIndex];
        setNumberArr([...prevStep.array]);
        setHighlightedIndices(prevStep.indices || []);
        setSearchRange(prevStep.range || null);
        setProbePosition(prevStep.probePos !== undefined ? prevStep.probePos : null);

        if (prevStep.type === "found") {
            setSearchResult({found: true, index: prevStep.foundIndex});
        } else if (prevStep.type === "not_found") {
            setSearchResult({found: false});
        } else {
            setSearchResult(null);
        }

        setIsAnimating(false);
    };

    const startSearching = async () => {
        if (numberArr.length > 0 && !isSearching && !isAnimating && targetValue) {
            setIsSearching(true);
            setIsAnimating(true);
            isCancelledRef.current = false;
            try {
                setCurrentStepIndex(-1);
                setNumberArr([...initialArrayRef.current]);
                setHighlightedIndices([]);
                setSearchRange(null);
                setSearchResult(null);
                setProbePosition(null);

                const targetNum = parseInt(targetValue, 10);
                if (isNaN(targetNum)) {
                    setError("Please enter a valid target number");
                    setIsSearching(false);
                    setIsAnimating(false);
                    return;
                }

                const startTime = performance.now();
                const searchSteps = interpolationSearch(initialArrayRef.current, targetNum);
                const endTime = performance.now();

                setExecutionTime((endTime - startTime) / 1000);
                setSteps(searchSteps);
                await animateSearchSteps(searchSteps);
                setCurrentStepIndex(searchSteps.length - 1);
            } catch (err) {
                setError(err.message || 'Failed to process');
            }
            setIsSearching(false);
            setIsAnimating(false);
            isCancelledRef.current = false;
        }
    };

    const animateSearchSteps = async (steps) => {
        setIsAnimating(true);
        for (let i = 0; i < steps.length; i++) {
            if (isCancelledRef.current) break;
            setCurrentStepIndex(i);
            const step = steps[i];

            setNumberArr([...step.array]);
            setHighlightedIndices(step.indices || []);
            setSearchRange(step.range || null);
            setProbePosition(step.probePos !== undefined ? step.probePos : null);

            if (step.type === "found") {
                setSearchResult({found: true, index: step.foundIndex});
            } else if (step.type === "not_found") {
                setSearchResult({found: false});
            }

            await new Promise(resolve => setTimeout(resolve, speedRef.current));
        }
        setIsAnimating(false);
    };

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    const getCurrentStep = () => {
        if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
            return steps[currentStepIndex];
        }
        return null;
    };

    const currentStep = getCurrentStep();

    return (
        <div className="flex flex-col scrollbar-hide overflow-auto h-screen bg-base-200 relative">
            <NavBar/>
            <AlgorithmNavbar/>

            {/* Complexity Information Panel */}
            <div className="w-full px-4 sm:px-6 lg:px-8 mt-4">
                <div className="max-w-7xl mx-auto">
                    <div className="collapse collapse-arrow bg-base-100 shadow-xl border border-base-300 rounded-2xl overflow-hidden">
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
                                                    <span className="font-semibold text-base-content/80">Average Time:</span>
                                                    <div className="badge badge-primary badge-lg font-mono font-bold">O(log log n)</div>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-warning/5 rounded-xl border border-warning/10">
                                                    <span className="font-semibold text-base-content/80">Worst Time:</span>
                                                    <div className="badge badge-warning badge-lg font-mono font-bold">O(n)</div>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                    <span className="font-semibold text-base-content/80">Space Complexity:</span>
                                                    <div className="badge badge-primary badge-outline badge-lg font-mono font-bold">O(1)</div>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-4 bg-info/10 rounded-xl border-l-4 border-info">
                                                <p className="text-sm text-base-content/80 leading-relaxed">
                                                    Interpolation Search works on sorted arrays with uniformly distributed values.
                                                    It estimates the position of the target using interpolation formula, achieving
                                                    O(log log n) for uniform distributions but degrades to O(n) for non-uniform data.
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
                            {currentStep.message}
                        </div>
                    </div>
                )}

                {/* Array Visualization */}
                <div className="w-full max-w-6xl mb-6">
                    <h3 className="text-lg font-bold mb-3 text-center">Sorted Array (Interpolation Search requires sorted data)</h3>
                    {searchRange && (
                        <div className="text-center mb-3">
                            <div className="inline-flex items-center gap-2 bg-base-100 px-4 py-2 rounded-lg shadow-md border border-base-300">
                                <span className="font-semibold">Search Range:</span>
                                <span className="badge badge-info">low = {searchRange.low}</span>
                                <span>to</span>
                                <span className="badge badge-info">high = {searchRange.high}</span>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-wrap justify-center gap-2">
                        {numberArr.map((num, idx) => {
                            const isHighlighted = highlightedIndices.includes(idx);
                            const isInRange = searchRange && idx >= searchRange.low && idx <= searchRange.high;
                            const isProbe = probePosition === idx;
                            const isFound = searchResult?.found && searchResult?.index === idx;
                            const isLow = searchRange && idx === searchRange.low;
                            const isHigh = searchRange && idx === searchRange.high;

                            let bgColor = 'bg-purple-100';
                            let borderColor = 'border-purple-300';
                            let extraLabel = '';

                            if (isFound) {
                                bgColor = 'bg-green-300';
                                borderColor = 'border-green-500';
                            } else if (isProbe) {
                                bgColor = 'bg-orange-300';
                                borderColor = 'border-orange-500';
                                extraLabel = '🎯';
                            } else if (isLow) {
                                bgColor = 'bg-cyan-300';
                                borderColor = 'border-cyan-500';
                                extraLabel = 'L';
                            } else if (isHigh) {
                                bgColor = 'bg-indigo-300';
                                borderColor = 'border-indigo-500';
                                extraLabel = 'H';
                            } else if (isHighlighted) {
                                bgColor = 'bg-yellow-300';
                                borderColor = 'border-yellow-500';
                            } else if (isInRange) {
                                bgColor = 'bg-blue-200';
                                borderColor = 'border-blue-400';
                            }

                            return (
                                <div
                                    key={idx}
                                    className={`
                                        w-16 h-16 flex flex-col items-center justify-center 
                                        rounded-lg border-2 font-bold text-lg transition-all duration-300 relative
                                        ${bgColor} ${borderColor}
                                        ${isHighlighted || isFound || isProbe || isLow || isHigh ? 'scale-110 shadow-lg' : ''}
                                    `}
                                >
                                    {extraLabel && (
                                        <span className="absolute -top-2 -right-2 text-xs bg-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-current font-bold shadow-sm">
                                            {extraLabel}
                                        </span>
                                    )}
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
                        <div className="w-8 h-8 bg-cyan-300 border-2 border-cyan-500 rounded relative">
                            <span className="absolute -top-1 -right-1 text-xs bg-white rounded-full w-4 h-4 flex items-center justify-center border border-current font-bold">L</span>
                        </div>
                        <span className="text-sm">Low Index</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-300 border-2 border-indigo-500 rounded relative">
                            <span className="absolute -top-1 -right-1 text-xs bg-white rounded-full w-4 h-4 flex items-center justify-center border border-current font-bold">H</span>
                        </div>
                        <span className="text-sm">High Index</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-300 border-2 border-orange-500 rounded relative">
                            <span className="absolute -top-1 -right-1 text-xs">🎯</span>
                        </div>
                        <span className="text-sm">Probe Position</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-200 border-2 border-blue-400 rounded"></div>
                        <span className="text-sm">Search Range</span>
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

                {/* Interpolation Formula Visualization - Always visible */}
                <div className="w-full max-w-4xl mb-6 p-6 bg-base-100 rounded-2xl shadow-xl border-2 border-primary/30">
                    <h3 className="text-lg font-bold mb-4 text-center text-primary">Interpolation Formula</h3>
                    <div className="bg-base-200/50 p-4 rounded-xl mb-4">
                        <div className="text-center font-mono text-sm mb-3">
                            <div className="mb-2">pos = low + ⌊((target - arr[low]) × (high - low)) / (arr[high] - arr[low])⌋</div>
                        </div>
                        {searchRange && probePosition !== null ? (
                            <>
                                <div className="divider divider-primary my-2">Current Calculation</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-black">
                                    <div className="space-y-2">
                                        <div className="flex justify-between p-2 bg-cyan-100 rounded">
                                            <span className="font-semibold">low:</span>
                                            <span className="font-mono">{searchRange.low}</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-indigo-100 rounded">
                                            <span className="font-semibold">high:</span>
                                            <span className="font-mono">{searchRange.high}</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-yellow-100 rounded">
                                            <span className="font-semibold">target:</span>
                                            <span className="font-mono">{targetValue}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between p-2 bg-purple-100 rounded">
                                            <span className="font-semibold">arr[low]:</span>
                                            <span className="font-mono">{numberArr[searchRange.low]}</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-purple-100 rounded">
                                            <span className="font-semibold">arr[high]:</span>
                                            <span className="font-mono">{numberArr[searchRange.high]}</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-orange-100 rounded">
                                            <span className="font-semibold">pos:</span>
                                            <span className="font-mono font-bold">{probePosition}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-sm text-base-content/60 py-4">
                                Start a search to see live calculation values
                            </div>
                        )}
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
                                type="number"
                                value={targetValue}
                                className="input join-item rounded-l-lg w-full"
                                onChange={handleTargetInput}
                                placeholder="e.g., 42"
                            />
                            <button
                                className="btn btn-primary join-item rounded-r-lg"
                                onClick={startSearching}
                                disabled={isSubmitting || isAnimating || !targetValue}
                            >
                                Search
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-row gap-2 md:gap-4 items-center justify-center w-full">
                        <button
                            className={`btn btn-accent btn-sm lg:btn-md flex-1 lg:w-auto ${isAnimating || currentStepIndex <= -1 || steps.length === 0 ? 'btn-disabled' : ''}`}
                            onClick={handleStepBackward}
                            aria-label="Step backward"
                        >
                            Step Backward
                        </button>
                        <button
                            className={`btn btn-accent btn-sm lg:btn-md flex-1 lg:w-auto ${isAnimating || currentStepIndex >= steps.length - 1 ? 'btn-disabled' : ''}`}
                            onClick={handleStepForward}
                            aria-label="Step forward"
                        >
                            Step Forward
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 md:gap-4 items-center justify-center w-full">
                        <div className="flex flex-row items-center gap-1 w-full min-w-3xs">
                            <div className="font-semibold text-sm">Array:</div>
                            <input
                                type="text"
                                value={inputValue}
                                className="input w-full"
                                onChange={handleInput}
                                placeholder="e.g., 12,23,34,45"
                            />
                        </div>
                        <div className="flex flex-row items-center gap-1 w-full md:w-auto">
                            <div className="font-semibold text-sm">Size:</div>
                            <div className="join w-full">
                                <input
                                    type="number"
                                    value={size}
                                    className="input join-item rounded-l-lg w-full md:w-13"
                                    onChange={handleSizeInput}
                                />
                                <button className="btn btn-secondary join-item rounded-r-lg" onClick={handleRandom} disabled={isAnimating}>
                                    Random
                                </button>
                            </div>
                        </div>
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

export default InterpolationSearch;