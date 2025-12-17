import {useState, useEffect, useRef} from 'react';
import AlgorithmNavbar from "../algorithmNavbar.jsx";
import NavBar from "../../components/navBar.jsx";
import {useSound} from "../../context/soundContext.jsx";
import * as Tone from "tone";
import SoundToggle from "../../components/utils/soundToggle.jsx";

const JumpSearch = () => {
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
    const [currentBlock, setCurrentBlock] = useState(null);
    const [searchResult, setSearchResult] = useState(null);
    const [pseudocodeHighlight, setPseudocodeHighlight] = useState(null);
    const synthRef = useRef(null);
    const { soundEnabled } = useSound();
    const soundRef = useRef(soundEnabled);

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

    // Jump Search implementation
    const jumpSearch = (arr, target) => {
        const steps = [];
        const n = arr.length;
        const jumpSize = Math.floor(Math.sqrt(n));

        steps.push({
            type: "start",
            array: [...arr],
            jumpSize: jumpSize,
            target: target,
            message: `Jump size: ${jumpSize} (√${n})`,
            highlight: 3
        });

        let prev = 0;
        let curr = Math.min(jumpSize, n) - 1;

        // Jump forward
        while (curr < n && arr[curr] < target) {
            steps.push({
                type: "jump",
                array: [...arr],
                indices: [curr],
                blockStart: prev,
                blockEnd: curr,
                target: target,
                message: `Checking block [${prev}...${curr}]: arr[${curr}] = ${arr[curr]} < ${target}`,
                highlight: 6
            });

            prev = curr + 1;
            curr = Math.min(curr + jumpSize, n - 1);
        }

        // Check if we went past the array or target is larger than last element
        if (prev >= n) {
            steps.push({
                type: "not_found",
                array: [...arr],
                indices: [],
                target: target,
                message: `Target ${target} not found (past array bounds)`,
                highlight: 10
            });
            return steps;
        }

        steps.push({
            type: "block_found",
            array: [...arr],
            indices: [curr],
            blockStart: prev,
            blockEnd: curr,
            target: target,
            message: `Block found [${prev}...${curr}]: arr[${curr}] = ${arr[curr]} >= ${target}`,
            highlight: 11
        });

        // Linear search within the block
        for (let i = prev; i <= curr; i++) {
            steps.push({
                type: "linear",
                array: [...arr],
                indices: [i],
                blockStart: prev,
                blockEnd: curr,
                target: target,
                message: `Linear search: arr[${i}] = ${arr[i]} ${arr[i] === target ? '==' : '!='} ${target}`,
                highlight: 12
            });

            if (arr[i] === target) {
                steps.push({
                    type: "found",
                    array: [...arr],
                    indices: [i],
                    foundIndex: i,
                    target: target,
                    message: `Target ${target} found at index ${i}!`,
                    highlight: 13
                });
                return steps;
            }

            if (arr[i] > target) {
                break;
            }
        }

        steps.push({
            type: "not_found",
            array: [...arr],
            indices: [],
            target: target,
            message: `Target ${target} not found in array`,
            highlight: 14
        });

        return steps;
    };

    const animateSearch = async (input) => {
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

            // Sort the array for jump search
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
            setCurrentBlock(null);
            setSearchResult(null);

            setSteps([]);
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
        setCurrentBlock(null);
        setSearchResult(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || isAnimating) return;
        const input = inputValue.split(",").map(item => item.trim()).filter(Boolean);
        await animateSearch(input);
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

    const setFromStep = (step) => {
        setNumberArr([...step.array]);
        setHighlightedIndices(step.indices || []);
        setCurrentBlock(step.blockStart !== undefined ? {start: step.blockStart, end: step.blockEnd} : null);
        setPseudocodeHighlight(step.highlight || null);
        if (step.type === "found") {
            setSearchResult({found: true, index: step.foundIndex});
        } else if (step.type === "not_found") {
            setSearchResult({found: false});
        } else {
            setSearchResult(null);
        }
    };

    const animateSingleStep = async (step, isForward = true) => {
        setIsAnimating(true);

        setFromStep(step);
        if (soundRef.current) synthRef.current.triggerAttackRelease('E4', '16n');
        if (step.type === "found") {
            if (soundRef.current) synthRef.current.triggerAttackRelease('C5', '32n');
        } else if (step.type === "not_found") {
            if (soundRef.current) synthRef.current.triggerAttackRelease('C4', '16n');
        }

        await new Promise(resolve => setTimeout(resolve, speedRef.current));
        setIsAnimating(false);
    };

    const handleStepForward = async () => {
        if (isAnimating || currentStepIndex >= steps.length - 1 || steps.length === 0) return;
        await Tone.start();
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
            setCurrentBlock(null);
            setSearchResult(null);
            setPseudocodeHighlight(null);
            setIsAnimating(false);
            return;
        }

        setFromStep(steps[prevStepIndex]);
        setIsAnimating(false);
    };

    const startSearching = async () => {
        if (numberArr.length > 0 && !isSearching && !isAnimating && targetValue) {
            await Tone.start();
            setIsSearching(true);
            setIsAnimating(true);
            isCancelledRef.current = false;
            setPseudocodeHighlight(null);
            try {
                setCurrentStepIndex(-1);
                setNumberArr([...initialArrayRef.current]);
                setHighlightedIndices([]);
                setCurrentBlock(null);
                setSearchResult(null);

                const targetNum = parseInt(targetValue, 10);
                if (isNaN(targetNum)) {
                    setError("Please enter a valid target number");
                    setIsSearching(false);
                    setIsAnimating(false);
                    return;
                }

                const startTime = performance.now();
                const searchSteps = jumpSearch(initialArrayRef.current, targetNum);
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
        for (let i = 0; i < steps.length; i++) {
            if (isCancelledRef.current) break;
            setCurrentStepIndex(i);
            await animateSingleStep(steps[i]);
        }
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
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="collapse collapse-arrow bg-base-100 shadow-md border border-base-300 rounded-2xl overflow-hidden">
                        <input
                            type="checkbox"
                            checked={showComplexity}
                            onChange={(e) => setShowComplexity(e.target.checked)}
                        />
                        <div className="collapse-title text-xl font-bold flex items-center justify-between bg-base-100 border-b border-base-300">
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
                                                    <div className="badge badge-primary badge-lg font-mono font-bold">O(√n)</div>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                    <span className="font-semibold text-base-content/80">Space Complexity:</span>
                                                    <div className="badge badge-primary badge-outline badge-lg font-mono font-bold">O(1)</div>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-4 bg-info/10 rounded-xl border-l-4 border-info">
                                                <p className="text-sm text-base-content/80 leading-relaxed">
                                                    Jump Search works on sorted arrays by jumping ahead by fixed steps (√n),
                                                    then performing linear search within the identified block. It's faster than
                                                    linear search but requires the array to be sorted.
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
                    <h3 className="text-lg font-bold mb-3 text-center">Sorted Array (Jump Search requires sorted data)</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                        {numberArr.map((num, idx) => {
                            const isHighlighted = highlightedIndices.includes(idx);
                            const isInBlock = currentBlock && idx >= currentBlock.start && idx <= currentBlock.end;
                            const isFound = searchResult?.found && searchResult?.index === idx;

                            let bgColor = 'bg-purple-100';
                            let borderColor = 'border-purple-300';

                            if (isFound) {
                                bgColor = 'bg-green-300';
                                borderColor = 'border-green-500';
                            } else if (isHighlighted) {
                                bgColor = 'bg-yellow-300';
                                borderColor = 'border-yellow-500';
                            } else if (isInBlock) {
                                bgColor = 'bg-blue-200';
                                borderColor = 'border-blue-400';
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
                        <div className="w-8 h-8 bg-blue-200 border-2 border-blue-400 rounded"></div>
                        <span className="text-sm">Current Block</span>
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

                <details open className="hidden lg:block dropdown dropdown-left dropdown-center fixed bottom-1/3 right-2">
                    <summary className="btn m-1 bg-base-content text-base-200">{"<"}</summary>
                    {/* Pseudocode Panel */}
                    <div tabIndex="-1"  className="absolute dropdown-content menu rounded-box z-1 p-2 lg:w-fit lg:sticky lg:top-6 self-start">
                        <div className="card bg-base-100 shadow-lg border border-base-300">
                            <div className="card-body p-3 w-78">
                                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="16 18 22 12 16 6"></polyline>
                                        <polyline points="8 6 2 12 8 18"></polyline>
                                    </svg>
                                    Pseudocode
                                </h3>
                                <div className="bg-base-200 rounded-lg p-2 font-mono text-xs space-y-0.5">
                                    <div className={`px-2 py-1 rounded transition-all ${pseudocodeHighlight === 1 ? 'bg-primary/20 border-l-2 border-primary' : ''}`}>
                                        <span className="text-primary font-bold">function</span> jumpSearch(arr, target):
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-2 ${pseudocodeHighlight === 2 ? 'bg-secondary/20 border-l-2 border-secondary' : ''}`}>
                                        n = arr.length
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-2 ${pseudocodeHighlight === 3 ? 'bg-info/20 border-l-2 border-info' : ''}`}>
                                        step = floor(sqrt(n))
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-2 ${pseudocodeHighlight === 4 ? 'bg-warning/20 border-l-2 border-warning' : ''}`}>
                                        prev = 0
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-2 ${pseudocodeHighlight === 5 ? 'bg-info/20 border-l-2 border-info' : ''}`}>
                                        curr = min(step, n) - 1
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-2 ${pseudocodeHighlight === 6 ? 'bg-accent/20 border-l-2 border-accent' : ''}`}>
                                        <span className="text-accent font-bold">while</span> (curr &lt; n &amp;&amp; arr[curr] &lt; target):
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-4 ${pseudocodeHighlight === 7 ? 'bg-warning/20 border-l-2 border-warning' : ''}`}>
                                        prev = curr + 1
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-4 ${pseudocodeHighlight === 8 ? 'bg-warning/20 border-l-2 border-warning' : ''}`}>
                                        curr = min(curr + step, n - 1)
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-2 ${pseudocodeHighlight === 9 ? 'bg-error/20 border-l-2 border-error' : ''}`}>
                                        <span className="text-error font-bold">if</span> (prev &gt;= n):
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-4 ${pseudocodeHighlight === 10 ? 'bg-primary/20 border-l-2 border-primary' : ''}`}>
                                        <span className="text-primary font-bold">return</span> -1
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-2 ${pseudocodeHighlight === 11 ? 'bg-info/20 border-l-2 border-info' : ''}`}>
                                        <span className="text-info font-bold">for</span> i = prev <span className="text-info font-bold">to</span> curr:
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-4 ${pseudocodeHighlight === 12 ? 'bg-warning/20 border-l-2 border-warning' : ''}`}>
                                        <span className="text-warning font-bold">if</span> arr[i] == target:
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-6 ${pseudocodeHighlight === 13 ? 'bg-success/20 border-l-2 border-success' : ''}`}>
                                        <span className="text-primary font-bold">return</span> i
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-2 ${pseudocodeHighlight === 14 ? 'bg-error/20 border-l-2 border-error' : ''}`}>
                                        <span className="text-primary font-bold">return</span> -1
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </details>
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
                                className="input join-item w-full"
                                onChange={handleTargetInput}
                                placeholder="e.g., 42"
                            />
                            <button
                                className="btn btn-primary join-item"
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
                            <div className="join w-full">
                                <input
                                    type="text"
                                    value={inputValue}
                                    className="input join-item w-full"
                                    onChange={handleInput}
                                    placeholder="e.g., 12,23,34,45"
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
                                    value={size}
                                    className="input join-item w-full md:w-13"
                                    onChange={handleSizeInput}
                                />
                                <button className="btn btn-primary join-item" onClick={handleRandom} disabled={isAnimating}>
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

export default JumpSearch;