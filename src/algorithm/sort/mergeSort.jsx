import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import axios from "axios";
import NavBar from "../../components/navBar.jsx";
import AlgorithmNavbar from "../algorithmNavbar.jsx";
import {useSound} from "../../context/soundContext.jsx";
import * as Tone from "tone";
import SoundToggle from "../../components/utils/soundToggle.jsx";

const MergeSort = () => {
    const [inputValue, setInputValue] = useState("");
    const [numberArr, setNumberArr] = useState([]);
    const [isSorting, setIsSorting] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [size, setSize] = useState(10);
    const [showComplexity, setShowComplexity] = useState(false);
    const [executionTime, setExecutionTime] = useState(null);
    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);
    const initialArrayRef = useRef([]);
    const synthRef = useRef(null);
    const { soundEnabled } = useSound();
    const soundRef = useRef(soundEnabled);
    const [pseudocodeHighlight, setPseudocodeHighlight] = useState(null);

    // VisuAlgo-inspired colors
    const sortedColor = "#00FF00"; // Green for sorted
    const leftHalfColor = "#FF0000"; // Red for left half
    const rightHalfColor = "#0000FF"; // Blue for right half
    const mergedColor = "#800080"; // Purple for merging
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

    const API_URL = 'https://algoverse-backend-python.onrender.com';

    const handleInput = (e) => {
        setInputValue(e.target.value);
    };

    const handleSizeInput = (e) => {
        const value = Number(e.target.value);
        if (Number.isInteger(value) && value >= 0) {
            if (e.target.value > 50) {
                setError("Maximum size is 50.");
                return;
            }
            if (e.target.value < 0) {
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
            setPseudocodeHighlight(null);
            setError(null);
            setIsSubmitting(true);
            if (isSorting || isAnimating) {
                isCancelledRef.current = true;
                d3.select(svgRef.current)
                    .interrupt()
                    .selectAll("*")
                    .interrupt();
                setIsSorting(false);
                setIsAnimating(false);
            }

            setNumberArr(numArray);
            initialArrayRef.current = [...numArray];
            setCurrentStepIndex(-1);
            setSteps([]);

            await drawBars(numArray, true, {});
            resetHighlight();

            // Fetch sorting steps
            try {
                const startTime = performance.now();
                const response = await axios.post(`${API_URL}/sort/merge`, {
                    array: numArray
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const endTime = performance.now();
                setExecutionTime((endTime - startTime) / 1000);
                setSteps(response.data.steps);
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to fetch merge sort steps');
                setSteps([]);
            }

            setIsSubmitting(false);
        } catch (err) {
            setError(err.message);
            setNumberArr([]);
            setSteps([]);
            setIsSubmitting(false);
            resetHighlight();
        } finally {
            isCancelledRef.current = false;
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
        if (input.length === 0) {
            setError("Please enter at least one number");
            return;
        }
        await animateBars(input);
    };

    const isInitializedRef = useRef(false);

    useEffect(() => {
        speedRef.current = speed;
        const initializeVisualization = async () => {
            if (svgRef.current && !isInitializedRef.current) {
                isInitializedRef.current = true;
                await handleRandom();
            }
        };
        initializeVisualization();
    }, [speed]);

    const drawBars = async (arr, animate = true, depthMap = {}, animateX = true) => {
        const svg = d3.select(svgRef.current);
        const width = svgRef.current.clientWidth || 800;
        const height = 350;
        const margin = { top: 20, right: 20, bottom: 170, left: 40 };
        const maxBarWidth = 50;
        const barSpacing = 10;
        const minBarWidth = 10;
        const minBarHeight = 2;
        const depthOffset = 50;

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

        const getYPosition = (d, i) => {
            const baseY = yScale(d.value);
            const depth = depthMap[d.index] || 0;
            return baseY + depth * depthOffset;
        };

        const getLabelYPosition = (d) => {
            const barHeight = Math.max(minBarHeight, height - margin.bottom - yScale(d.value));
            const baseY = barHeight > 20 ? yScale(d.value) + barHeight - 10 : yScale(d.value) - 10;
            const depth = depthMap[d.index] || 0;
            return baseY + depth * depthOffset;
        };

        const getIndexYPosition = (d) => {
            const baseY = height - margin.bottom + 25;
            const depth = depthMap[d.index] || 0;
            return baseY + depth * depthOffset;
        };

        const enter = barGroups.enter().append("g").attr("class", "bar-group");
        const enterRects = enter.append("rect")
            .attr("fill", defaultColor)
            .attr("x", (d) => margin.left + d.index * (barWidth + barSpacing) + centeredBarWidth)
            .attr("width", barWidth)
            .attr("y", height - margin.bottom)
            .attr("height", 0)
            .transition()
            .duration(animate ? speedRef.current : 0)
            .attr("y", (d, i) => getYPosition(d, i))
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
            .attr("y", (d) => getLabelYPosition(d));

        enter.append("text")
            .attr("class", "index-label")
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("fill", "var(--index-color)")
            .attr("font-weight", "bold")
            .text((d) => d.index)
            .attr("x", (d) => margin.left + d.index * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
            .attr("y", (d) => getIndexYPosition(d));

        const updateRects = barGroups.select("rect")
            .transition()
            .duration(animateX ? speedRef.current : 0)
            .attr("x", (d) => margin.left + d.index * (barWidth + barSpacing) + centeredBarWidth)
            .duration(animate ? speedRef.current : 0)
            .attr("width", barWidth)
            .attr("y", (d, i) => getYPosition(d, i))
            .attr("height", (d) => Math.max(minBarHeight, height - margin.bottom - yScale(d.value)));

        barGroups.select(".bar-label")
            .transition()
            .duration(animateX ? speedRef.current : 0)
            .attr("x", (d) => margin.left + d.index * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
            .duration(animate ? speedRef.current : 0)
            .attr("y", (d) => getLabelYPosition(d))
            .text((d) => d.value);

        barGroups.select(".index-label")
            .transition()
            .duration(animateX ? speedRef.current : 0)
            .attr("x", (d) => margin.left + d.index * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
            .duration(animate ? speedRef.current : 0)
            .attr("y", (d) => getIndexYPosition(d))
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

    const highlightBars = async (indexes, color, sortedIndices = []) => {
        await d3.select(svgRef.current)
            .selectAll(".bar-group rect")
            .transition()
            .duration(speedRef.current / 2)
            .attr("fill", (d) => indexes.includes(d.index) ? color : sortedIndices.includes(d.index) ? sortedColor : defaultColor)
            .end();
    };

    const animateMergeSwap = async (beforeArray, afterArray, left, right, depthMap) => {
        const svg = d3.select(svgRef.current);
        const width = svgRef.current.clientWidth || 800;
        const height = 350;
        const margin = { top: 20, right: 20, bottom: 170, left: 40 };
        const barSpacing = 10;
        const maxBarWidth = 50;
        const minBarWidth = 10;
        const minBarHeight = 2;
        const depthOffset = 50;
        const swapYOffset = 50;

        let segmentBefore;
        if (right === beforeArray.length) {
            segmentBefore = beforeArray.slice(left);
        } else {
            segmentBefore = beforeArray.slice(left, right + 1);
        }

        const segmentLength = segmentBefore.length;
        const sortedSegment = [...segmentBefore].sort((a, b) => a - b);

        const beforeIndices = {};
        const afterIndices = {};
        beforeArray.forEach((val, idx) => {
            beforeIndices[idx] = val;
        });
        afterArray.forEach((val, idx) => {
            afterIndices[idx] = val;
        });

        const yScale = d3.scaleLinear()
            .domain([Math.min(0, ...beforeArray) - 1, Math.max(...beforeArray) + 1])
            .range([height - margin.bottom, margin.top]);

        let barWidth = (width - margin.left - margin.right) / Math.max(1, beforeArray.length) - barSpacing;
        barWidth = Math.min(Math.max(barWidth, minBarWidth), maxBarWidth);
        const centeredBarWidth = (width - margin.left - margin.right - beforeArray.length * (barWidth + barSpacing)) / 2;

        let usedBeforeIndices = {};
        let usedAfterIndices = {};

        for (let i = 0; i < segmentLength; i++) {
            const currentValue = sortedSegment[i];

            const beforeKeys = Object.keys(beforeIndices)
                .filter(key => beforeIndices[key] === currentValue && !usedBeforeIndices[key] && key >= left && key <= right)
                .map(key => parseInt(key));

            const afterKeys = Object.keys(afterIndices)
                .filter(key => afterIndices[key] === currentValue && !usedAfterIndices[key] && key >= left && key <= right)
                .map(key => parseInt(key));

            const currentIndex = beforeKeys[0];
            const targetIndex = afterKeys[0];

            usedBeforeIndices[currentIndex] = true;
            usedAfterIndices[targetIndex] = true;

            const barA = svg.selectAll(".bar-group").filter((d) => d.index === currentIndex);

            const xB = margin.left + targetIndex * (barWidth + barSpacing) + centeredBarWidth;

            const valueA = currentValue;
            const depth = depthMap[currentIndex] ? depthMap[currentIndex] + 1 : 1;
            const yA = yScale(valueA) + (depth) * depthOffset;

            const heightA = Math.max(minBarHeight, height - margin.bottom - yScale(valueA));
            const labelYA = heightA > 20 ? yA + heightA - 10 : yA - 10;
            const indexYA = height - margin.bottom + 25 + (depth) * depthOffset;

            await Promise.all([
                barA.select("rect")
                    .transition()
                    .duration(speedRef.current)
                    .attr("x", xB)
                    .attr("y", yA + swapYOffset)
                    .attr("fill", mergedColor)
                    .end(),
                barA.select(".bar-label")
                    .transition()
                    .duration(speedRef.current)
                    .attr("x", xB + barWidth / 2)
                    .attr("y", labelYA + swapYOffset)
                    .end(),
                barA.select(".index-label")
                    .transition()
                    .duration(speedRef.current)
                    .attr("x", xB + barWidth / 2)
                    .attr("y", indexYA + swapYOffset)
                    .text(targetIndex)
                    .end()
            ]);
        }

        usedBeforeIndices = {};
        usedAfterIndices = {};
        const transitions = [];

        for (let i = 0; i < segmentLength; i++) {
            const currentValue = sortedSegment[i];
            const beforeKeys = Object.keys(beforeIndices)
                .filter(key => beforeIndices[key] === currentValue && !usedBeforeIndices[key] && key >= left && key <= right)
                .map(key => parseInt(key));

            const afterKeys = Object.keys(afterIndices)
                .filter(key => afterIndices[key] === currentValue && !usedAfterIndices[key] && key >= left && key <= right)
                .map(key => parseInt(key));

            const currentIndex = beforeKeys[0];
            const targetIndex = afterKeys[0];

            usedBeforeIndices[currentIndex] = true;
            usedAfterIndices[targetIndex] = true;

            const barA = svg.selectAll(".bar-group").filter((d) => d.index === currentIndex);

            const xB = margin.left + targetIndex * (barWidth + barSpacing) + centeredBarWidth;

            const valueA = currentValue;
            const depth = depthMap[currentIndex] ? depthMap[currentIndex] + 1 : 1;
            const yA = yScale(valueA) + (depth) * depthOffset;

            const heightA = Math.max(minBarHeight, height - margin.bottom - yScale(valueA));
            const labelYA = heightA > 20 ? yA + heightA - 10 : yA - 10;
            const indexYA = height - margin.bottom + 25 + (depth) * depthOffset;

            transitions.push(
                barA.select("rect")
                    .transition()
                    .duration(speedRef.current)
                    .attr("x", xB)
                    .attr("y", yA - swapYOffset)
                    .attr("fill", mergedColor)
                    .end(),
                barA.select(".bar-label")
                    .transition()
                    .duration(speedRef.current)
                    .attr("x", xB + barWidth / 2)
                    .attr("y", labelYA - swapYOffset)
                    .end(),
                barA.select(".index-label")
                    .transition()
                    .duration(speedRef.current)
                    .attr("x", xB + barWidth / 2)
                    .attr("y", indexYA - swapYOffset)
                    .text(targetIndex)
                    .end()
            );
        }

        await Promise.all(transitions);
    };

    const animateSingleStep = async (step, isForward = true) => {
        setIsAnimating(true);
        let sortedIndices = steps
            .slice(0, currentStepIndex + (isForward ? 1 : 0))
            .filter(s => s.type === "sorted")
            .flatMap(s => Array.from({ length: s.right - s.left + 1 }, (_, i) => s.left + i));

        let currentArray = [...numberArr];
        let depthMap = {};
        steps.slice(0, currentStepIndex + (isForward ? 1 : 0))
            .forEach(s => {
                if (s.type === "recurse") {
                    Array.from({ length: s.right - s.left + 1 }, (_, i) => s.left + i)
                        .forEach(i => { depthMap[i] = s.depth; });
                } else if (s.type === "backtrack") {
                    Array.from({ length: s.right - s.left + 1 }, (_, i) => s.left + i)
                        .forEach(i => { depthMap[i] = Math.max(0, (depthMap[i] || 0) - 1); });
                }
            });

        try {
            if (step.type === "split") {
                const leftIndices = Array.from({ length: step.mid - step.left + 1 }, (_, i) => step.left + i);
                const rightIndices = Array.from({ length: step.right - step.mid }, (_, i) => step.mid + 1 + i);
                await highlightBars(leftIndices, leftHalfColor, sortedIndices);
                setPseudocodeHighlight(3);
                if (soundRef.current) synthRef.current.triggerAttackRelease('C4', '16n');
                await delay(100);
                if (soundRef.current) synthRef.current.triggerAttackRelease('E4', '16n');
                await delay(speedRef.current / 2);
                await highlightBars(rightIndices, rightHalfColor, sortedIndices);
            } else if (step.type === "recurse") {
                const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                indices.forEach(i => { depthMap[i] = step.depth; });
                await drawBars(currentArray, true, depthMap);
                await highlightBars(indices, defaultColor, sortedIndices);
                setPseudocodeHighlight(2);
                if (soundRef.current) synthRef.current.triggerAttackRelease('G3', '8n');
                await delay(speedRef.current / 2);
            } else if (step.type === "backtrack") {
                const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                indices.forEach(i => { depthMap[i] = Math.max(0, (depthMap[i] || 0) - 1); });
                await drawBars(currentArray, true, depthMap);
                setPseudocodeHighlight(6);
                if (soundRef.current) synthRef.current.triggerAttackRelease('A3', '8n');
                await delay(speedRef.current / 2);
            } else if (step.type === "merge_before") {
                const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                await highlightBars(indices, leftHalfColor, sortedIndices);
                setPseudocodeHighlight(7);
                if (soundRef.current) synthRef.current.triggerAttackRelease('D4', '8n');
                await delay(speedRef.current / 2);
            } else if (step.type === "merge_after") {
                const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                if (step.after_array && step.before_array) {
                    await animateMergeSwap(step.before_array, step.after_array, step.left, step.right, depthMap);
                    currentArray = [...step.after_array];
                    setNumberArr([...currentArray]);
                    await drawBars(currentArray, false, depthMap, false);
                    await highlightBars(indices, mergedColor, sortedIndices);
                    setPseudocodeHighlight(8);
                    if (soundRef.current) synthRef.current.triggerAttackRelease('F4', '4n');
                    await delay(speedRef.current / 2);
                }
            } else if (step.type === "sorted") {
                const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                sortedIndices.push(...indices);
                indices.forEach(i => { depthMap[i] = Math.max(0, (depthMap[i] || 0) - 1); });
                await drawBars(currentArray, true, depthMap);
                await highlightBars(indices, sortedColor, sortedIndices);
                setPseudocodeHighlight(9);
                if (soundRef.current) synthRef.current.triggerAttackRelease('C5', '4n');
                await delay(speedRef.current / 2);
            }
        } catch (err) {
            setError(`Error in step: ${err.message}`);
        } finally {
            setIsAnimating(false);
        }
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
            await drawBars(initialArrayRef.current, false, {});
            resetHighlight();
            setNumberArr([...initialArrayRef.current]);
            setPseudocodeHighlight(null);
            setIsAnimating(false);
            return;
        }

        let currentArray = [...initialArrayRef.current];
        let depthMap = {};
        let sortedIndices = [];

        for (let i = 0; i <= prevStepIndex; i++) {
            const step = steps[i];
            if (step.type === "recurse") {
                Array.from({ length: step.right - step.left + 1 }, (_, j) => step.left + j)
                    .forEach(j => { depthMap[j] = step.depth; });
            } else if (step.type === "backtrack") {
                Array.from({ length: step.right - step.left + 1 }, (_, j) => step.left + j)
                    .forEach(j => { depthMap[j] = Math.max(0, (depthMap[j] || 0) - 1); });
            } else if (step.type === "merge_after" && step.after_array) {
                currentArray = [...step.after_array];
            } else if (step.type === "sorted") {
                setPseudocodeHighlight(9);
                sortedIndices.push(...Array.from({ length: step.right - step.left + 1 }, (_, j) => step.left + j));
            }
        }

        setNumberArr([...currentArray]);
        await drawBars(currentArray, false, depthMap);

        const prevStep = steps[prevStepIndex];
        if (prevStep.type === "split") {
            setPseudocodeHighlight(3);
            const leftIndices = Array.from({ length: prevStep.mid - prevStep.left + 1 }, (_, i) => prevStep.left + i);
            await highlightBars(leftIndices, leftHalfColor, sortedIndices);
        } else if (prevStep.type === "recurse" || prevStep.type === "backtrack") {
            if (prevStep.type === "recurse") setPseudocodeHighlight(2);
            if (prevStep.type === "backtrack") setPseudocodeHighlight(6);
            await highlightBars([], defaultColor, sortedIndices);
        } else if (prevStep.type === "merge_before") {
            setPseudocodeHighlight(7);
            const indices = Array.from({ length: prevStep.right - prevStep.left + 1 }, (_, i) => prevStep.left + i);
            await highlightBars(indices, leftHalfColor, sortedIndices);
        } else if (prevStep.type === "merge_after") {
            setPseudocodeHighlight(8);
            const indices = Array.from({ length: prevStep.right - prevStep.left + 1 }, (_, i) => prevStep.left + i);
            await highlightBars(indices, mergedColor, sortedIndices);
        } else if (prevStep.type === "sorted") {
            setPseudocodeHighlight(9);
            await highlightBars([], defaultColor, sortedIndices);
        }

        setIsAnimating(false);
    };

    const animateSortSteps = async (steps) => {
        setIsAnimating(true);
        let sortedIndices = [];
        let currentArray = [...initialArrayRef.current];
        let depthMap = {};

        for (let i = 0; i < steps.length; i++) {
            if (isCancelledRef.current) break;
            setCurrentStepIndex(i);
            const step = steps[i];

            try {
                if (step.type === "split") {
                    const leftIndices = Array.from({ length: step.mid - step.left + 1 }, (_, i) => step.left + i);
                    const rightIndices = Array.from({ length: step.right - step.mid }, (_, i) => step.mid + i + 1);
                    await highlightBars(leftIndices, leftHalfColor, sortedIndices);
                    await highlightBars(rightIndices, rightHalfColor, sortedIndices);
                    setPseudocodeHighlight(3);
                    if (soundRef.current) synthRef.current.triggerAttackRelease('C4', '16n');
                    await delay(100);
                    if (soundRef.current) synthRef.current.triggerAttackRelease('E4', '16n');
                } else if (step.type === "recurse") {
                    const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                    indices.forEach(i => { depthMap[i] = step.depth; });
                    await drawBars(currentArray, true, depthMap);
                    await highlightBars(indices, defaultColor, sortedIndices);
                    setPseudocodeHighlight(2);
                    if (soundRef.current) synthRef.current.triggerAttackRelease('G3', '8n');
                    await delay(speedRef.current);
                } else if (step.type === "backtrack") {
                    const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                    indices.forEach(i => { depthMap[i] = Math.max(0, (depthMap[i] || 0) - 1); });
                    await drawBars(currentArray, true, depthMap);
                    setPseudocodeHighlight(6);
                    if (soundRef.current) synthRef.current.triggerAttackRelease('A3', '8n');
                    await delay(speedRef.current);
                } else if (step.type === "merge_before") {
                    const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                    await highlightBars(indices, leftHalfColor, sortedIndices);
                    setPseudocodeHighlight(7);
                    if (soundRef.current) synthRef.current.triggerAttackRelease('D4', '8n');
                    await delay(speedRef.current);
                } else if (step.type === "merge_after") {
                    const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                    if (step.after_array && step.before_array) {
                        await animateMergeSwap(step.before_array, step.after_array, step.left, step.right, depthMap);
                        currentArray = [...step.after_array];
                        setNumberArr([...currentArray]);
                        await drawBars(currentArray, false, depthMap, false);
                        await highlightBars(indices, mergedColor, sortedIndices);
                        setPseudocodeHighlight(8);
                        if (soundRef.current) synthRef.current.triggerAttackRelease('F4', '4n');
                        await delay(speedRef.current * 1.5);
                    }
                } else if (step.type === "sorted") {
                    const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                    sortedIndices.push(...indices);
                    const adjustment = indices.some(i => (depthMap[i] || 0) === 1) ? -1 : 0;
                    indices.forEach(i => { depthMap[i] = Math.max(0, (depthMap[i] || 0) + adjustment); });
                    await drawBars(currentArray, true, depthMap);
                    await highlightBars(indices, sortedColor, sortedIndices);
                    setPseudocodeHighlight(9);
                    if (soundRef.current) synthRef.current.triggerAttackRelease('C5', '4n');
                    await delay(speedRef.current);
                }
            } catch (err) {
                setError(`Error processing step ${i}: ${err.message}`);
                break;
            }
        }
        setPseudocodeHighlight(10);
        setIsAnimating(false);
    };

    const startSorting = async () => {
        if (numberArr.length === 0) {
            setError("No numbers to sort");
            return;
        }
        if (isSorting || isAnimating) return;
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
            setNumberArr([...initialArrayRef.current]);
            await drawBars(initialArrayRef.current, false, {});
            resetHighlight();

            if (steps.length === 0) {
                const startTime = performance.now();
                const response = await axios.post(`${API_URL}/sort/merge`, {
                    array: initialArrayRef.current
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                setSteps(response.data.steps);
                const endTime = performance.now();
                setExecutionTime((endTime - startTime) / 1000);
            }

            await animateSortSteps(steps);
            setCurrentStepIndex(steps.length - 1);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to process merge sort');
        } finally {
            resetHighlight();
            setIsSorting(false);
            setIsAnimating(false);
            isCancelledRef.current = false;
        }
    };

    return (
        <div className="flex flex-col scrollbar-hide overflow-auto h-screen bg-base-200 relative">
            <NavBar/>
            <AlgorithmNavbar/>
            {/* Complexity Information */}
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
                                <span className="text-primary">Algorithm Performance Analysis</span>
                            </div>
                        </div>
                        <div className="collapse-content bg-base-100">
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
                                                    Merge Sort divides the array into halves recursively, sorts them, and merges the sorted halves,
                                                    achieving logarithmic depth with linear space for merging.
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

            <div className="flex justify-center mt-6 flex-grow">
                <svg ref={svgRef} className="block w-full h-auto"></svg>
                <details open className="hidden lg:block dropdown dropdown-left dropdown-center fixed bottom-1/3 right-2">
                    <summary className="btn m-1 bg-base-content text-base-200">{"<"}</summary>
                    {/* Pseudocode Panel */}
                    <div tabIndex="-1"  className="absolute dropdown-content menu rounded-box z-1 p-2 lg:w-fit lg:sticky lg:top-6 self-start">
                        <div className="card bg-base-100 shadow-lg border border-base-300">
                            <div className="card-body p-3 w-70">
                                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="16 18 22 12 16 6"></polyline>
                                        <polyline points="8 6 2 12 8 18"></polyline>
                                    </svg>
                                    Pseudocode
                                </h3>
                                <div className="bg-base-200 rounded-lg p-2 font-mono text-xs space-y-0.5">
                                    <div className={`px-2 py-1 rounded transition-all ${pseudocodeHighlight === 1 ? 'bg-primary/20 border-l-2 border-primary' : ''}`}>
                                        <span className="text-primary font-bold">function</span> mergeSort(array, left, right):
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-2 ${pseudocodeHighlight === 2 ? 'bg-secondary/20 border-l-2 border-secondary' : ''}`}>
                                        <span className="text-secondary font-bold">if</span> left {'<'} right:
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-4 ${pseudocodeHighlight === 3 ? 'bg-warning/20 border-l-2 border-warning' : ''}`}>
                                        mid = (left + right) / 2
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-4 ${pseudocodeHighlight === 4 ? 'bg-info/20 border-l-2 border-info' : ''}`}>
                                        mergeSort(array, left, mid)
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-4 ${pseudocodeHighlight === 5 ? 'bg-info/20 border-l-2 border-info' : ''}`}>
                                        mergeSort(array, mid+1, right)
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-4 ${pseudocodeHighlight === 6 ? 'bg-accent/20 border-l-2 border-accent' : ''}`}>
                                        <span className="text-accent font-bold">return</span> from recursion
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-4 ${pseudocodeHighlight === 7 ? 'bg-success/20 border-l-2 border-success' : ''}`}>
                                        merge(array, left, mid, right)
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-6 ${pseudocodeHighlight === 8 ? 'bg-success/20 border-l-2 border-success' : ''}`}>
                                        combine sorted halves
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ml-4 ${pseudocodeHighlight === 9 ? 'bg-primary/20 border-l-2 border-primary' : ''}`}>
                                        mark as sorted
                                    </div>
                                    <div className={`px-2 py-1 rounded transition-all ${pseudocodeHighlight === 10 ? 'bg-primary/20 border-l-2 border-primary' : ''}`}>
                                        <span className="text-primary font-bold">return</span> array
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </details>
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
                                    className="input join-item rounded-l-lg w-full md:w-24"
                                    onChange={handleSizeInput}
                                />
                                <button className="btn btn-secondary join-item rounded-r-lg" onClick={handleRandom} disabled={isAnimating}>
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

export default MergeSort;