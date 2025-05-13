import { useState, useEffect, useRef, useContext } from 'react';
import * as d3 from 'd3';
import axios from "axios";
import NavBar from "../components/navBar.jsx";
import { ErrorContext } from "../context/errorContext.jsx";
import PlayBackControls from "./playBackControls.jsx";

const QuickSort = () => {
    const [currentInput, setCurrentInput] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [numberArr, setNumberArr] = useState([]);
    const [isSorting, setIsSorting] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const { setError } = useContext(ErrorContext);
    const [isPaused, setIsPaused] = useState(false); // For UI updates
    const isPausedRef = useRef(false); // For async logic
    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);
    const sortingPromiseRef = useRef(null);
    const [size, setSize] = useState(10);

    // Sync isPausedRef with isPaused
    useEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    const sortingMenu = [
        { label: 'Bubble Sort', path: '/visualizer/sort/bubble' },
        { label: 'Merge Sort', path: '/visualizer/sort/merge' },
        { label: 'Selection Sort', path: '/visualizer/sort/select' },
        { label: 'Insertion Sort', path: '/visualizer/sort/insert' },
        { label: 'Quick Sort', path: '/visualizer/sort/quick' }
    ];

    // VisuAlgo-inspired colors
    const sortedColor = "orange";
    const pivotColor = "yellow";
    const compareColor = "red";
    const swapColor = "green";
    const defaultColor = "#EDE2F3";
    const FONT_COLOR = "#6E199F";
    const INDEX_COLOR = "#FFFFFF";
    const lessThanPivotColor = "#3cb371";
    const greaterThanPivotColor = "#9932cc";

    const API_URL = "https://algoverse-backend-python.onrender.com";

    const handleInput = (e) => {
        setInputValue(e.target.value);
    };

    const handleSizeInput = (e) => {
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

    const cancelCurrentAnimation = async () => {
        isCancelledRef.current = true;
        d3.select(svgRef.current)
            .interrupt()
            .selectAll("*")
            .interrupt();
        setIsSorting(false);
        if (sortingPromiseRef.current) {
            try {
                if (sortingPromiseRef.current.abort) {
                    sortingPromiseRef.current.abort();
                }
            } catch (err) {
                console.error("Error canceling sorting promise:", err);
            }
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        isCancelledRef.current = false;
    };

    const animateBars = async (input) => {
        try {
            if (!input || input.length === 0) {
                setError("Please enter at least one number");
                return;
            }

            const numArray = input.map((numStr, index) => {
                const num = parseInt(numStr, 10);
                if (isNaN(num)) {
                    throw new Error(`Invalid number at position ${index + 1}: "${numStr}"`);
                }
                return num;
            });

            setError(null);
            setIsSubmitting(true);

            if (isSorting) {
                await cancelCurrentAnimation();
            }

            setNumberArr(numArray);
            await drawBars(numArray, true);
            setIsSubmitting(false);
            resetHighlight();
        } catch (err) {
            setError(err.message);
            setNumberArr([]);
            setIsSubmitting(false);
            resetHighlight();
        }
    };

    const generateRandomArray = (size) => {
        const sizeInput = Number(size);
        if (!Number.isInteger(sizeInput) || sizeInput <= 0) {
            setError("Size must be a positive integer");
            return [];
        }
        return Array(sizeInput).fill(0).map(() => Math.floor(Math.random() * 100) + 1);
    };

    const handleRandom = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;
        setIsSorting(false);

        const input = generateRandomArray(size);
        setCurrentInput(input);
        await cancelCurrentAnimation();
        await animateBars(input);
    };

    const handleSorted = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSorting(false);

        const input = generateRandomArray(size).sort((a, b) => a - b);
        setCurrentInput(input);
        await cancelCurrentAnimation();
        await animateBars(input);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSorting(false);
        const input = inputValue.split(",").map(item => item.trim()).filter(Boolean);
        if (input.length === 0) {
            setError("Please enter at least one number");
            return;
        }
        setCurrentInput(input);
        await cancelCurrentAnimation();
        await animateBars(input);
    };

    const isInitializedRef = useRef(false);

    useEffect(() => {
        speedRef.current = speed;
        if (svgRef.current && !isInitializedRef.current) {
            isInitializedRef.current = true;
            handleRandom();
        }
    }, [speed]);

    const drawBars = async (arr, animate = true) => {
        const svg = d3.select(svgRef.current);
        const width = svgRef.current.clientWidth || 800;
        const height = 350;
        const margin = { top: 20, right: 20, bottom: 170, left: 40 };
        const maxBarWidth = 50;
        const barSpacing = 10;
        const minBarWidth = 10;
        const minBarHeight = 2;

        svg.interrupt().selectAll("*").interrupt();

        svg.attr("viewBox", `0 0 ${width} ${height + margin.top + margin.bottom}`);

        const yScale = d3.scaleLinear()
            .domain([Math.min(0, ...arr) - 1, Math.max(...arr) + 1])
            .range([height - margin.bottom, margin.top]);

        let barWidth = (width - margin.left - margin.right) / Math.max(1, arr.length) - barSpacing;
        barWidth = Math.min(Math.max(barWidth, minBarWidth), maxBarWidth);
        const centeredBarWidth = (width - margin.left - margin.right - arr.length * (barWidth + barSpacing)) / 2;

        const barGroups = svg.selectAll(".bar-group")
            .data(arr.map((d, i) => ({ value: d, index: i })), (d) => `bar-${d.index}`);

        const getYPosition = (d) => yScale(d.value);

        const getLabelYPosition = (d) => {
            const barHeight = Math.max(minBarHeight, height - margin.bottom - yScale(d.value));
            return barHeight > 20 ? yScale(d.value) + barHeight - 10 : yScale(d.value) - 10;
        };

        const getIndexYPosition = () => height - margin.bottom + 25;

        const enter = barGroups.enter().append("g").attr("class", "bar-group");
        const enterRects = enter.append("rect")
            .attr("fill", defaultColor)
            .attr("x", (d) => margin.left + d.index * (barWidth + barSpacing) + centeredBarWidth)
            .attr("width", barWidth)
            .attr("y", height - margin.bottom)
            .attr("height", 0)
            .transition()
            .duration(animate ? speedRef.current : 0)
            .attr("y", getYPosition)
            .attr("height", (d) => Math.max(minBarHeight, height - margin.bottom - yScale(d.value)));

        enter.append("text")
            .attr("class", "bar-label")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .attr("fill", FONT_COLOR)
            .text((d) => d.value)
            .attr("x", (d) => margin.left + d.index * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
            .attr("y", getLabelYPosition);

        enter.append("text")
            .attr("class", "index-label")
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("fill", INDEX_COLOR)
            .attr("font-weight", "bold")
            .text((d) => d.index)
            .attr("x", (d) => margin.left + d.index * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
            .attr("y", getIndexYPosition);

        const updateRects = barGroups.select("rect")
            .transition()
            .attr("x", (d) => margin.left + d.index * (barWidth + barSpacing) + centeredBarWidth)
            .duration(animate ? speedRef.current : 0)
            .attr("y", getYPosition)
            .attr("height", (d) => Math.max(minBarHeight, height - margin.bottom - yScale(d.value)));

        barGroups.select(".bar-label")
            .transition()
            .attr("x", (d) => margin.left + d.index * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
            .duration(animate ? speedRef.current : 0)
            .attr("y", getLabelYPosition)
            .text((d) => d.value);

        barGroups.select(".index-label")
            .transition()
            .attr("x", (d) => margin.left + d.index * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
            .duration(animate ? speedRef.current : 0)
            .attr("y", getIndexYPosition)
            .text((d) => d.index);

        const exit = barGroups.exit();
        const exitRects = exit.select("rect")
            .transition()
            .duration(animate ? speedRef.current : 0)
            .attr("y", height - margin.bottom)
            .attr("height", 0);

        exit.select(".bar-label").remove();
        exit.select(".index-label").remove();
        exit.remove();

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

    const highlightBars = async (highlightConfig, sortedIndices = []) => {
        if (isCancelledRef.current) return Promise.resolve();

        const { pivotIndex, compareIndices = [], lessThanIndices = [], greaterThanIndices = [] } = highlightConfig;

        return d3.select(svgRef.current)
            .selectAll(".bar-group rect")
            .transition()
            .duration(speedRef.current / 2)
            .attr("fill", (d) => {
                if (sortedIndices.includes(d.index)) return sortedColor;
                if (pivotIndex === d.index) return pivotColor;
                if (compareIndices.includes(d.index)) return compareColor;
                if (lessThanIndices.includes(d.index)) return lessThanPivotColor;
                if (greaterThanIndices.includes(d.index)) return greaterThanPivotColor;
                return defaultColor;
            })
            .end();
    };

    const swapBars = async (index1, index2, array) => {
        if (isCancelledRef.current) return Promise.resolve();

        const svg = d3.select(svgRef.current);
        const barGroups = svg.selectAll(".bar-group");
        const barGroupA = barGroups.filter((d, i) => i === index1);
        const barGroupB = barGroups.filter((d, i) => i === index2);

        const barAX = barGroupA.select("rect").attr("x");
        const barBX = barGroupB.select("rect").attr("x");
        const barWidth = barGroupA.select("rect").attr("width");

        const promises = [
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
        ];

        await Promise.all(promises);

        if (!isCancelledRef.current) {
            await drawBars(array, false);
        }
    };

    const handleTogglePause = () => {
        setIsPaused(prev => {
            const newPaused = !prev;
            isPausedRef.current = newPaused;
            return newPaused;
        });
    };

    const handleRewind = () => {
        setCurrentStepIndex(currentStepIndex);
    }

    const handleFastForward = () => {

    }

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [stepsLength, setStepsLength] = useState(0);

    const animateSortSteps = async (steps) => {
        let sortedIndices = [];
        let currentArray = [...numberArr];
        let lessThanIndices = [];
        let greaterThanIndices = [];
        let currentStepIndex = 0;
        setStepsLength(steps.length);

        const waitWithPauseCheck = async (ms) => {
            await new Promise(resolve => {
                const checkPause = () => {
                    if (isPausedRef.current) {
                        setTimeout(checkPause, 100);
                    } else if (isCancelledRef.current) {
                        setTimeout(resolve, 1);
                    } else {
                        setTimeout(resolve, ms);
                    }
                };
                checkPause();
            });
        };

        while (currentStepIndex < steps.length) {
            if (isCancelledRef.current) break;
            setCurrentStepIndex(currentStepIndex);

            const step = steps[currentStepIndex];
            console.log('Processing step:', step.type, 'index:', currentStepIndex);

            if (step.type === "pivot") {
                await highlightBars(
                    { pivotIndex: step.pivot, compareIndices: [], lessThanIndices, greaterThanIndices },
                    sortedIndices
                );
                await waitWithPauseCheck(speedRef.current);
                if (isCancelledRef.current) break;

                await new Promise(resolve => {
                    const timeout = setTimeout(resolve, speedRef.current);
                    sortingPromiseRef.current = { abort: () => clearTimeout(timeout) };
                });
            } else if (step.type === "compare") {
                await highlightBars(
                    {
                        pivotIndex: step.pivot,
                        compareIndices: [step.left],
                        lessThanIndices,
                        greaterThanIndices
                    },
                    sortedIndices
                );
                await waitWithPauseCheck(speedRef.current);
                await new Promise(resolve => {
                    const timeout = setTimeout(resolve, speedRef.current);
                    sortingPromiseRef.current = { abort: () => clearTimeout(timeout) };
                });
                if (isCancelledRef.current) break;
                const pivotValue = currentArray[step.pivot];
                const comparedValue = currentArray[step.left];
                if (comparedValue <= pivotValue) {
                    if (!lessThanIndices.includes(step.left)) {
                        lessThanIndices.push(step.left);
                    }
                    greaterThanIndices = greaterThanIndices.filter(i => i !== step.left);
                } else {
                    if (!greaterThanIndices.includes(step.left)) {
                        greaterThanIndices.push(step.left);
                    }
                    lessThanIndices = lessThanIndices.filter(i => i !== step.left);
                }
                await highlightBars(
                    {
                        pivotIndex: step.pivot,
                        compareIndices: [],
                        lessThanIndices,
                        greaterThanIndices
                    },
                    sortedIndices
                );
                await waitWithPauseCheck(speedRef.current);
                await new Promise(resolve => {
                    const timeout = setTimeout(resolve, speedRef.current);
                    sortingPromiseRef.current = { abort: () => clearTimeout(timeout) };
                });
            } else if (step.type === "swap") {
                if (isCancelledRef.current) break;
                [currentArray[step.index1], currentArray[step.index2]] = [currentArray[step.index2], currentArray[step.index1]];
                setNumberArr([...currentArray]);
                [lessThanIndices, greaterThanIndices] = [lessThanIndices, greaterThanIndices].map(indices =>
                    indices.map(i => {
                        if (i === step.index1) return step.index2;
                        if (i === step.index2) return step.index1;
                        return i;
                    })
                );
                await highlightBars(
                    {
                        pivotIndex: step.pivot,
                        compareIndices: [step.index1, step.index2],
                        lessThanIndices,
                        greaterThanIndices
                    },
                    sortedIndices
                );
                if (isCancelledRef.current) break;
                await swapBars(step.index1, step.index2, [...currentArray]);
                if (isCancelledRef.current) break;
                await highlightBars(
                    {
                        pivotIndex: step.pivot,
                        compareIndices: [],
                        lessThanIndices,
                        greaterThanIndices
                    },
                    sortedIndices
                );
                await waitWithPauseCheck(speedRef.current);
                await new Promise(resolve => {
                    const timeout = setTimeout(resolve, speedRef.current);
                    sortingPromiseRef.current = { abort: () => clearTimeout(timeout) };
                });
            } else if (step.type === "partition") {
                if (isCancelledRef.current) break;
                sortedIndices.push(step.pivot);
                lessThanIndices = [];
                greaterThanIndices = [];
                await highlightBars(
                    { pivotIndex: step.pivot, compareIndices: [], lessThanIndices: [], greaterThanIndices: [] },
                    sortedIndices
                );
                await waitWithPauseCheck(speedRef.current);
                await new Promise(resolve => {
                    const timeout = setTimeout(resolve, speedRef.current);
                    sortingPromiseRef.current = { abort: () => clearTimeout(timeout) };
                });
            } else if (step.type === "sorted") {
                if (isCancelledRef.current) break;
                sortedIndices.push(step.index);
                await highlightBars(
                    { pivotIndex: null, compareIndices: [], lessThanIndices, greaterThanIndices },
                    sortedIndices
                );
                await waitWithPauseCheck(speedRef.current);
                await new Promise(resolve => {
                    const timeout = setTimeout(resolve, speedRef.current);
                    sortingPromiseRef.current = { abort: () => clearTimeout(timeout) };
                });
            }
            currentStepIndex++;
        }
    };

    const startSorting = async () => {
        if (numberArr.length === 0) {
            setError("No numbers to sort");
            return;
        }

        if (isButtonDisabled) return;

        setIsButtonDisabled(true);
        setTimeout(() => {
            setIsButtonDisabled(false);
        }, 2000);

        if (isSorting) {
            await cancelCurrentAnimation();
            await new Promise(resolve => setTimeout(resolve, 500));
            await animateBars(currentInput);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setIsSorting(true);
        isCancelledRef.current = false;

        try {
            const controller = new AbortController();
            sortingPromiseRef.current = controller;

            const response = await axios.post(`${API_URL}/sort/quick`, {
                array: numberArr
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });

            const data = response.data;
            try {
                await animateSortSteps(data.steps);
            } catch (error) {
                setError(error.response?.data.detail || 'Animate Sort Failed');
            }
        } catch (err) {
            if (axios.isCancel(err) || isCancelledRef.current) {
                console.log("Sort operation was cancelled");
                return;
            }

            setError(err.response?.data.detail || 'Failed to process quick sort');
        } finally {
            if (isCancelledRef.current) {
                console.log("Sort operation was cancelled");
                return;
            }
            resetHighlight();
            setIsSorting(false);
            sortingPromiseRef.current = null;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <NavBar menuItems={sortingMenu} />
            <div className="flex justify-center mt-6 flex-grow">
                <svg ref={svgRef} className="block w-full h-auto"></svg>
            </div>
            <div className="flex flex-col items-center mb-4">
                <div className="flex justify-center items-center flex-row">
                    <button className="btn mr-2" onClick={handleRandom}>
                        Random
                    </button>
                    <button className="btn mr-2" onClick={handleSorted}>
                        Sorted
                    </button>
                    <button className="btn mr-4" onClick={startSorting} disabled={isSorting}>
                        Start Sorting
                    </button>
                    <div className="join flex items-center w-full max-w-md mr-4">
                        <input
                            type="text"
                            value={inputValue}
                            className="input join-item w-full"
                            onChange={handleInput}
                            placeholder="Enter numbers"
                        />
                        <button
                            className="btn join-item"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            Go
                        </button>
                    </div>
                    <div className="join flex items-center w-full max-w-md mr-4">
                        <input
                            type="number"
                            value={size}
                            className="input join-item w-full"
                            onChange={handleSizeInput}
                            max="50"
                            min="1"
                            placeholder="Array size"
                        />
                    </div>
                </div>
            </div>
            <PlayBackControls
                isPaused={isPaused}
                onPlayPause={handleTogglePause}
                speed={speed}
                onSpeedChange={(value) => setSpeed(Number(value))}
                NotSorting={!isSorting}
                currentStepIndex={Number(currentStepIndex)}
                stepsLength={Number(stepsLength)}
            />
        </div>
    );
};

export default QuickSort;