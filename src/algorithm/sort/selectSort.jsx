import {useState, useEffect, useRef} from 'react';
import * as d3 from 'd3';
import axios from "axios";
import NavBar from "../../components/navBar.jsx";
import AlgorithmNavbar from "../algorithmNavbar.jsx";
import {useSound} from "../../context/soundContext.jsx";
import * as Tone from "tone";
import SoundToggle from "../../components/utils/soundToggle.jsx";

const SelectSort = () => {
    const [inputValue, setInputValue] = useState("");
    const [numberArr, setNumberArr] = useState([]);
    const [isSorting, setIsSorting] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [isAnimating, setIsAnimating] = useState(false);
    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);
    const [size, setSize] = useState(10);
    const initialArrayRef = useRef([]);
    const isInitializedRef = useRef(false);
    const movedBarsRef = useRef([]);
    const synthRef = useRef(null);
    const { soundEnabled } = useSound();
    const soundRef = useRef(soundEnabled);

    // State for complexity display
    const [showComplexity, setShowComplexity] = useState(false);
    const [executionTime, setExecutionTime] = useState(null);

    // Sorting colors
    const sortedColor = "orange";
    const swappingColor = "green";
    const compareColor = "yellow";
    const minColor = "red";
    const defaultColor = "var(--bar-color)";

    useEffect(() => {
        soundRef.current = soundEnabled;
    }, [soundEnabled]);

    useEffect(() => {
        synthRef.current = new Tone.Synth().toDestination();
        return () => {
            if (synthRef.current) synthRef.current.dispose();
        };
    }, []);

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        movedBarsRef.current = [];
    }, [numberArr]);

    const handleInput = (e) => {
        e.preventDefault();
        setInputValue(e.target.value);
    };

    const handleSizeInput = (e) => {
        e.preventDefault();
        const value = Number(e.target.value);
        if (Number.isInteger(value) && value >= 0) {
            if (value > 50) {
                setError("Maximum size is 50.");
                return;
            }
            if (value < 0) {
                setError("Minimum size is 0.");
                return;
            }
            setSize(value);
        } else {
            setError("Size must be a non-negative integer");
        }
    };

    const animateBars = async (input) => {
        try {
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

            setError(null);
            setIsSubmitting(true);
            if (isSorting || isAnimating) {
                isCancelledRef.current = true;
                d3.select(svgRef.current)
                    .selectAll(".bar-group rect")
                    .interrupt();
                d3.select(svgRef.current)
                    .selectAll(".bar-label")
                    .interrupt();
                d3.select(svgRef.current)
                    .selectAll(".index-label")
                    .interrupt();
                setIsSorting(false);
            }

            setNumberArr(numArray);
            initialArrayRef.current = [...numArray];
            setCurrentStepIndex(-1);
            setSteps([]);
            await drawBars(numArray, true);

            const startTime = performance.now();
            // Fetch sorting steps
            const response = await axios.post('https://algoverse-backend-python.onrender.com/sort/selection', {
                array: numArray
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            // Record end time and calculate execution time
            const endTime = performance.now();
            setExecutionTime((endTime - startTime) / 1000);
            setSteps(response.data.steps);

            setIsSubmitting(false);
            resetHighlight();
            isCancelledRef.current = false;
        } catch (err) {
            setError(err.response?.data.error || err.message || 'Failed to process');
            setNumberArr([]);
            setIsSubmitting(false);
            resetHighlight();
            isCancelledRef.current = false;
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
        if (isSubmitting) return;

        const input = generateRandomArray(size);
        await animateBars(input);
    };

    const handleSorted = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        const input = [...numberArr].sort((a, b) => a - b);
        await animateBars(input);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        const input = inputValue.split(",").map(item => item.trim()).filter(Boolean);
        await animateBars(input);
    };

    useEffect(() => {
        const initializeVisualization = async () => {
            if (svgRef.current && !isInitializedRef.current) {
                isInitializedRef.current = true;
                await handleRandom();
            }
        };

        const timer = setTimeout(initializeVisualization, 100);
        return () => clearTimeout(timer);
    }, []);

    const drawBars = (arr, animate = true) => {
        const svg = d3.select(svgRef.current);
        const width = svgRef.current.clientWidth;
        const height = 300;
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const maxBarWidth = 75;
        const barSpacing = 10;
        const minBarHeight = 2;

        if (svg.selectAll(".bar-group").size() !== arr.length) {
            svg.selectAll(".bar-group").remove();
        }

        svg.attr("viewBox", `0 0 ${width} ${height + margin.top + margin.bottom}`);

        const yScale = d3.scaleLinear()
            .domain([d3.min([0, ...arr]) - 1, d3.max(arr)])
            .range([height - margin.bottom, margin.top]);

        let barWidth = Math.floor((width - margin.left - margin.right) / arr.length) - barSpacing;
        barWidth = Math.min(barWidth, maxBarWidth);
        const centeredBarWidth = (width - margin.left - margin.right - arr.length * (barWidth + barSpacing)) / 2;

        const barGroups = svg.selectAll(".bar-group")
            .data(arr, (d, i) => i);

        const enter = barGroups.enter().append("g").attr("class", "bar-group");
        const enterRects = enter.append("rect")
            .attr("fill", defaultColor)
            .attr("x", (d, i) => margin.left + i * (barWidth + barSpacing) + centeredBarWidth)
            .attr("width", barWidth)
            .attr("y", height - margin.bottom)
            .attr("height", 0)
            .transition()
            .duration(animate ? 500 : 0)
            .attr("y", d => yScale(d))
            .attr("height", d => Math.max(minBarHeight, height - margin.bottom - yScale(d)));

        enter.append("text")
            .attr("class", "bar-label")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .attr("fill", "var(--visual-font)")
            .text(d => d)
            .call(positionText);

        enter.append("text")
            .attr("class", "index-label")
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("fill", "var(--index-color)")
            .attr("font-weight", "bold")
            .text((d, i) => i)
            .attr("x", (d, i) => margin.left + i * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
            .attr("y", height - margin.bottom + 25);

        const updateRects = barGroups.select("rect")
            .transition()
            .duration(animate ? 500 : 0)
            .attr("x", (d, i) => margin.left + i * (barWidth + barSpacing) + centeredBarWidth)
            .attr("width", barWidth)
            .attr("y", d => yScale(d))
            .attr("height", d => Math.max(minBarHeight, height - margin.bottom - yScale(d)));

        barGroups.select(".bar-label")
            .transition()
            .duration(animate ? 500 : 0)
            .call(positionText)
            .text(d => d);

        barGroups.select(".index-label")
            .transition()
            .duration(animate ? 500 : 0)
            .attr("x", (d, i) => margin.left + i * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
            .attr("y", height - margin.bottom + 25)
            .text((d, i) => i);

        const exit = barGroups.exit();
        const exitRects = exit.select("rect")
            .transition()
            .duration(animate ? 500 : 0)
            .attr("y", height - margin.bottom)
            .attr("height", 0);

        exit.select(".bar-label").remove();
        exit.select(".index-label").remove();

        function positionText(selection) {
            selection
                .attr("x", (d, i) => margin.left + i * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
                .attr("y", d => {
                    const barHeight = Math.max(minBarHeight, height - margin.bottom - yScale(d));
                    return barHeight > 20 ? yScale(d) + barHeight - 10 : yScale(d) - 10;
                })
                .attr("fill", "var(--visual-font)")
        }

        const allTransitions = [
            ...(animate && enterRects.size() ? [enterRects.end()] : []),
            ...(animate && updateRects.size() ? [updateRects.end()] : []),
            ...(animate && exitRects.size() ? [exitRects.end()] : [])
        ];

        return allTransitions.length ? Promise.all(allTransitions) : Promise.resolve();
    };

    const resetHighlight = () => {
        d3.select(svgRef.current)
            .selectAll(".bar-group rect")
            .attr("fill", defaultColor);
    };

    const highlightBars = (indexes, color, sortedIndices = []) => {
        d3.select(svgRef.current)
            .selectAll(".bar-group rect")
            .attr("fill", (d, i) => {
                if (sortedIndices.includes(i)) return sortedColor;
                return indexes.includes(i) ? color : defaultColor;
            });
    };

    const highlightCompare = (indexes, sortedIndices = []) => {
        d3.select(svgRef.current)
            .selectAll(".bar-group rect")
            .attr("fill", (d, i) => {
                if (sortedIndices.includes(i)) return sortedColor;
                if (i === indexes[0]) return minColor;
                if (i === indexes[1]) return compareColor;
                return defaultColor;
            });
    };

    const swapBars = async (index1, index2, array) => {
        if (isCancelledRef.current) return;

        const svg = d3.select(svgRef.current);
        const barGroups = svg.selectAll(".bar-group");
        const barGroupA = barGroups.filter((d, i) => i === index1);
        const barGroupB = barGroups.filter((d, i) => i === index2);

        const barAX = barGroupA.select("rect").attr("x");
        const barBX = barGroupB.select("rect").attr("x");
        const barWidth = barGroupA.select("rect").attr("width");

        await Promise.all([
            barGroupA.select("rect")
                .transition()
                .duration(speedRef.current)
                .attr("x", barBX)
                .end(),
            barGroupB.select("rect")
                .transition()
                .duration(speedRef.current)
                .attr("x", barAX)
                .end(),
            barGroupA.select(".bar-label")
                .transition()
                .duration(speedRef.current)
                .attr("x", parseFloat(barBX) + parseFloat(barWidth) / 2)
                .end(),
            barGroupB.select(".bar-label")
                .transition()
                .duration(speedRef.current)
                .attr("x", parseFloat(barAX) + parseFloat(barWidth) / 2)
                .end(),
            barGroupA.select(".index-label")
                .transition()
                .duration(speedRef.current)
                .attr("x", parseFloat(barBX) + parseFloat(barWidth) / 2)
                .end(),
            barGroupB.select(".index-label")
                .transition()
                .duration(speedRef.current)
                .attr("x", parseFloat(barAX) + parseFloat(barWidth) / 2)
                .end()
        ]);

        await drawBars(array, false);
    };

    const animateSingleStep = async (step) => {
        setIsAnimating(true);
        let sortedIndices = steps
            .slice(0, currentStepIndex + 1)
            .filter(s => s.type === "sorted")
            .map(s => s.index);

        if (step.type === "minimum") {
            highlightBars(step.indices, minColor, sortedIndices);
            if (soundRef.current) synthRef.current.triggerAttackRelease('A3', '8n');
            await delay(speedRef.current / 2);
        } else if (step.type === "compare") {
            highlightCompare(step.indices, sortedIndices);
            if (soundRef.current) synthRef.current.triggerAttackRelease('D4', '16n');
            await delay(speedRef.current / 2);
        } else if (step.type === "swap") {
            highlightBars(step.indices, swappingColor, sortedIndices);
            if (soundRef.current) synthRef.current.triggerAttackRelease('E4', '8n');
            await delay(100);
            if (soundRef.current) synthRef.current.triggerAttackRelease('F4', '8n');
            await swapBars(step.indices[0], step.indices[1], step.array);
            setNumberArr([...step.array]);
            await delay(speedRef.current / 2);
        } else if (step.type === "sorted") {
            sortedIndices.push(step.index);
            highlightBars(sortedIndices, sortedColor);
            if (soundRef.current) synthRef.current.triggerAttackRelease('C5', '4n');
            await delay(speedRef.current / 2);
        }

        setIsAnimating(false);
    };

    const handleStepForward = async () => {
        if (isAnimating || currentStepIndex >= steps.length - 1 || steps.length === 0) return;
        await Tone.start();
        const nextStepIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextStepIndex);
        await animateSingleStep(steps[nextStepIndex]);
    };

    const handleStepBackward = async () => {
        if (isAnimating || currentStepIndex <= -1 || steps.length === 0) return;

        setIsAnimating(true);
        const prevStepIndex = currentStepIndex - 1;
        setCurrentStepIndex(prevStepIndex);

        if (prevStepIndex === -1) {
            await drawBars(initialArrayRef.current, false);
            resetHighlight();
            setNumberArr([...initialArrayRef.current]);
            setIsAnimating(false);
            return;
        }

        let arrayToDraw = [...initialArrayRef.current];
        let sortedIndices = [];

        for (let i = 0; i <= prevStepIndex; i++) {
            const step = steps[i];
            if (step.type === "swap") {
                const [index1, index2] = step.indices;
                [arrayToDraw[index1], arrayToDraw[index2]] = [arrayToDraw[index2], arrayToDraw[index1]];
            } else if (step.type === "sorted") {
                sortedIndices.push(step.index);
            }
        }

        await drawBars(arrayToDraw, false);
        setNumberArr([...arrayToDraw]);

        const prevStep = steps[prevStepIndex];
        if (prevStep.type === "minimum") {
            highlightBars(prevStep.indices, minColor, sortedIndices);
        } else if (prevStep.type === "compare") {
            highlightCompare(prevStep.indices, sortedIndices);
        } else if (prevStep.type === "swap") {
            highlightBars(prevStep.indices, swappingColor, sortedIndices);
        } else if (prevStep.type === "sorted") {
            highlightBars(sortedIndices, sortedColor);
        }

        setIsAnimating(false);
    };

    const animateSortSteps = async (steps) => {
        let sortedIndices = [];

        for (const step of steps) {
            if (isCancelledRef.current) break;
            if (step.type === "minimum") {
                highlightBars(step.indices, minColor, sortedIndices);
                if (soundRef.current) synthRef.current.triggerAttackRelease('A3', '8n');
                await delay(speedRef.current / 2);
            } else if (step.type === "compare") {
                highlightCompare(step.indices, sortedIndices);
                if (soundRef.current) synthRef.current.triggerAttackRelease('D4', '16n');
                await delay(speedRef.current / 2);
            } else if (step.type === "swap") {
                highlightBars(step.indices, swappingColor, sortedIndices);
                if (soundRef.current) synthRef.current.triggerAttackRelease('E4', '8n');
                await delay(100);
                if (soundRef.current) synthRef.current.triggerAttackRelease('F4', '8n');
                await swapBars(step.indices[0], step.indices[1], step.array);
                setNumberArr([...step.array]);
                await delay(speedRef.current / 2);
            } else if (step.type === "sorted") {
                sortedIndices.push(step.index);
                highlightBars(sortedIndices, sortedColor);
                if (soundRef.current) synthRef.current.triggerAttackRelease('C5', '4n');
                await delay(speedRef.current / 2);
            }
        }
    };

    const startSorting = async () => {
        if (numberArr.length > 0 && !isSorting && !isAnimating) {
            await Tone.start();
            setIsSorting(true);
            setIsAnimating(true);
            isCancelledRef.current = false;
            try {
                d3.select(svgRef.current)
                    .selectAll(".bar-group rect")
                    .interrupt();
                d3.select(svgRef.current)
                    .selectAll(".bar-label")
                    .interrupt();
                d3.select(svgRef.current)
                    .selectAll(".index-label")
                    .interrupt();

                setCurrentStepIndex(-1);
                await drawBars(initialArrayRef.current, false);
                resetHighlight();
                setNumberArr([...initialArrayRef.current]);

                const startTime = performance.now();
                const response = await axios.post('https://algoverse-backend-python.onrender.com/sort/selection', {
                    array: initialArrayRef.current
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                // Record end time and calculate execution time
                const endTime = performance.now();
                setExecutionTime((endTime - startTime) / 1000);

                setSteps(response.data.steps);
                await animateSortSteps(response.data.steps);
                setCurrentStepIndex(response.data.steps.length - 1);
            } catch (err) {
                setError(err.response?.data.error || 'Failed to process');
            }
            resetHighlight();
            setIsSorting(false);
            setIsAnimating(false);
            isCancelledRef.current = false;
        }
    };

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

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
                                                    <div className="badge badge-primary badge-lg font-mono font-bold">O(n²)</div>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                    <span className="font-semibold text-base-content/80">Space Complexity:</span>
                                                    <div className="badge badge-primary badge-outline badge-lg font-mono font-bold">O(1)</div>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-4 bg-info/10 rounded-xl border-l-4 border-info">
                                                <p className="text-sm text-base-content/80 leading-relaxed">
                                                    Selection Sort repeatedly selects the minimum element from the unsorted portion and swaps it into place,
                                                    resulting in quadratic time complexity with constant space usage.
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

            <div className="flex justify-center mt-6 flex-grow">
                <svg ref={svgRef} className="block w-full h-auto"></svg>
            </div>

            <div className="flex flex-col items-center mb-4 px-4 sm:px-6 lg:px-8">
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

                    <button className="btn btn-accent btn-sm w-full lg:btn-md xl:w-auto" onClick={handleSorted} disabled={isSubmitting || isAnimating}>
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
                            className={`btn btn-accent btn-sm lg:btn-md flex-1 lg:w-auto ${isAnimating || currentStepIndex >= steps.length - 1 || steps.length === 0 ? 'btn-disabled' : ''}`}
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
                                <button className="btn btn-secondary join-item rounded-r-lg" onClick={handleRandom} disabled={isSubmitting || isAnimating}>
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

export default SelectSort;