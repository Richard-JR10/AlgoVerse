import {useState, useEffect, useRef} from 'react';
import NavBar from "../../components/navBar.jsx";
import AlgorithmNavbar from "../algorithmNavbar.jsx";

const HeapSort = () => {
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
    const [highlightedNodes, setHighlightedNodes] = useState([]);
    const [sortedArray, setSortedArray] = useState([]);

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
        if (e.target.value > 20) {
            setError("Maximum size is 20 for tree visualization.");
            return;
        }
        if (e.target.value < 0) {
            setError("Minimum size is 0.");
            return;
        }
        setSize(e.target.value);
    };

    // Heap Sort implementation
    const heapify = (arr, n, i, steps, sorted = [], heapSize = null) => {
        let largest = i;
        let left = 2 * i + 1;
        let right = 2 * i + 2;

        steps.push({
            type: "compare",
            array: [...arr],
            indices: [i],
            sorted: [...sorted],
            heapSize: heapSize !== null ? heapSize : arr.length,
            message: `Heapifying at index ${i}`
        });

        if (left < n) {
            steps.push({
                type: "compare",
                array: [...arr],
                indices: [largest, left],
                sorted: [...sorted],
                heapSize: heapSize !== null ? heapSize : arr.length,
                message: `Comparing parent ${arr[largest]} with left child ${arr[left]}`
            });
            if (arr[left] > arr[largest]) {
                largest = left;
            }
        }

        if (right < n) {
            steps.push({
                type: "compare",
                array: [...arr],
                indices: [largest, right],
                sorted: [...sorted],
                heapSize: heapSize !== null ? heapSize : arr.length,
                message: `Comparing with right child ${arr[right]}`
            });
            if (arr[right] > arr[largest]) {
                largest = right;
            }
        }

        if (largest !== i) {
            [arr[i], arr[largest]] = [arr[largest], arr[i]];
            steps.push({
                type: "swap",
                array: [...arr],
                indices: [i, largest],
                sorted: [...sorted],
                heapSize: heapSize !== null ? heapSize : arr.length,
                message: `Swapping ${arr[largest]} with ${arr[i]}`
            });
            heapify(arr, n, largest, steps, sorted, heapSize);
        }
    };

    const heapSort = (arr) => {
        const steps = [];
        const n = arr.length;
        let workingArray = [...arr];

        // Build max heap
        steps.push({
            type: "build",
            array: [...workingArray],
            indices: [],
            sorted: [],
            heapSize: n,
            message: "Building Max Heap"
        });

        for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
            heapify(workingArray, n, i, steps, [], n);
        }

        steps.push({
            type: "heap_complete",
            array: [...workingArray],
            indices: [],
            sorted: [],
            heapSize: n,
            message: "Max Heap built successfully"
        });

        // Extract elements from heap
        const sorted = [];
        for (let i = n - 1; i > 0; i--) {
            [workingArray[0], workingArray[i]] = [workingArray[i], workingArray[0]];
            sorted.unshift(workingArray[i]);

            steps.push({
                type: "extract",
                array: [...workingArray],
                heapSize: i,
                indices: [0, i],
                sorted: [...sorted],
                message: `Extracted ${workingArray[i]} to sorted array`
            });

            heapify(workingArray, i, 0, steps, sorted, i);
        }

        sorted.unshift(workingArray[0]);
        steps.push({
            type: "complete",
            array: [...workingArray],
            sorted: [...sorted],
            heapSize: 0,
            indices: [],
            message: "Sorting complete!"
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
            setHighlightedNodes([]);
            setSortedArray([]);

            const startTime = performance.now();
            const sortSteps = heapSort(numArray);
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

        // Always set the sorted array from the step
        setSortedArray([...(step.sorted || [])]);
        setNumberArr([...step.array]);

        if (step.type === "compare") {
            setHighlightedNodes(step.indices);
            await new Promise(resolve => setTimeout(resolve, speedRef.current));
        } else if (step.type === "swap") {
            setHighlightedNodes(step.indices);
            await new Promise(resolve => setTimeout(resolve, speedRef.current));
        } else if (step.type === "extract") {
            setHighlightedNodes(step.indices);
            await new Promise(resolve => setTimeout(resolve, speedRef.current));
        } else if (step.type === "build" || step.type === "heap_complete") {
            setHighlightedNodes([]);
            await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
        } else if (step.type === "complete") {
            setHighlightedNodes([]);
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
            setHighlightedNodes([]);
            setSortedArray([]);
            setIsAnimating(false);
            return;
        }

        const prevStep = steps[prevStepIndex];
        setNumberArr([...prevStep.array]);
        setSortedArray([...(prevStep.sorted || [])]);
        setHighlightedNodes(prevStep.indices || []);

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
                setHighlightedNodes([]);
                setSortedArray([]);

                const startTime = performance.now();
                const sortSteps = heapSort(initialArrayRef.current);
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

            // Always update array and sorted array from step
            setNumberArr([...step.array]);
            setSortedArray([...(step.sorted || [])]);

            if (step.type === "compare") {
                setHighlightedNodes(step.indices);
                await new Promise(resolve => setTimeout(resolve, speedRef.current));
            } else if (step.type === "swap") {
                setHighlightedNodes(step.indices);
                await new Promise(resolve => setTimeout(resolve, speedRef.current));
            } else if (step.type === "extract") {
                setHighlightedNodes(step.indices);
                await new Promise(resolve => setTimeout(resolve, speedRef.current));
            } else if (step.type === "build" || step.type === "heap_complete") {
                setHighlightedNodes([]);
                await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
            } else if (step.type === "complete") {
                setHighlightedNodes([]);
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
    const heapSize = currentStep?.heapSize ?? numberArr.length;

    // Tree rendering logic
    const renderTree = () => {
        if (numberArr.length === 0) return null;

        const levels = Math.ceil(Math.log2(heapSize + 1));
        const totalNodes = heapSize;

        // Dynamic sizing based on number of nodes - adjusted for better spacing at 17+
        const nodeSize = totalNodes <= 7 ? 60 : totalNodes <= 15 ? 55 : totalNodes <= 31 ? 48 : 40;
        const levelHeight = totalNodes <= 7 ? 100 : totalNodes <= 15 ? 90 : 80;
        const horizontalSpacing = totalNodes <= 7 ? 1.8 : totalNodes <= 15 ? 1.6 : 1.8;

        // Calculate SVG dimensions based on tree structure
        const maxNodesInLevel = Math.pow(2, levels - 1);
        const svgWidth = Math.max(1200, maxNodesInLevel * nodeSize * horizontalSpacing);
        const svgHeight = levels * levelHeight + 120;

        const getNodePosition = (index, level) => {
            const nodesInLevel = Math.pow(2, level);
            const positionInLevel = index - (Math.pow(2, level) - 1);
            const levelWidth = svgWidth * 0.85; // Use 85% of width for spacing
            const spacing = levelWidth / (nodesInLevel + 1);
            const x = (svgWidth * 0.075) + spacing * (positionInLevel + 1); // 7.5% margin on each side
            const y = level * levelHeight + 60;
            return { x, y };
        };

        const nodes = [];
        const edges = [];

        for (let i = 0; i < Math.min(numberArr.length, heapSize); i++) {
            const level = Math.floor(Math.log2(i + 1));
            const pos = getNodePosition(i, level);

            // Add edge to parent
            if (i > 0) {
                const parentIndex = Math.floor((i - 1) / 2);
                const parentLevel = Math.floor(Math.log2(parentIndex + 1));
                const parentPos = getNodePosition(parentIndex, parentLevel);

                edges.push(
                    <line
                        key={`edge-${i}`}
                        x1={parentPos.x}
                        y1={parentPos.y}
                        x2={pos.x}
                        y2={pos.y}
                        stroke="#9333ea"
                        strokeWidth={nodeSize > 50 ? "3" : "2.5"}
                    />
                );
            }

            const isHighlighted = highlightedNodes.includes(i);
            const isInHeap = i < heapSize;

            nodes.push(
                <g key={`node-${i}`}>
                    <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={nodeSize / 2}
                        fill={!isInHeap ? "#d1d5db" : isHighlighted ? "#fbbf24" : "#c084fc"}
                        stroke={isHighlighted ? "#f59e0b" : "#9333ea"}
                        strokeWidth={nodeSize > 50 ? "3" : "2.5"}
                        className="transition-all duration-300"
                    />
                    <text
                        x={pos.x}
                        y={pos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize={nodeSize > 50 ? "18" : nodeSize > 45 ? "17" : "15"}
                        fontWeight="bold"
                    >
                        {numberArr[i]}
                    </text>
                    <text
                        x={pos.x}
                        y={pos.y + nodeSize / 2 + (nodeSize > 50 ? 18 : 16)}
                        textAnchor="middle"
                        fill="#6b7280"
                        fontSize={nodeSize > 50 ? "13" : "12"}
                    >
                        {i}
                    </text>
                </g>
            );
        }

        return (
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="mx-auto"
                preserveAspectRatio="xMidYMid meet"
            >
                {edges}
                {nodes}
            </svg>
        );
    };

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
                                                    <span className="font-semibold text-base-content/80">Time Complexity:</span>
                                                    <div className="badge badge-primary badge-lg font-mono font-bold">O(n log n)</div>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                    <span className="font-semibold text-base-content/80">Space Complexity:</span>
                                                    <div className="badge badge-primary badge-outline badge-lg font-mono font-bold">O(1)</div>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-4 bg-info/10 rounded-xl border-l-4 border-info">
                                                <p className="text-sm text-base-content/80 leading-relaxed">
                                                    Heap Sort first builds a max heap from the array, then repeatedly extracts
                                                    the maximum element and rebuilds the heap. It guarantees O(n log n) time
                                                    complexity in all cases with in-place sorting.
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
                {currentStep && (
                    <div className="mb-4">
                        <div className="badge badge-primary badge-lg">
                            {currentStep.message}
                        </div>
                    </div>
                )}

                {/* Tree Visualization */}
                <div className="w-full max-w-7xl bg-base-100 rounded-lg shadow-lg p-4 mb-6 min-h-[400px]">
                    <h3 className="text-lg font-bold mb-3 text-center">Binary Heap Tree</h3>
                    <div className="w-full h-full min-h-[350px]">
                        {renderTree()}
                    </div>
                </div>

                {/* Sorted Array Display */}
                {sortedArray.length > 0 && (
                    <div className="w-full max-w-6xl mb-6">
                        <h3 className="text-lg font-bold mb-3 text-center">Sorted Array</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                            {sortedArray.map((num, idx) => (
                                <div
                                    key={idx}
                                    className="w-16 h-16 flex items-center justify-center bg-green-200 border-2 border-green-500 rounded-lg font-bold text-lg text-black"
                                >
                                    {num}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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

export default HeapSort;