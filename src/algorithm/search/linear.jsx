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
        resetHighlighting();
        const inputArray = data.split(",").map(item => parseInt(item.trim())).filter(item => !isNaN(item));
        setData(inputArray);
        drawArray(inputArray);
    };

    const drawArray = (arrayData) => {
        if (!svgRef.current) return;

        d3.select(svgRef.current).selectAll("*").remove();

        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const width = svgRef.current.clientWidth;
        const height = 120 - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current);
        svg.attr("viewBox", `0 0 ${width} ${height + margin.top + margin.bottom}`);

        const boxWidth = 60;
        const boxHeight = 80;
        const boxSpacing = 5;

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
            .attr("rx", 8)
            .attr("ry", 8);

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
            .attr("font-size", "20px")
            .text(d => d);

        svg.selectAll(".index-box")
            .data(arrayData)
            .enter()
            .append("rect")
            .attr("class", (d, i) => `index-box index-box-${i}`)
            .attr("x", (d, i) => startX + i * (boxWidth + boxSpacing) + 10)
            .attr("y", boxHeight * 0.5)
            .attr("width", boxWidth - 20)
            .attr("height", boxHeight * 0.35)
            .attr("fill", "#8b5cf6")
            .attr("rx", 4)
            .attr("ry", 4);

        svg.selectAll(".index-text")
            .data(arrayData)
            .enter()
            .append("text")
            .attr("class", (d, i) => `index-text index-text-${i}`)
            .attr("x", (d, i) => startX + i * (boxWidth + boxSpacing) + boxWidth / 2)
            .attr("y", boxHeight * 0.72)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "16px")
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

            const response = await axios.post('https://algoverse-backend-python.onrender.com/search/linear', {
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

    const animateSearchSteps = async (steps) => {
        timeoutIdsRef.current = []; // Clear any previous timeout IDs
        resetHighlighting();
        await sleep(500);

        steps.forEach((step, stepIndex) => {
            const timeoutId = setTimeout(() => {
                if (step.type === "checking") {
                    highlightIndex(step.index, "#ff0000"); // Red for checking
                } else if (step.type === "found") {
                    highlightIndex(step.index, "#0fff00"); // Green for found
                    setSuccess(`Found ${searchValue} at index ${step.index}`);
                } else if (step.type === "not_found") {
                    d3.select(svgRef.current)
                        .selectAll(".index-box")
                        .transition()
                        .duration(300)
                        .attr("fill", "#ff5555")
                    setError(`Value ${searchValue} not found in the array`);
                }
            }, stepIndex * 500);
            timeoutIdsRef.current.push(timeoutId); // Store the timeout ID
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
        <div className="flex flex-col h-full relative bg-base-200">
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
                                onChange={handleSize}
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