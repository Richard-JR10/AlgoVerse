import  { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import NavBar from "../../components/navBar.jsx";
import axios from "axios";

const Binary = () => {
    const [data, setData] = useState([]);
    const [size, setSize] = useState(10);
    const svgRef = useRef(null);
    const isInitializedRef = useRef(false);
    const [searchValue, setSearchValue] = useState(0);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const timeoutIdsRef = useRef([]); // Store timeout IDs for animation

    const searchMenu = [
        { label: 'Linear Search', path: '/visualizer/search/linear' },
        { label: 'Binary Search', path: '/visualizer/search/binary' }
    ];

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
        resetHighlighting();
        const inputArray = data.split(",").map(item => parseInt(item.trim())).filter(item => !isNaN(item));

        const isSorted = inputArray.every((item, index) => index === 0 || item >= inputArray[index - 1]);

        if (!isSorted) {
            setError("Input array must be sorted in ascending order");
            return;
        }

        setData(inputArray);
        drawArray(inputArray);
    };

    const drawArray = (arrayData) => {
        if (!svgRef.current) return;

        d3.select(svgRef.current).selectAll("*").remove();

        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const width = svgRef.current.clientWidth;
        const height = 120 - margin.top - margin.bottom; // Increased for pointers

        const svg = d3.select(svgRef.current);
        svg.attr("viewBox", `0 0 ${width} ${height + margin.top + margin.bottom}`);

        // Dynamic box sizing based on array length
        const maxBoxes = 25; // Threshold for original sizing
        const baseBoxWidth = 60;
        const baseBoxSpacing = 5;
        const baseBoxHeight = 80;
        const scaleFactor = arrayData.length > maxBoxes ? maxBoxes / arrayData.length : 1;

        const boxWidth = baseBoxWidth * scaleFactor;
        const boxSpacing = baseBoxSpacing * scaleFactor;
        const boxHeight = baseBoxHeight * scaleFactor;
        const fontSizeValue = 20 * scaleFactor;
        const fontSizeIndex = 16 * scaleFactor;
        const indexBoxMargin = 10 * scaleFactor;

        const totalArrayWidth = arrayData.length * boxWidth + (arrayData.length - 1) * boxSpacing;
        const startX = (width - totalArrayWidth) / 2;

        svg.selectAll(".outer-box")
            .data(arrayData)
            .enter()
            .append("rect")
            .attr("class", (d, i) => `outer-box outer-box-${i}`)
            .attr("x", (d, i) => startX + i * (boxWidth + boxSpacing))
            .attr("y", 0)
            .attr("width", boxWidth)
            .attr("height", boxHeight)
            .attr("fill", "#4338ca")
            .attr("rx", 8 * scaleFactor)
            .attr("ry", 8 * scaleFactor);

        svg.selectAll(".value-text")
            .data(arrayData)
            .enter()
            .append("text")
            .attr("class", (d, i) => `value-text value-text-${i}`)
            .attr("x", (d, i) => startX + i * (boxWidth + boxSpacing) + boxWidth / 2)
            .attr("y", boxHeight * 0.35)
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
            .attr("x", (d, i) => startX + i * (boxWidth + boxSpacing) + indexBoxMargin)
            .attr("y", boxHeight * 0.5)
            .attr("width", boxWidth - 2 * indexBoxMargin)
            .attr("height", boxHeight * 0.35)
            .attr("fill", "#8b5cf6")
            .attr("rx", 4 * scaleFactor)
            .attr("ry", 4 * scaleFactor);

        svg.selectAll(".index-text")
            .data(arrayData)
            .enter()
            .append("text")
            .attr("class", (d, i) => `index-text index-text-${i}`)
            .attr("x", (d, i) => startX + i * (boxWidth + boxSpacing) + boxWidth / 2)
            .attr("y", boxHeight * 0.72)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", `${fontSizeIndex}px`)
            .text((d, i) => i);
    };

    const highlightIndex = (index, color) => {
        d3.select(svgRef.current)
            .select(`.index-box-${index}`)
            .transition()
            .duration(300)
            .attr("fill", color);
    };

    const resetHighlighting = () => {
        d3.select(svgRef.current)
            .selectAll(".index-box")
            .transition()
            .duration(300)
            .attr("fill", "#8b5cf6");
    };

    const startSearching = async () => {
        try {
            clearAnimationTimeouts(); // Stop any ongoing animations
            resetHighlighting();

            let arrayToSearch;
            if (Array.isArray(data)) {
                arrayToSearch = data;
            } else if (typeof data === 'string') {
                arrayToSearch = data.split(",").map(item => parseInt(item.trim())).filter(item => !isNaN(item));
            } else {
                setError("Invalid array data");
                return;
            }

            const response = await axios.post('https://algoverse-backend-python.onrender.com/search/binary', {
                array: arrayToSearch,
                value: parseInt(searchValue)
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.steps) {
                await animateSearchSteps(response.data.steps); // Restart animation
            } else {
                setError("Received unexpected response format from server");
            }
        } catch (err) {
            console.error("Error during search:", err);
            setError(err.response?.data?.error || 'Failed to process search request');
        }
    };

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Reset pointers visualization
    const resetPointers = () => {
        d3.select(svgRef.current).selectAll(".pointer").remove();
        d3.select(svgRef.current)
            .selectAll(".index-box")
            .transition()
            .duration(300)
            .attr("fill", "#8b5cf6"); // Reset all boxes to default color
    };

// Update left and right pointers
    const updatePointers = (left, right, mid = null) => {
        const svg = d3.select(svgRef.current);
        const boxWidth = 60 * (data.length > 25 ? 25 / data.length : 1);
        const boxSpacing = 5 * (data.length > 25 ? 25 / data.length : 1);
        const boxHeight = 80 * (data.length > 25 ? 25 / data.length : 1);
        const width = svgRef.current.clientWidth;
        const totalArrayWidth = data.length * boxWidth + (data.length - 1) * boxSpacing;
        const startX = (width - totalArrayWidth) / 2;

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

        // Render pointers, adjusting y-position for overlaps
        Object.entries(pointersByIndex).forEach(([index, pointerList]) => {
            const x = startX + Number(index) * (boxWidth + boxSpacing) + boxWidth / 2;
            const baseY = boxHeight + 20;

            if (pointerList.length === 1) {
                // Single pointer, place at base position
                svg.append("text")
                    .attr("class", `pointer pointer-${pointerList[0].type.toLowerCase()}`)
                    .attr("x", x)
                    .attr("y", baseY)
                    .attr("text-anchor", "middle")
                    .attr("fill", pointerList[0].color)
                    .attr("font-size", `${16 * (data.length > 25 ? 25 / data.length : 1)}px`)
                    .text(pointerList[0].type);
            } else {
                // Multiple pointers at same index, combine labels
                const label = pointerList.map(p => p.type).join("/");
                svg.append("text")
                    .attr("class", `pointer pointer-combined-${index}`)
                    .attr("x", x)
                    .attr("y", baseY)
                    .attr("text-anchor", "middle")
                    .attr("fill", "#ffffff")
                    .attr("font-size", `${16 * (data.length > 25 ? 25 / data.length : 1)}px`)
                    .text(label);
            }
        });
    };

// Dim elements outside the current search range
    const dimOutsideRange = (left, right) => {
        d3.select(svgRef.current)
            .selectAll(".index-box")
            .transition()
            .duration(300)
            .attr("fill", (d, i) => {
                if (i >= left && i <= right) {
                    return "#8b5cf6"; // Active range in default color
                }
                return "#555555"; // Dimmed color for out-of-range elements
            });
    };

    const animateSearchSteps = async (steps) => {
        timeoutIdsRef.current = []; // Clear any previous timeout IDs
        resetHighlighting();
        await sleep(500);

        resetPointers();

        steps.forEach((step, stepIndex) => {
            const timeoutId = setTimeout(async () => {
                if (step.type === "checking") {
                    highlightIndex(step.index, "#ff0000"); // Red for checking
                    updatePointers(step.left || 0, step.right || data.length - 1, step.index); // Include mid
                } else if (step.type === "found") {
                    highlightIndex(step.index, "#0fff00"); // Green for found
                    setSuccess(`Found ${searchValue} at index ${step.index}`);
                    //resetPointers();
                } else if (step.type === "not_found") {
                    d3.select(svgRef.current)
                        .selectAll(".index-box")
                        .transition()
                        .duration(300)
                        .attr("fill", "#ff5555")
                        // .transition()
                        // .duration(300)
                        // .attr("fill", "#8b5cf6");
                    //resetPointers();
                    setError(`Value ${searchValue} not found in the array`);
                } else if (step.type === "search_left" || step.type === "search_right") {
                    updatePointers(step.left, step.right); // Update L and R only
                    dimOutsideRange(step.left, step.right);
                }
            }, stepIndex * 1000);
            timeoutIdsRef.current.push(timeoutId);
        });
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

    return (
        <div className="flex flex-col h-full relative">
            <NavBar menuItems={searchMenu} />
            <div className="flex items-center flex-grow">
                <svg ref={svgRef} className="w-full h-30"></svg>
            </div>
            <div className="flex flex-col items-center mb-4">
                <div className="flex justify-center items-center flex-row gap-3">
                    <div className="flex flex-row items-center gap-1">
                        <div className="font-semibold">N:</div>
                        <div className="join">
                            <input
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="input join-item w-13"
                                type="number"
                            />
                            <button className="btn btn-primary join-item" onClick={startSearching}>
                                Search
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-row items-center gap-1">
                        <div className="font-semibold">Array:</div>
                        <div className="join">
                            <input
                                className="input join-item"
                                value={Array.isArray(data) ? data.join(", ") : data}
                                onChange={handleInputChange}
                            />
                            <button className="btn btn-secondary join-item" onClick={handleSubmit}>
                                GO
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-row items-center gap-1">
                        <div className="font-semibold">Size:</div>
                        <div className="join">
                            <input
                                type="number"
                                className="input join-item w-13"
                                value={size}
                                min="0"
                                max="50"
                                onChange={(handleSize)}
                            />
                            <button className="btn btn-primary join-item" onClick={handleRandom}>
                                Random
                            </button>
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
export default Binary
