import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const QuickSort = () => {
    const [inputValue, setInputValue] = useState("");
    const [numberArr, setNumberArr] = useState([]);
    const [isSorting, setIsSorting] = useState(false);
    const [speed, setSpeed] = useState(500); // Speed control
    const svgRef = useRef(null);
    const speedRef = useRef(speed);

    const handleInput = (e) => {
        e.preventDefault();
        setInputValue(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const stringArray = inputValue.split(",").map(item => item.trim());
        const numArray = stringArray.map(numStr => {
            const num = parseInt(numStr);
            if (isNaN(num)) {
                throw new Error("Invalid input, please enter numbers only");
            }
            return num;
        });
        setNumberArr(numArray); // Update the array state, which triggers re-render
    };

    const drawBars = (arr) => {
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

        svg.selectAll("rect")
            .data(arr)
            .join(
                enter => enter.append("rect")
                    .attr("fill", 'steelblue') // Highlight the bars being compared
                    .attr("x", (d, i) => margin.left + i * (barWidth + barSpacing) + centeredBarWidth)
                    .attr("width", barWidth)
                    .attr("y", height - margin.bottom)
                    .attr("height", 0)
                    .attr("class", (d, i) => `bar-${i}`)
                    .transition()
                    .duration(500)
                    .attr("y", d => yScale(d))
                    .attr("height", d => Math.max(minBarHeight, height - margin.bottom - yScale(d))),
                update => update.transition()
                    .duration(500)
                    .attr("x", (d, i) => margin.left + i * (barWidth + barSpacing) + centeredBarWidth)
                    .attr("width", barWidth)
                    .attr("y", d => yScale(d))
                    .attr("height", d => Math.max(minBarHeight, height - margin.bottom - yScale(d))),
                exit => exit.transition()
                    .duration(500)
                    .attr("y", height - margin.bottom)
                    .attr("height", 0)
                    .remove()
            );

        svg.selectAll(".bar-label")
            .data(arr)
            .join(
                enter => enter.append("text")
                    .attr("class", "bar-label")
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .attr("font-size", "12px")
                    .attr("fill", "white")
                    .text(d => d)
                    .call(positionText),
                update => update.transition()
                    .duration(500)
                    .call(positionText)
                    .text(d => d),
                exit => exit.remove()
            );

        function positionText(selection) {
            selection.attr("x", (d, i) => margin.left + i * (barWidth + barSpacing) + centeredBarWidth + barWidth / 2)
                .attr("y", d => {
                    const barHeight = Math.max(minBarHeight, height - margin.bottom - yScale(d));
                    return barHeight > 20 ? yScale(d) + barHeight - 10 : yScale(d) - 10;
                })
                .attr("fill", "white");
        }
    };

    const resetHighlight = () => {
        d3.selectAll("rect")
            .attr("fill", "steelblue"); // Reset to default color
    };

    const highlightBars = (indexes) => {
        d3.selectAll("rect")
            .attr("fill", (d, i) => (indexes.includes(i) ? "green" : "steelblue"));
    };

    // Bubble Sort Algorithm to return steps as JSON (async version)
    const quickSort = async () => {
        let sortedArr = [...numberArr];
        let sortingSteps = [];

        // Helper function for quicksort logic
        const quickSortHelper = async (arr, left, right) => {
            if (left >= right) return;

            // Partitioning step
            const pivotIndex = await partition(arr, left, right);

            // Recursively sort left and right sub-arrays
            await quickSortHelper(arr, left, pivotIndex - 1);
            await quickSortHelper(arr, pivotIndex + 1, right);
        };

        // Function for partitioning the array
        const partition = async (arr, left, right) => {
            const pivot = arr[right]; // Pivot element is the last element
            let i = left - 1;

            // Iterate through the array and swap elements
            for (let j = left; j < right; j++) {
                sortingSteps.push({
                    array: [...arr],
                    highlight: [j, right], // Highlight the current element and the pivot
                    swap: false
                });

                if (arr[j] <= pivot) {
                    i++;
                    [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap elements

                    sortingSteps.push({
                        array: [...arr],
                        highlight: [i, j], // Highlight the swapped elements
                        swap: true
                    });
                }

                sortingSteps.push({
                    array: [...arr],
                    highlight: [], // Reset highlight after comparison
                    swap: false
                });
            }

            // Final swap to place the pivot in the correct position
            [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];

            sortingSteps.push({
                array: [...arr],
                highlight: [i + 1, right], // Highlight the final swap
                swap: true
            });

            return i + 1; // Return the pivot index
        };

        await quickSortHelper(sortedArr, 0, sortedArr.length - 1);

        return sortingSteps; // Return the steps as JSON
    };



    // Use the sorting steps to animate
    const animateSteps = async (steps) => {
        for (let step of steps) {
            setNumberArr(step.array); // Update the array state with the current step
            highlightBars(step.highlight); // Highlight the bars that are compared

            // If a swap happened, update the array visually
            if (step.swap) {
                await new Promise(resolve => setTimeout(resolve, speedRef.current));
            }

            // Reset highlights after each step
            await new Promise(resolve => setTimeout(resolve, speedRef.current));  // Delay before removing highlight
            resetHighlight();
        }
    };

    const startSorting = async () => {
        setIsSorting(true); // Start sorting
        const sortingSteps = await quickSort(); // Wait for bubbleSort to return the steps
        console.log(sortingSteps); // Check the sorting steps in the console
        await animateSteps(sortingSteps); // Animate the steps
        setIsSorting(false); // End sorting
    };

    useEffect(() => {
        speedRef.current = speed; // Update the speedRef when speed changes
    }, [speed]);


    useEffect(() => {
        if (numberArr.length > 0) {
            drawBars(numberArr); // Draw bars when array is first updated
        }
    }, [numberArr]);

    return (
        <div className="flex flex-col justify-between h-full">
            <input type="text" value={inputValue} className="input" onChange={handleInput} />
            <button className="btn" onClick={handleSubmit}>Submit</button>
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
            <button className="btn mt-4" onClick={startSorting} disabled={isSorting}>Start Sorting</button>
            <div className="flex justify-center mt-6">
                <svg ref={svgRef} className="block w-full h-auto"></svg>
            </div>
        </div>
    );
};

export default QuickSort;
