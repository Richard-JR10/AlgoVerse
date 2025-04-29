import {useState, useEffect, useRef, useContext} from 'react';
import * as d3 from 'd3';
import axios from "axios";
import NavBar from "../components/navBar.jsx";
import {ErrorContext} from "../context/errorContext.jsx";

const SelectSort = () => {
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
    const swappingColor = "green";
    const compareColor = "yellow";
    const minColor = "red";
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
            }
            const numArray = stringArray.map((numStr, index) => {
                const num = parseInt(numStr, 10);
                if (isNaN(num)) {
                    setError(`Invalid number at position ${index + 1}: "${numStr}"`);
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
            await drawBars(numArray);
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
    }

    function generateRandomArray(size) {
        // Validate input
        const sizeInput = Number(size);
        if (!Number.isInteger(sizeInput) || sizeInput < 0) {
            setError("Size must be a non-negative integer");
            return;
        }
        // Create an array of the specified size filled with random values between 0 and 1
        const randomArray = Array(sizeInput).fill(0).map(() => Math.floor(Math.random() * 100));

        return randomArray;
    }

    const handleRandom = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        const input = generateRandomArray(size);
        await animateBars(input);

    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        const input = inputValue.split(",").map(item => item.trim()).filter(Boolean);
        await animateBars(input);
    };

    const isInitializedRef = useRef(false);

// Update your useEffect to handle SVG availability
    useEffect(() => {
        const initializeVisualization = async () => {
            if (svgRef.current && !isInitializedRef.current) {
                isInitializedRef.current = true;
                await handleRandom();
            }
        };

        // Wait a small amount of time to ensure the SVG is rendered
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

        // Enter phase
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
            .attr("fill", FONT_COLOR)
            .text(d => d)
            .call(positionText);

        // Add index labels below bars
        enter.append("text")
            .attr("class", "index-label")
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("fill", INDEX_COLOR)
            .attr("font-weight", "bold")
            .text((d, i) => i) // Display the index
            .attr("x", (d, i) => margin.left + i * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
            .attr("y", height - margin.bottom + 25); // Position below the bar

        // Update phase
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

        // Exit phase
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
                .attr("fill", FONT_COLOR);
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

// New function specifically for highlighting compare operations
    const highlightCompare = (indexes, sortedIndices = []) => {
        d3.select(svgRef.current)
            .selectAll(".bar-group rect")
            .attr("fill", (d, i) => {
                if (sortedIndices.includes(i)) return sortedColor;
                if (i === indexes[0]) return "red";    // First comparison index as red
                if (i === indexes[1]) return "yellow"; // Second comparison index as yellow
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

    const animateSortSteps = async (steps) => {
        let sortedIndices = [];

        for (const step of steps) {
            if (isCancelledRef.current) break;
            if (step.type === "minimum") {
                highlightBars(step.indices, minColor, sortedIndices);
                await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
            } else if (step.type === "compare") {
                // For compare, we now use a special highlighting function
                highlightCompare(step.indices, sortedIndices);
                await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
            } else if (step.type === "swap"){
                highlightBars(step.indices, swappingColor, sortedIndices);
                await swapBars(step.indices[0], step.indices[1], step.array);
                setNumberArr([...step.array]);
                await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
            } else if (step.type === "sorted") {
                sortedIndices.push(step.index);
                highlightBars(sortedIndices, sortedColor);
                await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
            }
        }
    }

    const startSorting = async () => {
        if (numberArr.length > 0) {
            setIsSorting(true);
            isCancelledRef.current = false;
            try {
                const response = await axios.post('http://127.0.0.1:8000/sort/selection', {
                    array: numberArr
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        // Add Authorization header if needed, e.g., 'Bearer <token>'
                    }
                });

                const data = response.data;

                await animateSortSteps(data.steps);
            } catch (err) {
                setError(err.response?.data.error || 'Failed to process');
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
            <NavBar menuItems={sortingMenu}/>
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
}
export default SelectSort






