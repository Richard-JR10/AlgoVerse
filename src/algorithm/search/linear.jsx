import  { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import NavBar from "../../components/navBar.jsx";
import axios from "axios";

const Linear = () => {
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
        isCancelledRef.current = true; // Signal cancellation
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
        isCancelledRef.current = false; // Reset cancellation flag
        resetHighlighting();
        const inputArray = data.split(",").map(item => parseInt(item.trim())).filter(item => !isNaN(item));
        setData(inputArray);
        drawArray(inputArray);
    };

    const drawArray = (arrayData) => {
        if (!svgRef.current) return;

        d3.select(svgRef.current).selectAll("*").remove();

        const margin = { top: 20, right: 20, bottom: 30, left: 20 };
        const width = svgRef.current.clientWidth;
        const minBoxWidth = 40; // Minimum box width for small screens
        const maxBoxWidth = 60; // Maximum box width for large screens
        const boxSpacing = width < 640 ? 3 : 5; // Smaller spacing on mobile
        const rowSpacing = width < 640 ? 10 : 15; // Spacing between rows
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

        // Set SVG height dynamically based on number of rows
        const height = numRows * boxHeight + (numRows - 1) * rowSpacing + margin.top + margin.bottom;

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

    const startSearching = async () => {
        try {
            clearAnimationTimeouts(); // Stop any ongoing animations
            isCancelledRef.current = false; // Reset cancellation flag
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

            const response = await axios.post('https://algoverse-backend-python.onrender.com/search/linear', {
                array: arrayToSearch,
                value: parseInt(searchValue)
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.steps) {
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

        for (const [stepIndex, step] of steps.entries()) {
            if (isCancelledRef.current) break; // Stop if cancelled

            try {
                if (step.type === "checking") {
                    highlightIndex(step.index, "#ff0000"); // Red for checking
                    await sleep(speedRef.current); // Use current speed
                } else if (step.type === "found") {
                    highlightIndex(step.index, "#0fff00"); // Green for found
                    setSuccess(`Found ${searchValue} at index ${step.index}`);
                    await sleep(speedRef.current); // Use current speed
                } else if (step.type === "not_found") {
                    d3.select(svgRef.current)
                        .selectAll(".index-box")
                        .transition()
                        .duration(speedRef.current / 2)
                        .attr("fill", "#ff5555");
                    setError(`Value ${searchValue} not found in the array`);
                    await sleep(speedRef.current); // Use current speed
                }
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
        <div className="flex flex-col min-h-screen bg-base-200 relative">
            <NavBar menuItems={searchMenu} />
            <div className="flex justify-center items-center flex-grow w-full px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-7xl flex justify-center">
                    <svg ref={svgRef} className="w-full max-w-[1200px] h-[150px] sm:h-[180px] lg:h-[200px] xl:h-[400px]"></svg>
                </div>
            </div>
            <div className="flex flex-col items-center mb-4 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-center items-center gap-3 sm:gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 w-full mr-2 md:w-auto">
                        <span className="text-xs font-semibold">SPEED:</span>
                        <input
                            type="range"
                            min={50}
                            max="1000"
                            className="range range-primary range-xs w-full md:w-32"
                            onChange={(e) => setSpeed(Number(e.target.value))}
                        />
                        <span className="text-xs text-base-content/70 whitespace-nowrap w-12">{speed} ms</span>
                    </div>

                    <div className="flex flex-row items-center gap-1 w-full md:w-auto">
                        <div className="font-semibold text-sm">N:</div>
                        <div className="join w-full">
                            <input
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="input join-item md:w-13 w-full"
                                type="number"
                                placeholder="Value"
                            />
                            <button className="btn btn-primary join-item" onClick={startSearching}>
                                Search
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-row items-center gap-1 w-full">
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
};

export default Linear;