import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import axios from "axios";
import NavBar from "../../components/navBar.jsx";

const MergeSort = () => {
    const [inputValue, setInputValue] = useState("");
    const [numberArr, setNumberArr] = useState([]);
    const [isSorting, setIsSorting] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);
    const [size, setSize] = useState(10);

    const sortingMenu = [
        { label: 'Bubble Sort', path: '/visualizer/sort/bubble' },
        { label: 'Merge Sort', path: '/visualizer/sort/merge' },
        { label: 'Selection Sort', path: '/visualizer/sort/select' },
        { label: 'Insertion Sort', path: '/visualizer/sort/insert' },
        { label: 'Quick Sort', path: '/visualizer/sort/quick' }
    ];

    // VisuAlgo-inspired colors
    const sortedColor = "#00FF00"; // Green for sorted
    const leftHalfColor = "#FF0000"; // Red for left half
    const rightHalfColor = "#0000FF"; // Blue for right half
    const mergedColor = "#800080"; // Purple for merging
    const defaultColor = "#EDE2F3"; // Grey for default
    const FONT_COLOR = "#6E199F"; // Black for text
    const INDEX_COLOR = "#FFFFFF"; // White for index labels

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

            setError(null);
            setIsSubmitting(true);
            if (isSorting) {
                isCancelledRef.current = true;
                d3.select(svgRef.current)
                    .interrupt()
                    .selectAll("*")
                    .interrupt();
                setIsSorting(false);
            }

            setNumberArr(numArray);
            await drawBars(numArray, true, {});
            setIsSubmitting(false);
            resetHighlight();
        } catch (err) {
            setError(err.message);
            setNumberArr([]);
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
        if (isSubmitting) return;

        const input = generateRandomArray(size);
        await animateBars(input);
    };

    const handleSorted = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        const input = numberArr.sort((a, b) => a - b);
        await animateBars(input);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
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
        if (svgRef.current && !isInitializedRef.current) {
            isInitializedRef.current = true;
            handleRandom();
        }
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
        const depthOffset = 50; // 30px per depth level

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

        const getYPosition = (d,i) => {
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
            .attr("y", (d,i) => getYPosition(d,i))
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
            .attr("y", (d) => getLabelYPosition(d));

        enter.append("text")
            .attr("class", "index-label")
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("fill", INDEX_COLOR)
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
            .attr("y", (d,i) => getYPosition(d,i))
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

    const animateMergeSwap = async (beforeArray, afterArray,left,right, depthMap) => {
        const svg = d3.select(svgRef.current);
        const width = svgRef.current.clientWidth || 800;
        const height = 350;
        const margin = { top: 20, right: 20, bottom: 170, left: 40 };
        const barSpacing = 10;
        const maxBarWidth = 50;
        const minBarWidth = 10;
        const minBarHeight = 2;
        const depthOffset = 50;
        const swapYOffset = 50; // Increased y-offset during swap

        let segmentBefore;
        if (right === beforeArray.length) {
            segmentBefore = beforeArray.slice(left);
        } else {
            segmentBefore = beforeArray.slice(left, right + 1);
        }

        // let segmentAfter;
        // if (right === beforeArray.length) {
        //     segmentAfter = afterArray.slice(left);
        // } else {
        //     segmentAfter = afterArray.slice(left, right + 1);
        // }
        const segmentLength = segmentBefore.length;
        const sortedSegment = [...segmentBefore].sort((a, b) => a - b);

        // Create mappings of values to their indices in beforeArray and afterArray
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

        // Track used indices to handle duplicates
        let usedBeforeIndices = {};
        let usedAfterIndices = {};

        for (let i = 0; i < segmentLength; i++) {
            const currentValue = sortedSegment[i];

            const beforeKeys = Object.keys(beforeIndices)
                .filter(key => beforeIndices[key] === currentValue && !usedBeforeIndices[key] && key >= left && key <= right)
                .map(key => parseInt(key));

            // Get target index (i-th occurrence in afterArray)
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

            // Use target indexB’s depth
            const heightA = Math.max(minBarHeight, height - margin.bottom - yScale(valueA));
            const labelYA = heightA > 20 ? yA + heightA - 10 : yA - 10;
            const indexYA = height - margin.bottom + 25 + (depth) * depthOffset;

            // Animate bar A to index B’s position and y-position + y-offset
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

            // Get target index (i-th occurrence in afterArray)
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

            // Use target indexB’s depth
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

    const animateSortSteps = async (steps) => {
        let sortedIndices = [];
        let currentArray = [...numberArr];
        let depthMap = {};

        for (const step of steps) {
            if (isCancelledRef.current) break;

            try {
                if (step.type === "split") {
                    const leftIndices = Array.from({ length: step.mid - step.left + 1 }, (_, i) => step.left + i);
                    const rightIndices = Array.from({ length: step.right - step.mid }, (_, i) => step.mid + 1 + i);
                    await highlightBars(leftIndices, leftHalfColor, sortedIndices);
                    //await new Promise(resolve => setTimeout(resolve, speedRef.current));
                    await highlightBars(rightIndices, rightHalfColor, sortedIndices);
                    //await new Promise(resolve => setTimeout(resolve, speedRef.current));
                } else if (step.type === "recurse") {
                    const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                    indices.forEach(i => { depthMap[i] = step.depth; });
                    await drawBars(currentArray, true, depthMap);
                    await highlightBars(indices, defaultColor, sortedIndices);
                    await new Promise(resolve => setTimeout(resolve, speedRef.current));
                } else if (step.type === "backtrack") {
                    const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                    indices.forEach(i => { depthMap[i] = Math.max(0, (depthMap[i] || 0) - 1); });
                    await drawBars(currentArray, true, depthMap);
                    await new Promise(resolve => setTimeout(resolve, speedRef.current));
                } else if (step.type === "merge_before") {
                    const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                    await highlightBars(indices, leftHalfColor, sortedIndices);
                    await new Promise(resolve => setTimeout(resolve, speedRef.current));
                } else if (step.type === "merge_after") {
                    const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);

                    if (step.after_array && step.before_array) {
                        await animateMergeSwap(step.before_array, step.after_array,step.left,step.right, depthMap);

                        currentArray = [...step.after_array]
                        setNumberArr([...currentArray]);

                        await drawBars([...currentArray], false, depthMap, false);
                        await highlightBars(indices, mergedColor, sortedIndices);
                        await new Promise(resolve => setTimeout(resolve, speedRef.current * 1.5));
                    }
                } else if (step.type === "sorted") {
                    const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                    sortedIndices.push(...indices);
                    const adjustment = indices.some(i => (depthMap[i] || 0) === 1) ? -1 : 0;

                    indices.forEach(i => { depthMap[i] = Math.max(0, (depthMap[i] || 0) + adjustment); });


                    await drawBars(currentArray, true, depthMap);
                    await highlightBars(indices, sortedColor, sortedIndices);
                    await new Promise(resolve => setTimeout(resolve, speedRef.current));
                }
            } catch (err) {
                setError(`Error processing step: ${err.message}`);
                break;
            }
        }
    };

    const startSorting = async () => {
        if (numberArr.length === 0) {
            setError("No numbers to sort");
            return;
        }
        setIsSorting(true);
        isCancelledRef.current = false;
        try {
            const response = await axios.post(`${API_URL}/sort/merge`, {
                array: numberArr
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data;
            await animateSortSteps(data.steps);
        } catch (err) {
            setError(err.response?.data.detail || 'Failed to process merge sort');
        } finally {
            resetHighlight();
            setIsSorting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-base-200 relative">
            <NavBar menuItems={sortingMenu} />
            <div className="flex justify-center mt-6 flex-grow">
                <svg ref={svgRef} className="block w-full h-auto"></svg>
            </div>
            <div className="lg:navbar md:flex sticky bottom-2 z-50 px-4 md:px-6 border-t border-base-200 h-fit min-h-[4rem] shadow-sm">
                <div className="lg:navbar-start mb-2 md:mb-0 flex justify-center items-center">
                    <div className="flex items-center gap-2 w-full">
                        <span className="text-xs font-semibold">SPEED:</span>
                        <input
                            type="range"
                            min={50}
                            max="1000"
                            value={speed}
                            className="range range-primary range-xs w-24 md:w-32"
                            onChange={(e) => setSpeed(Number(e.target.value))}
                        />
                        <span className="text-xs text-base-content/70 whitespace-nowrap">{speed} ms</span>
                    </div>
                </div>

                <div className="lg:navbar-center flex-col sm:flex-row md:flex  justify-center items-center">
                    <button className="btn btn-accent mr-2 sm:mr-2 mb-2 md:mb-0" onClick={handleSorted}>
                        Sorted
                    </button>
                    <button className="btn btn-accent mr-0 sm:mr-4 mb-2 md:mb-0" onClick={startSorting} disabled={isSorting}>
                        Start Sorting
                    </button>
                    <div className="join flex items-center mr-0 sm:mr-4 mb-2 md:mb-0">
                        <input
                            type="text"
                            value={inputValue}
                            className="input join-item rounded-l-lg"
                            onChange={handleInput}
                        />
                        <button
                            className="btn btn-primary join-item rounded-r-lg"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            Go
                        </button>
                    </div>
                    <div className="lg:join flex items-center">
                        <input
                            type="number"
                            value={size}
                            className="input join-item rounded-l-lg w-13"
                            onChange={handleSizeInput}
                        />
                        <button className="btn btn-secondary join-item rounded-r-lg" onClick={handleRandom}>
                            Random
                        </button>
                    </div>
                </div>

                <div className="lg:navbar-end">
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