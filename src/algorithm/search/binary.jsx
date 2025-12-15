import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import NavBar from "../../components/navBar.jsx";
import axios from "axios";
import AlgorithmNavbar from "../algorithmNavbar.jsx";

const Binary = () => {
    const [data, setData] = useState([]);
    const [size, setSize] = useState(10);
    const svgRef = useRef(null);
    const isInitializedRef = useRef(false);
    const [searchValue, setSearchValue] = useState(0);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const timeoutIdsRef = useRef([]); // Store timeout IDs for animation
    const [speed, setSpeed] = useState(500);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);

    // New state for step controls
    const [searchSteps, setSearchSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [isStepMode, setIsStepMode] = useState(false);

    // State for complexity display
    const [showComplexity, setShowComplexity] = useState(false);
    const [executionTime, setExecutionTime] = useState(null);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    // Function to clear all active timeouts
    const clearAnimationTimeouts = () => {
        timeoutIdsRef.current.forEach((id) => clearTimeout(id));
        timeoutIdsRef.current = []; // Reset the array
        isCancelledRef.current = true; // Signal cancellation
    };

    function generateRandomArray(size) {
        const sizeInput = Number(size);
        if (!Number.isInteger(sizeInput) || sizeInput < 0) {
            setError("Size must be a non-negative integer");
            return [];
        }
        const array = Array(sizeInput)
            .fill(0)
            .map(() => Math.floor(Math.random() * 100));
        return array.sort((a, b) => a - b);
    }

    const handleRandom = async (e) => {
        if (e) e.preventDefault();
        clearAnimationTimeouts();
        resetStepMode();
        const randomArray = generateRandomArray(size);
        setData(randomArray);
        await drawArray(randomArray);
    };

    const handleSize = (e) => {
        if (e) e.preventDefault();
        if (e.target.value > 50) {
            setError("Maximum size is 50.");
            return;
        }
        if (e.target.value < 0) {
            setError("Minimum size is 0.");
            return;
        }
        setSize(e.target.value);
    }

    const handleInputChange = (e) => {
        e.preventDefault();
        setData(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        clearAnimationTimeouts(); // Stop any ongoing animations
        isCancelledRef.current = false; // Reset cancellation flag
        resetHighlighting();
        resetStepMode();

        let inputArray;
        if (typeof data === 'string') {
            inputArray = data.split(",").map(item => parseInt(item.trim())).filter(item => !isNaN(item));
        } else if (Array.isArray(data)) {
            inputArray = data.filter(item => !isNaN(item) && Number.isInteger(Number(item)));
        } else {
            setError("Invalid input data");
            return;
        }

        if (inputArray.length === 0) {
            setError("Array cannot be empty");
            return;
        }

        const isSorted = inputArray.every((item, index) => index === 0 || item >= inputArray[index - 1]);

        if (!isSorted) {
            setError("Input array must be sorted in ascending order");
            return;
        }

        setData(inputArray);
        drawArray(inputArray);
    };

    const resetStepMode = () => {
        setSearchSteps([]);
        setCurrentStepIndex(-1);
        setIsStepMode(false);
        setSuccess(null);
        setError(null);
        setExecutionTime(null);
    };

    const drawArray = (arrayData) => {
        if (!svgRef.current) return;

        d3.select(svgRef.current).selectAll("*").remove();

        const margin = { top: 20, right: 20, bottom: 30, left: 20 };
        const width = svgRef.current.clientWidth;
        const minBoxWidth = 40; // Minimum box width for small screens
        const maxBoxWidth = 60; // Maximum box width for large screens
        const boxSpacing = width < 640 ? 3 : 5; // Smaller spacing on mobile
        const rowSpacing = width < 640 ? 20 : 25; // Spacing between rows
        const boxHeight = width < 640 ? 60 : 80; // Smaller height on mobile
        const fontSizeValue = width < 640 ? 16 : 20; // Smaller font on mobile
        const fontSizeIndex = width < 640 ? 12 : 16; // Smaller index font on mobile
        const maxBoxesPerRow = 20; // Maximum boxes per row

        // Calculate number of rows
        const numRows = Math.ceil(arrayData.length / maxBoxesPerRow);
        const boxesPerRow = Math.min(arrayData.length, maxBoxesPerRow);

        // Calculate box width based on available width
        let boxWidth = Math.min(
            maxBoxWidth,
            Math.max(minBoxWidth, (width - margin.left - margin.right) / boxesPerRow - boxSpacing)
        );
        const totalRowWidth = boxesPerRow * (boxWidth + boxSpacing) - boxSpacing; // Subtract final spacing
        const startX = (width - totalRowWidth) / 2; // Center each row horizontally

        // Set SVG height dynamically based on number of rows, with extra space for pointers
        const height = numRows * boxHeight + (numRows - 1) * rowSpacing + margin.top + margin.bottom + 30;

        const svg = d3.select(svgRef.current);
        svg.attr("viewBox", `0 0 ${width} ${height}`);

        svg.selectAll(".outer-box")
            .data(arrayData)
            .enter()
            .append("rect")
            .attr("class", (d, i) => `outer-box outer-box-${i}`)
            .attr("x", (d, i) => {
                const row = Math.floor(i / maxBoxesPerRow);
                const col = i % maxBoxesPerRow;
                return startX + col * (boxWidth + boxSpacing);
            })
            .attr("y", (d, i) => {
                const row = Math.floor(i / maxBoxesPerRow);
                return margin.top + row * (boxHeight + rowSpacing);
            })
            .attr("width", boxWidth)
            .attr("height", boxHeight)
            .attr("fill", "#4338ca")
            .attr("rx", 8)
            .attr("ry", 8);

        svg.selectAll(".value-text")
            .data(arrayData)
            .enter()
            .append("text")
            .attr("class", (d, i) => `value-text value-text-${i}`)
            .attr("x", (d, i) => {
                const row = Math.floor(i / maxBoxesPerRow);
                const col = i % maxBoxesPerRow;
                return startX + col * (boxWidth + boxSpacing) + boxWidth / 2;
            })
            .attr("y", (d, i) => {
                const row = Math.floor(i / maxBoxesPerRow);
                return margin.top + row * (boxHeight + rowSpacing) + boxHeight * 0.35;
            })
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-weight", "bold")
            .attr("font-size", `${fontSizeValue}px`)
            .text(d => d);

        svg.selectAll(".index-box")
            .data(arrayData)
            .enter()
            .append("rect")
            .attr("class", (d, i) => `index-box index-box-${i}`)
            .attr("x", (d, i) => {
                const row = Math.floor(i / maxBoxesPerRow);
                const col = i % maxBoxesPerRow;
                return startX + col * (boxWidth + boxSpacing) + boxWidth * 0.2;
            })
            .attr("y", (d, i) => {
                const row = Math.floor(i / maxBoxesPerRow);
                return margin.top + row * (boxHeight + rowSpacing) + boxHeight * 0.5;
            })
            .attr("width", boxWidth * 0.6)
            .attr("height", boxHeight * 0.35)
            .attr("fill", "#8b5cf6")
            .attr("rx", 4)
            .attr("ry", 4);

        svg.selectAll(".index-text")
            .data(arrayData)
            .enter()
            .append("text")
            .attr("class", (d, i) => `index-text index-text-${i}`)
            .attr("x", (d, i) => {
                const row = Math.floor(i / maxBoxesPerRow);
                const col = i % maxBoxesPerRow;
                return startX + col * (boxWidth + boxSpacing) + boxWidth / 2;
            })
            .attr("y", (d, i) => {
                const row = Math.floor(i / maxBoxesPerRow);
                return margin.top + row * (boxHeight + rowSpacing) + boxHeight * 0.72;
            })
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", `${fontSizeIndex}px`)
            .text((d, i) => i);
    };

    const highlightIndex = (index, color) => {
        d3.select(svgRef.current)
            .select(`.index-box-${index}`)
            .transition()
            .duration(speedRef.current)
            .attr("fill", color);
    };

    const resetHighlighting = () => {
        d3.select(svgRef.current)
            .selectAll(".index-box")
            .transition()
            .duration(speedRef.current)
            .attr("fill", "#8b5cf6");
    };

    // Reset pointers visualization
    const resetPointers = () => {
        d3.select(svgRef.current).selectAll(".pointer").remove();
        d3.select(svgRef.current)
            .selectAll(".index-box")
            .transition()
            .duration(speedRef.current)
            .attr("fill", "#8b5cf6"); // Reset all boxes to default color
    };

    // Update left, right, and mid pointers
    const updatePointers = (left, right, mid = null) => {
        const svg = d3.select(svgRef.current);
        const margin = { top: 20, right: 20, bottom: 30, left: 20 };
        const width = svgRef.current.clientWidth;
        const minBoxWidth = 40;
        const maxBoxWidth = 60;
        const boxSpacing = width < 640 ? 3 : 5;
        const rowSpacing = width < 640 ? 20 : 25; // Match drawArray
        const boxHeight = width < 640 ? 60 : 80;
        const maxBoxesPerRow = 20;
        const boxesPerRow = Math.min(data.length, maxBoxesPerRow);
        const boxWidth = Math.min(
            maxBoxWidth,
            Math.max(minBoxWidth, (width - margin.left - margin.right) / boxesPerRow - boxSpacing)
        );
        const totalRowWidth = boxesPerRow * (boxWidth + boxSpacing) - boxSpacing;
        const startX = (width - totalRowWidth) / 2;

        // Remove existing pointers
        svg.selectAll(".pointer").remove();

        // Map of pointers to their indices
        const pointers = [
            { type: "L", index: left, color: "#00ff00" }, // Green for left
            { type: "R", index: right, color: "#ff00ff" }  // Magenta for right
        ];
        if (mid !== null) {
            pointers.push({ type: "M", index: mid, color: "#ffff00" }); // Yellow for mid
        }

        // Group pointers by index to handle overlaps
        const pointersByIndex = pointers.reduce((acc, p) => {
            if (!acc[p.index]) acc[p.index] = [];
            acc[p.index].push(p);
            return acc;
        }, {});

        // Render pointers, adjusting y-position for overlaps and rows
        Object.entries(pointersByIndex).forEach(([index, pointerList]) => {
            const row = Math.floor(Number(index) / maxBoxesPerRow);
            const col = Number(index) % maxBoxesPerRow;
            const x = startX + col * (boxWidth + boxSpacing) + boxWidth / 2;
            const totalRow = Math.floor(Number(index) % maxBoxesPerRow);
            const fontSize = totalRow <= 0 ? 16 : 24;
            const baseY = margin.top + row * (boxHeight + rowSpacing) + boxHeight + 17;

            if (pointerList.length === 1) {
                // Single pointer, place at base position
                svg.append("text")
                    .attr("class", `pointer pointer-${pointerList[0].type.toLowerCase()}`)
                    .attr("x", x)
                    .attr("y", baseY)
                    .attr("text-anchor", "middle")
                    .attr("fill", pointerList[0].color)
                    .attr("font-size", `${fontSize * (data.length > 25 ? 25 / data.length : 1)}px`)
                    .text(pointerList[0].type);
            } else {
                // Multiple pointers at same index, combine labels
                const label = pointerList.map(p => p.type).join("/");
                svg.append("text")
                    .attr("class", `pointer pointer-combined-${index}`)
                    .attr("x", x)
                    .attr("y", baseY)
                    .attr("text-anchor", "middle")
                    .attr("fill", "#d3d3d3")
                    .attr("font-size", `${fontSize * (data.length > 25 ? 25 / data.length : 1)}px`)
                    .text(label);
            }
        });
    };

    // Dim elements outside the current search range
    const dimOutsideRange = (left, right) => {
        d3.select(svgRef.current)
            .selectAll(".index-box")
            .transition()
            .duration(speedRef.current)
            .attr("fill", (d, i) => {
                if (i >= left && i <= right) {
                    return "#8b5cf6"; // Active range in default color
                }
                return "#555555"; // Dimmed color for out-of-range elements
            });
    };

    const executeStep = (step) => {
        if (step.type === "checking") {
            highlightIndex(step.index, "#ff0000"); // Red for checking
            updatePointers(step.left || 0, step.right || data.length - 1, step.index); // Include mid
            setSuccess(null);
            setError(null);
        } else if (step.type === "found") {
            highlightIndex(step.index, "#0fff00"); // Green for found
            setSuccess(`Found ${searchValue} at index ${step.index}`);
            setError(null);
        } else if (step.type === "not_found") {
            d3.select(svgRef.current)
                .selectAll(".index-box")
                .transition()
                .duration(speedRef.current / 2)
                .attr("fill", "#ff5555");
            setError(`Value ${searchValue} not found in the array`);
            setSuccess(null);
        } else if (step.type === "search_left" || step.type === "search_right") {
            updatePointers(step.left, step.right); // Update L and R only
            dimOutsideRange(step.left, step.right);
            setSuccess(null);
            setError(null);
        }
    };

    const stepForward = () => {
        if (!isStepMode || currentStepIndex >= searchSteps.length - 1) return;

        const nextStepIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextStepIndex);
        executeStep(searchSteps[nextStepIndex]);
    };

    const stepBackward = () => {
        if (!isStepMode || currentStepIndex < 0) return;

        // If we're going back to the initial state, reset everything
        if (currentStepIndex === 0) {
            setCurrentStepIndex(-1);
            resetHighlighting();
            resetPointers();
            setSuccess(null);
            setError(null);
            return;
        }

        // Move to previous step
        const prevStepIndex = currentStepIndex - 1;
        setCurrentStepIndex(prevStepIndex);

        // Reset everything and rebuild state up to previous step
        resetHighlighting();
        resetPointers();
        setSuccess(null);
        setError(null);

        // Re-execute all steps up to the previous step
        setTimeout(() => {
            for (let i = 0; i <= prevStepIndex; i++) {
                executeStep(searchSteps[i]);
            }
        }, speedRef.current / 4);
    };

    const startSearching = async () => {
        try {
            clearAnimationTimeouts(); // Stop any ongoing animations
            isCancelledRef.current = false; // Reset cancellation flag
            resetHighlighting();
            resetStepMode();

            let arrayToSearch;
            if (Array.isArray(data)) {
                arrayToSearch = data;
            } else if (typeof data === 'string') {
                arrayToSearch = data.split(",").map(item => parseInt(item.trim())).filter(item => !isNaN(item));
            } else {
                setError("Invalid array data");
                return;
            }

            const startTime = performance.now();

            const response = await axios.post('https://algoverse-backend-python.onrender.com/search/binary', {
                array: arrayToSearch,
                value: parseInt(searchValue)
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Record end time and calculate execution time
            const endTime = performance.now();
            setExecutionTime((endTime - startTime) / 1000);

            if (response.data && response.data.steps) {
                setSearchSteps(response.data.steps);
                setIsStepMode(true);
                setCurrentStepIndex(-1);
                await animateSearchSteps(response.data.steps); // Start animation
            } else {
                setError("Received unexpected response format from server");
            }
        } catch (err) {
            console.error("Error during search:", err);
            setError(err.response?.data?.error || 'Failed to process search request');
        }
    };

    const sleep = (ms) => new Promise((resolve, reject) => {
        if (isCancelledRef.current) {
            reject(new Error('Animation cancelled'));
            return;
        }
        const id = setTimeout(() => {
            if (isCancelledRef.current) {
                reject(new Error('Animation cancelled'));
            } else {
                resolve();
            }
        }, ms);
        timeoutIdsRef.current.push(id); // Store timeout ID
    });

    const animateSearchSteps = async (steps) => {
        timeoutIdsRef.current = []; // Clear any previous timeout IDs
        isCancelledRef.current = false; // Reset cancellation flag
        resetHighlighting();
        await sleep(500);

        resetPointers();

        for (const [stepIndex, step] of steps.entries()) {
            if (isCancelledRef.current) break; // Stop if cancelled

            try {
                setCurrentStepIndex(stepIndex);
                executeStep(step);
                await sleep(speedRef.current); // Use current speed
            } catch {
                break; // Exit if cancelled during sleep
            }
        }
    };

    useEffect(() => {
        const initializeVisualization = async () => {
            if (svgRef.current && !isInitializedRef.current) {
                isInitializedRef.current = true;
                const initialArray = generateRandomArray(size);
                setData(initialArray);
                await drawArray(initialArray);
            }
        };

        const timer = setTimeout(initializeVisualization, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);


    return (
        <div className="flex flex-col scrollbar-hide overflow-auto h-screen bg-base-200 relative">
            <NavBar />
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
                                                    <div className="badge badge-primary badge-lg font-mono font-bold">O(log n)</div>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                    <span className="font-semibold text-base-content/80">Space Complexity:</span>
                                                    <div className="badge badge-primary badge-outline badge-lg font-mono font-bold">O(1)</div>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-4 bg-info/10 rounded-xl border-l-4 border-info">
                                                <p className="text-sm text-base-content/80 leading-relaxed">
                                                    Binary search eliminates half of the remaining elements with each comparison,
                                                    resulting in logarithmic time complexity with constant space usage.
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

                                            <div className="space-y-4">
                                                {executionTime !== null ? (
                                                    <>
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
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center p-8 bg-neutral/5 rounded-xl border-2 border-dashed border-base-300">
                                                        <div className="w-12 h-12 rounded-full bg-neutral/10 flex items-center justify-center mb-3">
                                                            <span className="text-2xl">⏱️</span>
                                                        </div>
                                                        <p className="text-sm text-base-content/60 text-center">
                                                            Run a search operation to see<br />detailed execution metrics
                                                        </p>
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
            </div>

            <div className="flex justify-center items-center flex-grow w-full px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-7xl flex justify-center">
                    <svg ref={svgRef} className="w-full max-w-[1200px] h-[150px] sm:h-[180px] lg:h-[200px] xl:h-[400px]"></svg>
                </div>
            </div>
            <div className="flex flex-col items-center mb-4 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col xl:flex-row justify-center items-center gap-3 sm:gap-4 w-full xl:w-auto">
                    <div className="flex items-center gap-2 w-full mr-2 xl:w-auto">
                        <span className="text-xs font-semibold">SPEED:</span>
                        <input
                            type="range"
                            min={50}
                            max="1000"
                            className="range range-primary range-xs w-full xl:w-32"
                            onChange={(e) => setSpeed(Number(e.target.value))}
                        />
                        <span className="text-xs text-base-content/70 whitespace-nowrap w-12">{speed} ms</span>
                    </div>

                    <div className="flex flex-row items-center gap-1 w-full xl:w-auto">
                        <div className="font-semibold text-sm">N:</div>
                        <div className="join w-full">
                            <input
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="input join-item xl:w-13 w-full"
                                type="number"
                                placeholder="Value"
                            />
                            <button className="btn btn-primary join-item" onClick={startSearching}>
                                Search
                            </button>
                        </div>
                    </div>

                    {/* Step Navigation Buttons */}
                    <div className="flex flex-row gap-2 md:gap-4 items-center justify-center w-full">
                        <button
                            className={`btn btn-accent btn-sm lg:btn-md flex-1 lg:w-auto ${
                                !isStepMode || currentStepIndex < 0 ? 'btn-disabled' : ''
                            }`}
                            onClick={stepBackward}
                            disabled={!isStepMode || currentStepIndex < 0}
                            aria-label="Step backward"
                        >
                            Step Backward
                        </button>
                        <button
                            className={`btn btn-accent btn-sm lg:btn-md flex-1 lg:w-auto ${
                                !isStepMode || currentStepIndex >= searchSteps.length - 1 ? 'btn-disabled' : ''
                            }`}
                            onClick={stepForward}
                            disabled={!isStepMode || currentStepIndex >= searchSteps.length - 1}
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
                                    className="input join-item w-full"
                                    value={Array.isArray(data) ? data.join(", ") : data}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 5, 3, 8"
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
                                    className="input join-item md:w-13 w-full"
                                    value={size}
                                    onChange={handleSize}
                                    placeholder="Size"
                                />
                                <button className="btn btn-primary join-item" onClick={handleRandom}>
                                    Random
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            {success && (
                <div className="fixed left-0 right-0 top-35 flex justify-center z-30">
                    <div className="alert alert-success rounded-md flex flex-row items-center justify-between max-w-md">
                        <span>{success}</span>
                        <button onClick={() => setSuccess(null)} className="btn btn-sm btn-ghost">×</button>
                    </div>
                </div>
            )}
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
}

export default Binary;