import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import axios from "axios";
import NavBar from "../../components/navBar.jsx";
import AlgorithmNavbar from "../algorithmNavbar.jsx";

const QuickSort = () => {
    const [currentInput, setCurrentInput] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [numberArr, setNumberArr] = useState([]);
    const [isSorting, setIsSorting] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [error, setError] = useState(null);
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [isAnimating, setIsAnimating] = useState(false);
    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);
    const sortingPromiseRef = useRef(null);
    const [size, setSize] = useState(10);
    const initialArrayRef = useRef([]);
    const isInitializedRef = useRef(false);
    const movedBarsRef = useRef([]);

    // State for complexity display
    const [showComplexity, setShowComplexity] = useState(false);
    const [executionTime, setExecutionTime] = useState(null);

    // VisuAlgo-inspired colors
    const sortedColor = "orange";
    const pivotColor = "yellow";
    const compareColor = "red";
    const swapColor = "green";
    const defaultColor = "#EDE2F3"
    const lessThanPivotColor = "#3cb371";
    const greaterThanPivotColor = "#9932cc";

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        movedBarsRef.current = [];
    }, [numberArr]);

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

            if (isSorting || isAnimating) {
                await cancelCurrentAnimation();
            }

            setNumberArr(numArray);
            initialArrayRef.current = [...numArray];
            setCurrentStepIndex(-1);
            setSteps([]);
            await drawBars(numArray, true);

            // Fetch sorting steps
            const controller = new AbortController();
            sortingPromiseRef.current = controller;
            const startTime = performance.now();
            const response = await axios.post(`${API_URL}/sort/quick`, {
                array: numArray
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            setSteps(response.data.steps);
            // Record end time and calculate execution time
            const endTime = performance.now();
            setExecutionTime((endTime - startTime) / 1000);

            setIsSubmitting(false);
            resetHighlight();
            sortingPromiseRef.current = null;
        } catch (err) {
            if (axios.isCancel(err)) {
                return;
            }
            setError(err.response?.data.detail || err.message || 'Failed to process');
            setNumberArr([]);
            setIsSubmitting(false);
            resetHighlight();
            sortingPromiseRef.current = null;
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
        if (e) e.preventDefault();
        if (isSubmitting) return;

        const input = [...numberArr].sort((a, b) => a - b);
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
            .attr("fill", "var(--visual-font)")
            .text((d) => d.value)
            .attr("x", (d) => margin.left + d.index * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
            .attr("y", getLabelYPosition);

        enter.append("text")
            .attr("class", "index-label")
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("fill", "var(--index-color)")
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

    const animateSingleStep = async (step) => {
        setIsAnimating(true);
        let sortedIndices = steps
            .slice(0, currentStepIndex + 1)
            .filter(s => s.type === "partition" || s.type === "sorted")
            .flatMap(s => s.type === "partition" ? [s.pivot] : s.indices);
        let lessThanIndices = movedBarsRef.current.lessThan || [];
        let greaterThanIndices = movedBarsRef.current.greaterThan || [];

        if (step.type === "pivot") {
            await highlightBars(
                { pivotIndex: step.pivot, compareIndices: [], lessThanIndices, greaterThanIndices },
                sortedIndices
            );
            await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
        } else if (step.type === "compare") {
            await highlightBars(
                { pivotIndex: step.pivot, compareIndices: [step.left], lessThanIndices, greaterThanIndices },
                sortedIndices
            );
            await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
            const pivotValue = numberArr[step.pivot];
            const comparedValue = numberArr[step.left];
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
            movedBarsRef.current = { lessThan: lessThanIndices, greaterThan: greaterThanIndices };
            await highlightBars(
                { pivotIndex: step.pivot, compareIndices: [], lessThanIndices, greaterThanIndices },
                sortedIndices
            );
            await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
        } else if (step.type === "swap") {
            await highlightBars(
                { pivotIndex: step.pivot, compareIndices: [step.index1, step.index2], lessThanIndices, greaterThanIndices },
                sortedIndices
            );
            // Perform swap on numberArr
            let newArray = [...numberArr];
            [newArray[step.index1], newArray[step.index2]] = [newArray[step.index2], newArray[step.index1]];
            setNumberArr(newArray);
            await swapBars(step.index1, step.index2, newArray);
            [lessThanIndices, greaterThanIndices] = [lessThanIndices, greaterThanIndices].map(indices =>
                indices.map(i => {
                    if (i === step.index1) return step.index2;
                    if (i === step.index2) return step.index1;
                    return i;
                })
            );
            movedBarsRef.current = { lessThan: lessThanIndices, greaterThan: greaterThanIndices };
            await highlightBars(
                { pivotIndex: step.pivot, compareIndices: [], lessThanIndices, greaterThanIndices },
                sortedIndices
            );
            await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
        } else if (step.type === "partition") {
            sortedIndices.push(step.pivot);
            lessThanIndices = [];
            greaterThanIndices = [];
            movedBarsRef.current = { lessThan: [], greaterThan: [] };
            await highlightBars(
                { pivotIndex: step.pivot, compareIndices: [], lessThanIndices: [], greaterThanIndices: [] },
                sortedIndices
            );
            await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
        } else if (step.type === "sorted") {
            sortedIndices = [...new Set([...sortedIndices, ...step.indices])];
            lessThanIndices = [];
            greaterThanIndices = [];
            movedBarsRef.current = { lessThan: [], greaterThan: [] };
            await highlightBars(
                { pivotIndex: null, compareIndices: [], lessThanIndices, greaterThanIndices },
                sortedIndices
            );
            await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
        }

        setIsAnimating(false);
    };

    const handleStepForward = async () => {
        if (isAnimating || currentStepIndex >= steps.length - 1 || steps.length === 0) return;

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
            movedBarsRef.current = { lessThan: [], greaterThan: [] };
            setIsAnimating(false);
            return;
        }

        let arrayToDraw = [...initialArrayRef.current];
        let sortedIndices = [];
        let lessThanIndices = [];
        let greaterThanIndices = [];

        for (let i = 0; i <= prevStepIndex; i++) {
            const step = steps[i];
            if (step.type === "swap") {
                [arrayToDraw[step.index1], arrayToDraw[step.index2]] = [arrayToDraw[step.index2], arrayToDraw[step.index1]];
                [lessThanIndices, greaterThanIndices] = [lessThanIndices, greaterThanIndices].map(indices =>
                    indices.map(idx => {
                        if (idx === step.index1) return step.index2;
                        if (idx === step.index2) return step.index1;
                        return idx;
                    })
                );
            } else if (step.type === "compare") {
                const pivotValue = arrayToDraw[step.pivot];
                const comparedValue = arrayToDraw[step.left];
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
            } else if (step.type === "partition") {
                sortedIndices.push(step.pivot);
                lessThanIndices = [];
                greaterThanIndices = [];
            } else if (step.type === "sorted") {
                sortedIndices = [...new Set([...sortedIndices, ...step.indices])];
                lessThanIndices = [];
                greaterThanIndices = [];
            }
        }

        await drawBars(arrayToDraw, false);
        setNumberArr([...arrayToDraw]);
        movedBarsRef.current = { lessThan: lessThanIndices, greaterThan: greaterThanIndices };

        const prevStep = steps[prevStepIndex];
        if (prevStep.type === "pivot") {
            await highlightBars(
                { pivotIndex: prevStep.pivot, compareIndices: [], lessThanIndices, greaterThanIndices },
                sortedIndices
            );
        } else if (prevStep.type === "compare") {
            await highlightBars(
                { pivotIndex: prevStep.pivot, compareIndices: [prevStep.left], lessThanIndices, greaterThanIndices },
                sortedIndices
            );
        } else if (prevStep.type === "swap") {
            await highlightBars(
                { pivotIndex: prevStep.pivot, compareIndices: [prevStep.index1, prevStep.index2], lessThanIndices, greaterThanIndices },
                sortedIndices
            );
        } else if (prevStep.type === "partition") {
            await highlightBars(
                { pivotIndex: prevStep.pivot, compareIndices: [], lessThanIndices: [], greaterThanIndices: [] },
                sortedIndices
            );
        } else if (prevStep.type === "sorted") {
            await highlightBars(
                { pivotIndex: null, compareIndices: [], lessThanIndices: [], greaterThanIndices: [] },
                sortedIndices
            );
        }

        setIsAnimating(false);
    };

    const animateSortSteps = async (steps) => {
        if (!Array.isArray(steps) || steps.length === 0) {
            console.error("Invalid steps array:", steps);
            setError("Invalid sorting steps received");
            return;
        }

        let sortedIndices = [];
        let lessThanIndices = [];
        let greaterThanIndices = [];
        let currentArray = [...initialArrayRef.current]; // Initialize with initial array


        for (let i = 0; i < steps.length; i++) {
            if (isCancelledRef.current) {
                break;
            }

            const step = steps[i];

            try {
                if (step.type === "pivot") {
                    if (typeof step.pivot !== "number") throw new Error("Invalid pivot index");
                    await highlightBars(
                        { pivotIndex: step.pivot, compareIndices: [], lessThanIndices, greaterThanIndices },
                        sortedIndices
                    );
                    await new Promise(resolve => {
                        const timeout = setTimeout(resolve, speedRef.current);
                        sortingPromiseRef.current = { abort: () => clearTimeout(timeout) };
                    });
                } else if (step.type === "compare") {
                    if (typeof step.pivot !== "number" || typeof step.left !== "number") throw new Error("Invalid compare indices");
                    await highlightBars(
                        { pivotIndex: step.pivot, compareIndices: [step.left], lessThanIndices, greaterThanIndices },
                        sortedIndices
                    );
                    await new Promise(resolve => {
                        const timeout = setTimeout(resolve, speedRef.current);
                        sortingPromiseRef.current = { abort: () => clearTimeout(timeout) };
                    });
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
                        { pivotIndex: step.pivot, compareIndices: [], lessThanIndices, greaterThanIndices },
                        sortedIndices
                    );
                    await new Promise(resolve => {
                        const timeout = setTimeout(resolve, speedRef.current);
                        sortingPromiseRef.current = { abort: () => clearTimeout(timeout) };
                    });
                } else if (step.type === "swap") {
                    if (typeof step.index1 !== "number" || typeof step.index2 !== "number") throw new Error("Invalid swap indices");
                    await highlightBars(
                        { pivotIndex: step.pivot, compareIndices: [step.index1, step.index2], lessThanIndices, greaterThanIndices },
                        sortedIndices
                    );
                    // Update array before swap
                    [currentArray[step.index1], currentArray[step.index2]] = [currentArray[step.index2], currentArray[step.index1]];
                    setNumberArr([...currentArray]);
                    [lessThanIndices, greaterThanIndices] = [lessThanIndices, greaterThanIndices].map(indices =>
                        indices.map(i => {
                            if (i === step.index1) return step.index2;
                            if (i === step.index2) return step.index1;
                            return i;
                        })
                    );
                    await swapBars(step.index1, step.index2, currentArray);
                    await drawBars(currentArray, false); // Enforce correct positions
                    await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
                    await highlightBars(
                        { pivotIndex: step.pivot, compareIndices: [], lessThanIndices, greaterThanIndices },
                        sortedIndices
                    );
                    await new Promise(resolve => {
                        const timeout = setTimeout(resolve, speedRef.current);
                        sortingPromiseRef.current = { abort: () => clearTimeout(timeout) };
                    });
                } else if (step.type === "partition") {
                    if (typeof step.pivot !== "number") throw new Error("Invalid partition pivot");
                    sortedIndices.push(step.pivot);
                    lessThanIndices = [];
                    greaterThanIndices = [];
                    await highlightBars(
                        { pivotIndex: step.pivot, compareIndices: [], lessThanIndices: [], greaterThanIndices: [] },
                        sortedIndices
                    );
                    await new Promise(resolve => {
                        const timeout = setTimeout(resolve, speedRef.current);
                        sortingPromiseRef.current = { abort: () => clearTimeout(timeout) };
                    });
                } else if (step.type === "sorted") {
                    if (!Array.isArray(step.indices)) throw new Error("Invalid sorted indices");
                    sortedIndices = [...new Set([...sortedIndices, ...step.indices])];
                    lessThanIndices = [];
                    greaterThanIndices = [];
                    await highlightBars(
                        { pivotIndex: null, compareIndices: [], lessThanIndices, greaterThanIndices },
                        sortedIndices
                    );
                    await drawBars(currentArray, false);
                    await new Promise(resolve => {
                        const timeout = setTimeout(resolve, speedRef.current);
                        sortingPromiseRef.current = { abort: () => clearTimeout(timeout) };
                    });
                } else {
                    console.warn(`Unknown step type at index ${i}:`, step);
                }
            } catch (error) {
                console.error(`Error in step ${i}:`, error);
                setError(`Animation failed at step ${i}: ${error.message}`);
                break;
            }
        }
    };

    const startSorting = async () => {
        if (numberArr.length === 0) {
            console.error("No numbers to sort");
            setError("No numbers to sort");
            return;
        }

        if (isButtonDisabled) {
            return;
        }

        setIsButtonDisabled(true);
        setTimeout(() => {
            setIsButtonDisabled(false);
        }, 1000);


        // Cancel ongoing animations
        if (isSorting || isAnimating) {
            await cancelCurrentAnimation();
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        setIsSorting(true);
        setIsAnimating(true);
        isCancelledRef.current = false;

        try {
            // Clear all SVG elements and transitions
            d3.select(svgRef.current)
                .selectAll("*")
                .interrupt()
                .remove();

            // Validate initial array
            const initialArray = initialArrayRef.current && initialArrayRef.current.length > 0
                ? [...initialArrayRef.current]
                : currentInput
                    .map(num => parseInt(num.trim(), 10))
                    .filter(num => !isNaN(num));

            if (!initialArray.length || !initialArray.every(num => !isNaN(num))) {
                console.error("Invalid initial array:", initialArray);
                throw new Error("Invalid initial array");
            }


            // Reset state
            setCurrentStepIndex(-1);
            setSteps([]);
            setNumberArr(initialArray); // Set numberArr early
            movedBarsRef.current = { lessThan: [], greaterThan: [] };

            // Force redraw with animation
            await drawBars(initialArray, true);
            resetHighlight();

            // Ensure UI update
            await new Promise(resolve => setTimeout(resolve, 1000));

            const controller = new AbortController();
            sortingPromiseRef.current = controller;
            const startTime = performance.now();
            const response = await axios.post(`${API_URL}/sort/quick`, {
                array: initialArray
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            // Record end time and calculate execution time
            const endTime = performance.now();
            setExecutionTime((endTime - startTime) / 1000);

            setSteps(response.data.steps);
            await animateSortSteps(response.data.steps);
            setCurrentStepIndex(response.data.steps.length - 1);
        } catch (err) {
            if (axios.isCancel(err) || isCancelledRef.current) {
                return;
            }
            console.error("Start sorting error:", err);
            setError(err.response?.data?.detail || err.message || 'Failed to process quick sort');
        } finally {
            resetHighlight();
            setIsSorting(false);
            setIsAnimating(false);
            sortingPromiseRef.current = null;
            isCancelledRef.current = false;
        }
    };

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
                                                    <div className="badge badge-primary badge-lg font-mono font-bold">O(n log n)</div>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                    <span className="font-semibold text-base-content/80">Space Complexity:</span>
                                                    <div className="badge badge-primary badge-outline badge-lg font-mono font-bold">O(n)</div>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-4 bg-info/10 rounded-xl border-l-4 border-info">
                                                <p className="text-sm text-base-content/80 leading-relaxed">
                                                    Quick Sort partitions the array around a pivot, recursively sorting subarrays on each side,
                                                    resulting in logarithmic average time complexity with linear space usage.
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
                    <button className="btn btn-accent btn-sm w-full lg:btn-md xl:w-auto" onClick={startSorting} disabled={isSorting || isAnimating || isButtonDisabled}>
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

export default QuickSort;