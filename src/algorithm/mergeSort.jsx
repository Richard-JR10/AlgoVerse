import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

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

    // Sorting colors
    const sortedColor = "orange";
    const swappingColor = "green";
    const compareColor = "yellow";
    const defaultColor = "steelblue";

    const handleInput = (e) => {
        e.preventDefault();
        setInputValue(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        try {
            const stringArray = inputValue.split(",").map(item => item.trim()).filter(Boolean);
            if (stringArray.length === 0) {
                throw new Error("Please enter at least one number");
            }
            const numArray = stringArray.map((numStr, index) => {
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
    };

    const drawBars = (arr, animate = true) => {
        const svg = d3.select(svgRef.current);
        const width = svgRef.current.clientWidth;
        const height = 300;
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const maxBarWidth = 75;
        const barSpacing = 10;
        const minBarHeight = 2;

        svg.attr("viewBox", `0 0 ${width} ${height + margin.top + margin.bottom}`)
            .attr("preserveAspectRatio", "none");

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
            .attr("fill", "white")
            .text(d => d)
            .call(positionText);

        // Add index labels below bars
        enter.append("text")
            .attr("class", "index-label")
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("fill", "white")
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
                .attr("fill", "white");
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

        drawBars(array, false);
    };

    const animateSortSteps = async (steps) => {
        let sortedIndices = [];

        for (const step of steps) {
            if (isCancelledRef.current) break;
            if (step.type === "compare") {
                highlightBars(step.indices, compareColor, sortedIndices);
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
                const response = await fetch('http://127.0.0.1:8000/sort/bubble', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ array: numberArr })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.detail || "Failed to fetch sorting steps");

                await animateSortSteps(data.steps);
            } catch (err) {
                setError(err.message);
            }
            resetHighlight();
            setIsSorting(false);
        }
    };

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    return (
        <div className="flex flex-col justify-between h-full">
            <input type="text" value={inputValue} className="input" onChange={handleInput} />
            {error && <p className="text-red-500">{error}</p>}
            <button className="btn" onClick={handleSubmit} disabled={isSubmitting}>
                Submit
            </button>
            <div className="flex justify-center mt-4">
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
            <button className="btn mt-4" onClick={startSorting} disabled={isSorting}>
                Start Sorting
            </button>
            <div className="flex justify-center mt-6">
                <svg ref={svgRef} className="block w-full h-auto"></svg>
            </div>
        </div>
    );
};

export default MergeSort;