import { useState, useEffect, useRef, useContext } from 'react';
import * as d3 from 'd3';
import axios from "axios";
import NavBar from "../components/navBar.jsx";
import { ErrorContext } from "../context/errorContext.jsx";

const MergeSort = () => {
    const [inputValue, setInputValue] = useState("");
    const [numberArr, setNumberArr] = useState([]);
    const [isSorting, setIsSorting] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { setError } = useContext(ErrorContext);
    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);
    const [size, setSize] = useState(10);
    const [movedBars, setMovedBars] = useState([]);

    const sortingMenu = [
        { label: 'Bubble Sort', path: '/visualizer/bubblesort' },
        { label: 'Merge Sort', path: '/visualizer/merge' },
        { label: 'Selection Sort', path: '/visualizer/selectionsort' },
        { label: 'Insertion Sort', path: '/visualizer/insertionsort' },
        { label: 'Quick Sort', path: '/visualizer/quick' },
        { label: 'Heap Sort', path: '/visualizer/heap' }
    ];

    // Sorting colors
    const sortedColor = "orange";
    const leftHalfColor = "blue";
    const rightHalfColor = "green";
    const defaultColor = "#EDE2F3";
    const FONT_COLOR = "#6E199F";
    const INDEX_COLOR = "#EDE2F3";

    const handleInput = (e) => {
        e.preventDefault();
        setInputValue(e.target.value);
    };

    const handleSizeInput = (e) => {
        e.preventDefault();
        setSize(e.target.value);
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
                    throw new Error(`Invalid number at position ${index + 1}`);
                }
                return num;
            });

            setError(null);
            setIsSubmitting(true);
            if (isSorting) {
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
            await drawBars(numArray, true, []);
            setIsSubmitting(false);
            resetHighlight();
            isCancelledRef.current = false;
        } catch (err) {
            setError(err.message);
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
            return [];
        }
        return Array(sizeInput).fill(0).map(() => Math.floor(Math.random() * 100));
    }

    const handleRandom = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        const input = generateRandomArray(size);
        await animateBars(input);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        const input = inputValue.split(",").map(item => item.trim()).filter(Boolean);
        await animateBars(input);
    };

    const isInitializedRef = useRef(false);

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

    const drawBars = async (arr, animate = true, movedBarsArr) => {
        const svg = d3.select(svgRef.current);
        const width = svgRef.current.clientWidth;
        const height = 350;
        const margin = { top: 0, right: 20, bottom: 170, left: 40 };
        const maxBarWidth = 50;
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

        const getYPosition = (d, i) => {
            const baseY = yScale(d);
            return movedBarsArr.includes(i) ? baseY + 100 : baseY;
        };

        const getLabelYPosition = (d, i) => {
            const barHeight = Math.max(minBarHeight, height - margin.bottom - yScale(d));
            const baseY = barHeight > 20 ? yScale(d) + barHeight - 10 : yScale(d) - 10;
            return movedBarsArr.includes(i) ? baseY + 100 : baseY;
        };

        const getIndexYPosition = (d, i) => {
            const baseY = height - margin.bottom + 25;
            return movedBarsArr.includes(i) ? baseY + 100 : baseY;
        };

        const enter = barGroups.enter().append("g").attr("class", "bar-group");
        const enterRects = enter.append("rect")
            .attr("fill", defaultColor)
            .attr("x", (d, i) => margin.left + i * (barWidth + barSpacing) + centeredBarWidth)
            .attr("width", barWidth)
            .attr("y", height - margin.bottom)
            .attr("height", 0)
            .transition()
            .duration(animate ? 500 : 0)
            .attr("y", (d, i) => getYPosition(d, i))
            .attr("height", d => Math.max(minBarHeight, height - margin.bottom - yScale(d)));

        enter.append("text")
            .attr("class", "bar-label")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .attr("fill", FONT_COLOR)
            .text(d => d)
            .attr("x", (d, i) => margin.left + i * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
            .attr("y", (d, i) => getLabelYPosition(d, i));

        enter.append("text")
            .attr("class", "index-label")
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("fill", INDEX_COLOR)
            .attr("font-weight", "bold")
            .text((d, i) => i)
            .attr("x", (d, i) => margin.left + i * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
            .attr("y", (d, i) => getIndexYPosition(d, i));

        const updateRects = barGroups.select("rect")
            .transition()
            .duration(animate ? 500 : 0)
            .attr("x", (d, i) => margin.left + i * (barWidth + barSpacing) + centeredBarWidth)
            .attr("width", barWidth)
            .attr("y", (d, i) => getYPosition(d, i))
            .attr("height", d => Math.max(minBarHeight, height - margin.bottom - yScale(d)));

        barGroups.select(".bar-label")
            .transition()
            .duration(animate ? 500 : 0)
            .attr("x", (d, i) => margin.left + i * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
            .attr("y", (d, i) => getLabelYPosition(d, i))
            .text(d => d);

        barGroups.select(".index-label")
            .transition()
            .duration(animate ? 500 : 0)
            .attr("x", (d, i) => margin.left + i * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
            .attr("y", (d, i) => getIndexYPosition(d, i))
            .text((d, i) => i);

        const exit = barGroups.exit();
        const exitRects = exit.select("rect")
            .transition()
            .duration(animate ? 500 : 0)
            .attr("y", height - margin.bottom)
            .attr("height", 0);

        exit.select(".bar-label").remove();
        exit.select(".index-label").remove();

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
                return indexes.includes(i) ? color : sortedIndices.includes(i) ? sortedColor : defaultColor;
            });
    };

    const moveDown = async (indices) => {
        if (isCancelledRef.current) return movedBars;

        const svg = d3.select(svgRef.current);
        const offsetY = 100;
        const barGroups = svg.selectAll(".bar-group");

        const promises = indices.map(async (index) => {
            const barSelected = barGroups.filter((d, i) => i === index);
            const rect = barSelected.select("rect");
            const currentY = parseFloat(rect.attr("y"));
            const barLabel = barSelected.select(".bar-label");
            const currentLabelY = parseFloat(barLabel.attr("y"));
            const barIndex = barSelected.select(".index-label");
            const currentIndexY = parseFloat(barIndex.attr("y"));

            return Promise.all([
                rect.transition().duration(speedRef.current / 2).attr("y", currentY + offsetY).end(),
                barLabel.transition().duration(speedRef.current / 2).attr("y", currentLabelY + offsetY).end(),
                barIndex.transition().duration(speedRef.current / 2).attr("y", currentIndexY + offsetY).end()
            ]);
        });

        await Promise.all(promises);
        const newMovedBars = [...new Set([...movedBars, ...indices])];
        setMovedBars(newMovedBars);
        return newMovedBars;
    };

    const moveUp = async (indices) => {
        if (isCancelledRef.current) return movedBars;

        const svg = d3.select(svgRef.current);
        const height = 350;
        const margin = { top: 0, right: 20, bottom: 170, left: 40 };
        const yScale = d3.scaleLinear()
            .domain([d3.min([0, ...numberArr]) - 1, d3.max(numberArr)])
            .range([height - margin.bottom, margin.top]);

        const barGroups = svg.selectAll(".bar-group");

        const promises = indices.map(async (index) => {
            const barSelected = barGroups.filter((d, i) => i === index);
            const rect = barSelected.select("rect");
            const barValue = numberArr[index];
            const originalY = yScale(barValue);
            const barHeight = parseFloat(rect.attr("height"));
            const barLabel = barSelected.select(".bar-label");
            const originalLabelY = barHeight > 20 ? originalY + barHeight - 10 : originalY - 10;
            const barIndex = barSelected.select(".index-label");
            const originalIndexY = height - margin.bottom + 25;

            return Promise.all([
                rect.transition().duration(speedRef.current / 2).attr("y", originalY).end(),
                barLabel.transition().duration(speedRef.current / 2).attr("y", originalLabelY).end(),
                barIndex.transition().duration(speedRef.current / 2).attr("y", originalIndexY).end()
            ]);
        });

        await Promise.all(promises);
        const newMovedBars = movedBars.filter(i => !indices.includes(i));
        setMovedBars(newMovedBars);
        return newMovedBars;
    };

    const animateSortSteps = async (steps) => {
        let sortedIndices = [];
        let currentMovedBars = [];

        for (const step of steps) {
            if (isCancelledRef.current) break;

            if (step.type === "split") {
                // Highlight left and right halves
                const leftIndices = Array.from({ length: step.mid - step.left + 1 }, (_, i) => step.left + i);
                const rightIndices = Array.from({ length: step.right - step.mid }, (_, i) => step.mid + 1 + i);
                highlightBars(leftIndices, leftHalfColor, sortedIndices);
                await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
                highlightBars(rightIndices, rightHalfColor, sortedIndices);
                await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
            } else if (step.type === "recurse") {
                // Move bars down for recursion
                const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                currentMovedBars = await moveDown(indices);
                await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
            } else if (step.type === "backtrack") {
                // Move bars up for backtracking
                const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                currentMovedBars = await moveUp(indices);
                await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
            } else if (step.type === "merge_before") {
                // Highlight segment before merge
                const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                highlightBars(indices, leftHalfColor, sortedIndices);
                await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
            } else if (step.type === "merge_after") {
                // Update array with sorted segment
                const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                const newArray = [...numberArr];
                step.after_array.forEach((value, i) => {
                    newArray[step.left + i] = value;
                });
                setNumberArr(newArray);
                await drawBars(newArray, true, currentMovedBars);
                highlightBars(indices, rightHalfColor, sortedIndices);
                await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
            } else if (step.type === "sorted") {
                // Mark segment as sorted
                const indices = Array.from({ length: step.right - step.left + 1 }, (_, i) => step.left + i);
                sortedIndices.push(...indices);
                highlightBars(sortedIndices, sortedColor);
                await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
            }
        }
    };

    const startSorting = async () => {
        if (numberArr.length > 0) {
            setIsSorting(true);
            isCancelledRef.current = false;
            try {
                const response = await axios.post('http://127.0.0.1:8000/sort/merge', {
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
            }
            resetHighlight();
            setIsSorting(false);
        }
    };

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

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
                    <button className="btn mr-2">
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
                        />
                    </div>
                    <div className="flex justify-center w-full max-w-md">
                        <input
                            type="range"
                            min={50}
                            max="1000"
                            value={speed}
                            className="range range-primary"
                            onChange={(e) => setSpeed(Number(e.target.value))}
                        />
                        <span>Speed: {speed} ms</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MergeSort;