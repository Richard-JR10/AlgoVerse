import {useState, useEffect, useRef} from 'react';
import NavBar from "../../components/navBar.jsx";
import AlgorithmNavbar from "../algorithmNavbar.jsx";

const RadixSort = () => {
    const [inputValue, setInputValue] = useState("");
    const [numberArr, setNumberArr] = useState([]);
    const [isSorting, setIsSorting] = useState(false);
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
    const [currentDigitPosition, setCurrentDigitPosition] = useState(null);
    const [highlightedIndex, setHighlightedIndex] = useState(null);
    const [highlightedBucket, setHighlightedBucket] = useState(null);

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

    // Radix sort implementation
    const getDigit = (num, place) => {
        return Math.floor(Math.abs(num) / Math.pow(10, place)) % 10;
    };

    const digitCount = (num) => {
        if (num === 0) return 1;
        return Math.floor(Math.log10(Math.abs(num))) + 1;
    };

    const mostDigits = (nums) => {
        let maxDigits = 0;
        for (let num of nums) {
            maxDigits = Math.max(maxDigits, digitCount(num));
        }
        return maxDigits;
    };

    const radixSort = (arr) => {
        const steps = [];
        let workingArray = [...arr];
        const maxDigitCount = mostDigits(workingArray);

        for (let k = 0; k < maxDigitCount; k++) {
            steps.push({
                type: "pass",
                digit: k,
                array: [...workingArray],
                buckets: Array.from({ length: 10 }, () => [])
            });

            let digitBuckets = Array.from({ length: 10 }, () => []);

            for (let i = 0; i < workingArray.length; i++) {
                let digit = getDigit(workingArray[i], k);
                steps.push({
                    type: "highlight",
                    index: i,
                    digit: digit,
                    bucketIndex: digit,
                    array: [...workingArray],
                    buckets: digitBuckets.map(b => [...b])
                });
                digitBuckets[digit].push(workingArray[i]);
                steps.push({
                    type: "place",
                    value: workingArray[i],
                    bucketIndex: digit,
                    array: [...workingArray],
                    buckets: digitBuckets.map(b => [...b])
                });
            }

            workingArray = [].concat(...digitBuckets);

            steps.push({
                type: "reconstruct",
                array: [...workingArray],
                buckets: digitBuckets.map(b => [...b])
            });
        }

        steps.push({
            type: "complete",
            array: [...workingArray],
            buckets: Array.from({ length: 10 }, () => [])
        });

        return steps;
    };

    const animateBars = async (input) => {
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
                if (num < 0) {
                    setError("Radix sort requires non-negative integers");
                    return;
                }
                return num;
            });

            if (numArray.some(n => n === undefined)) {
                setIsAnimating(false);
                return;
            }

            setError(null);
            setIsSubmitting(true);
            if (isSorting || isAnimating) {
                isCancelledRef.current = true;
                setIsSorting(false);
            }

            setNumberArr(numArray);
            initialArrayRef.current = [...numArray];
            setCurrentStepIndex(-1);
            setCurrentDigitPosition(null);
            setHighlightedIndex(null);
            setHighlightedBucket(null);

            const startTime = performance.now();
            const sortSteps = radixSort(numArray);
            const endTime = performance.now();

            setSteps(sortSteps);
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
        return randomArray;
    }

    const handleRandom = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting || isAnimating) return;

        const input = generateRandomArray(size);
        await animateBars(input);
    };

    const handleSorted = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting || isAnimating) return;

        const input = [...numberArr].sort((a, b) => a - b);
        await animateBars(input);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || isAnimating) return;
        const input = inputValue.split(",").map(item => item.trim()).filter(Boolean);
        await animateBars(input);
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

        if (step.type === "pass") {
            setNumberArr([...step.array]);
            setCurrentDigitPosition(step.digit);
            setHighlightedIndex(null);
            setHighlightedBucket(null);
        } else if (step.type === "highlight") {
            setHighlightedIndex(step.index);
            setHighlightedBucket(step.bucketIndex);
            await new Promise(resolve => setTimeout(resolve, speedRef.current));
        } else if (step.type === "place") {
            setHighlightedIndex(null);
            await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
        } else if (step.type === "reconstruct") {
            setNumberArr([...step.array]);
            setHighlightedIndex(null);
            setHighlightedBucket(null);
            await new Promise(resolve => setTimeout(resolve, speedRef.current));
        } else if (step.type === "complete") {
            setNumberArr([...step.array]);
            setCurrentDigitPosition(null);
            setHighlightedIndex(null);
            setHighlightedBucket(null);
        }

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
            setCurrentDigitPosition(null);
            setHighlightedIndex(null);
            setHighlightedBucket(null);
            setIsAnimating(false);
            return;
        }

        const prevStep = steps[prevStepIndex];
        setNumberArr([...prevStep.array]);

        if (prevStep.type === "pass") {
            setCurrentDigitPosition(prevStep.digit);
            setHighlightedIndex(null);
            setHighlightedBucket(null);
        } else if (prevStep.type === "highlight") {
            setHighlightedIndex(prevStep.index);
            setHighlightedBucket(prevStep.bucketIndex);
        } else if (prevStep.type === "place") {
            setHighlightedIndex(null);
        } else {
            setHighlightedIndex(null);
            setHighlightedBucket(null);
        }

        setIsAnimating(false);
    };

    const startSorting = async () => {
        if (numberArr.length > 0 && !isSorting && !isAnimating) {
            setIsSorting(true);
            setIsAnimating(true);
            isCancelledRef.current = false;
            try {
                setCurrentStepIndex(-1);
                setNumberArr([...initialArrayRef.current]);
                setCurrentDigitPosition(null);
                setHighlightedIndex(null);
                setHighlightedBucket(null);

                const startTime = performance.now();
                const sortSteps = radixSort(initialArrayRef.current);
                const endTime = performance.now();

                setExecutionTime((endTime - startTime) / 1000);
                setSteps(sortSteps);
                await animateSortSteps(sortSteps);
                setCurrentStepIndex(sortSteps.length - 1);
            } catch (err) {
                setError(err.message || 'Failed to process');
            }
            setIsSorting(false);
            setIsAnimating(false);
            isCancelledRef.current = false;
        }
    };

    const animateSortSteps = async (steps) => {
        setIsAnimating(true);
        for (let i = 0; i < steps.length; i++) {
            if (isCancelledRef.current) break;
            setCurrentStepIndex(i);
            const step = steps[i];

            if (step.type === "pass") {
                setNumberArr([...step.array]);
                setCurrentDigitPosition(step.digit);
                setHighlightedIndex(null);
                setHighlightedBucket(null);
                await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
            } else if (step.type === "highlight") {
                setHighlightedIndex(step.index);
                setHighlightedBucket(step.bucketIndex);
                await new Promise(resolve => setTimeout(resolve, speedRef.current));
            } else if (step.type === "place") {
                setHighlightedIndex(null);
                await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
            } else if (step.type === "reconstruct") {
                setNumberArr([...step.array]);
                setHighlightedIndex(null);
                setHighlightedBucket(null);
                await new Promise(resolve => setTimeout(resolve, speedRef.current));
            } else if (step.type === "complete") {
                setNumberArr([...step.array]);
                setCurrentDigitPosition(null);
                setHighlightedIndex(null);
                setHighlightedBucket(null);
                await new Promise(resolve => setTimeout(resolve, speedRef.current));
            }
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
    const buckets = currentStep?.buckets || Array.from({ length: 10 }, () => []);

    return (
        <div className="flex flex-col scrollbar-hide overflow-auto h-screen bg-base-200 relative">
            <NavBar/>
            <AlgorithmNavbar/>

            {/* Complexity Information Panel */}
            <div className="w-full px-4 sm:px-6 lg:px-8">
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
                                                    <span className="font-semibold text-base-content/80">Time Complexity:</span>
                                                    <div className="badge badge-primary badge-lg font-mono font-bold">O(d·(n+k))</div>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                    <span className="font-semibold text-base-content/80">Space Complexity:</span>
                                                    <div className="badge badge-primary badge-outline badge-lg font-mono font-bold">O(n+k)</div>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-4 bg-info/10 rounded-xl border-l-4 border-info">
                                                <p className="text-sm text-base-content/80 leading-relaxed">
                                                    Radix Sort processes numbers digit by digit from least to most significant,
                                                    distributing them into buckets. Where d is the number of digits, n is array size,
                                                    and k is the range of digits (0-9).
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
                                                                Run a sort operation to see<br />detailed execution metrics
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
                {currentDigitPosition !== null && (
                    <div className="mb-4">
                        <div className="badge badge-primary badge-lg">
                            Sorting by digit position: {currentDigitPosition} (from right)
                        </div>
                    </div>
                )}

                {/* Current Array */}
                <div className="mb-8 w-full max-w-6xl">
                    <h3 className="text-lg font-bold mb-3 text-center">Current Array</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                        {numberArr.map((num, idx) => (
                            <div
                                key={idx}
                                className={`
                                    w-16 h-16 flex flex-col items-center justify-center 
                                    rounded-lg border-2 font-bold text-lg transition-all duration-300
                                    ${highlightedIndex === idx
                                    ? 'bg-yellow-300 border-yellow-500 scale-110 shadow-lg'
                                    : 'bg-purple-100 border-purple-300'}
                                `}
                            >
                                <span className="text-xl dark:text-black">{num}</span>
                                <span className="text-xs text-gray-600 mt-1">idx: {idx}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Buckets */}
                <div className="w-full max-w-6xl">
                    <h3 className="text-lg font-bold mb-3 text-center">Digit Buckets (0-9)</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {buckets.map((bucket, bucketIdx) => (
                            <div
                                key={bucketIdx}
                                className={`
                                    p-3 rounded-lg border-2 min-h-24 transition-all duration-300
                                    ${highlightedBucket === bucketIdx
                                    ? 'bg-green-100 border-green-500 shadow-lg'
                                    : 'bg-base-100 border-base-300'}
                                `}
                            >
                                <div className="text-center font-bold mb-2 text-sm">
                                    Bucket {bucketIdx}
                                </div>
                                <div className="flex flex-wrap gap-1 justify-center">
                                    {bucket.map((num, idx) => (
                                        <div
                                            key={idx}
                                            className="w-12 h-12 flex items-center justify-center bg-orange-200 border border-orange-400 rounded font-semibold text-sm text-black"
                                        >
                                            {num}
                                        </div>
                                    ))}
                                    {bucket.length === 0 && (
                                        <div className="text-xs text-gray-400 italic">empty</div>
                                    )}
                                </div>
                            </div>
                        ))}
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

                    <button className="btn btn-accent btn-sm w-full lg:btn-md xl:w-auto" onClick={handleSorted} disabled={isAnimating}>
                        Sorted
                    </button>
                    <button className="btn btn-accent btn-sm w-full lg:btn-md xl:w-auto" onClick={startSorting} disabled={isSorting || isAnimating}>
                        Start Sorting
                    </button>

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
                            <div className="join w-full">
                                <input
                                    type="text"
                                    value={inputValue}
                                    className="input join-item rounded-l-lg w-full"
                                    onChange={handleInput}
                                    placeholder="e.g., 23,45,12,67"
                                />
                                <button
                                    className="btn btn-primary join-item rounded-r-lg"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || isAnimating}
                                >
                                    Go
                                </button>
                            </div>
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

export default RadixSort;