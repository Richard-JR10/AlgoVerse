import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import NavBar from "../../components/navBar.jsx";
import axios from "axios";

const HanoiVisualization = () => {
    const [inputValue, setInputValue] = useState("3");
    const [number, setNumber] = useState(3);
    const [steps, setSteps] = useState([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pegs, setPegs] = useState({});
    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);

    // Navigation menu items
    const visualizerMenu = [
        { label: 'Factorial', path: '/visualizer/recursion/factorial' },
        { label: 'Tower of Hanoi', path: '/visualizer/recursion/hanoi' }
    ];

    // Visualization colors
    const diskColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
    const pegColor = "#EDE2F3";
    const FONT_COLOR = "#6E199F";

    const handleInput = (e) => {
        e.preventDefault();
        setInputValue(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const input = parseInt(inputValue.trim(), 10);
        if (isNaN(input) || input < 1 || input > 5) {
            alert("Please enter a valid number of disks between 1 and 5");
            return;
        }

        setNumber(input);
        initializeVisualization(input);
    };

    const initializeVisualization = (num) => {
        try {
            setIsSubmitting(true);
            if (isCalculating) {
                isCancelledRef.current = true;
                setIsCalculating(false);
            }

            // Initialize pegs with disks on source peg (A), smallest at top
            const initialPegs = {
                A: Array.from({ length: num }, (_, i) => ({
                    id: i + 1,
                    size: i + 1, // Smallest disk (1) at top, largest (n) at bottom
                    color: diskColors[i % diskColors.length]
                })),
                B: [],
                C: []
            };
            setPegs(initialPegs);

            setIsSubmitting(false);
            isCancelledRef.current = false;
        } catch (err) {
            console.error(err);
            alert("Failed to fetch Hanoi steps from the API. Please try again.");
            setIsSubmitting(false);
            isCancelledRef.current = false;
        }
    };

    const handleRandom = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        const randomNum = Math.floor(Math.random() * 5) + 1;
        setInputValue(randomNum.toString());
        setNumber(randomNum);
        initializeVisualization(randomNum);
    };

    useEffect(() => {
        initializeVisualization(number);
    }, []);

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    const fetchSteps = async () => {
        // Fetch steps from the API
        try {
            const response = await axios.post(`https://algoverse-backend-python.onrender.com/recursion/hanoi`, {
                n: number
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const calculationSteps = response.data.steps;
            setSteps(calculationSteps);
            return calculationSteps;
        } catch (err) {
            console.error(err);
            alert("Failed to fetch factorial steps from the API. Please try again.");
        }

    }


    const animateCalculationSteps = async () => {
        setIsCalculating(true);
        isCancelledRef.current = false;

        let currentPegs = JSON.parse(JSON.stringify(pegs)); // Deep copy to avoid mutating state directly
        const svg = d3.select(svgRef.current);

        const steps = await fetchSteps();

        const width = 900;
        const height = 400;
        svg.attr("viewBox", `0 0 ${width} ${height}`);

        for (const step of steps) {
            if (isCancelledRef.current) break;
            if (step.type === "move") {
                const { disk, from, to } = step;
                const diskToMove = currentPegs[from].find(d => d.id === disk);
                if (diskToMove) {
                    // Calculate positions
                    const fromX = (['A', 'B', 'C'].indexOf(from) + 0.5) * (900 / 3);
                    const toX = (['A', 'B', 'C'].indexOf(to) + 0.5) * (900 / 3);
                    const diskWidth = (diskToMove.size / number) * 120;
                    const initialY = 200 - currentPegs[from].length * 20; // Position before removal
                    const liftY = 50; // Lift the disk above the pegs
                    const finalY = 200 - (currentPegs[to].length + 1) * 20;

                    // Remove the disk from the source peg immediately
                    currentPegs[from] = currentPegs[from].filter(d => d.id !== disk);
                    setPegs({ ...currentPegs });

                    // Create the moving disk for animation
                    const movingElement = svg.append("g")
                        .attr("class", `moving-disk-${diskToMove.id}`);

                    movingElement.append("rect")
                        .attr("x", fromX - diskWidth / 2)
                        .attr("y", initialY)
                        .attr("width", diskWidth)
                        .attr("height", 18)
                        .attr("fill", diskToMove.color);

                    movingElement.append("text")
                        .attr("x", fromX)
                        .attr("y", initialY + 18 / 2)
                        .attr("text-anchor", "middle")
                        .attr("dy", ".35em")
                        .attr("fill", FONT_COLOR)
                        .attr("font-size", "12px")
                        .text(`Disk ${diskToMove.id}`);

                    // Animate the moving disk
                    await new Promise((resolve) => {
                        movingElement.transition()
                            .duration(speedRef.current * 0.4) // 40% of speed for up
                            .attr("transform", `translate(0, ${liftY - initialY})`)
                            .transition()
                            .duration(speedRef.current * 0.4) // 40% of speed for across
                            .attr("transform", `translate(${toX - fromX}, ${liftY - initialY})`)
                            .transition()
                            .duration(speedRef.current * 0.2) // 20% of speed for down
                            .attr("transform", `translate(${toX - fromX}, ${finalY - initialY})`)
                            .on("end", () => {
                                movingElement.remove();
                                // Add the disk to the destination peg after animation
                                currentPegs[to] = [diskToMove, ...currentPegs[to]].sort((a, b) => a.size - b.size);
                                setPegs({ ...currentPegs });
                                resolve();
                            });
                    });

                    // Small delay between moves
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        }

        setIsCalculating(false);
    };

    const renderPegs = () => {
        const svg = d3.select(svgRef.current);
        // Remove only the disk elements, not the entire SVG (pegs and base should persist)
        svg.selectAll("g[class^='disk-']").remove();

        const width = 900;
        const height = 400;
        svg.attr("viewBox", `0 0 ${width} ${height}`);

        const pegWidth = 10;
        const baseHeight = 20;
        const pegHeight = 200;
        const diskHeight = 20;
        const maxDiskWidth = 120;
        const pegSpacing = width / 3;

        // Draw base
        svg.append("rect")
            .attr("x", 50)
            .attr("y", height - baseHeight - 10)
            .attr("width", width - 100)
            .attr("height", baseHeight)
            .attr("fill", pegColor);

        ['A', 'B', 'C'].forEach((peg, index) => {
            const x = pegSpacing * (index + 0.5);

            // Peg
            svg.append("rect")
                .attr("x", x - pegWidth / 2)
                .attr("y", height - pegHeight - baseHeight - 10)
                .attr("width", pegWidth)
                .attr("height", pegHeight)
                .attr("fill", pegColor);
        });

        // Draw disks
        ['A', 'B', 'C'].forEach((peg, index) => {
            const x = pegSpacing * (index + 0.5);
            const disks = pegs[peg] || [];
            disks.forEach((disk, i) => {
                const diskWidth = (disk.size / number) * maxDiskWidth;
                const y = height - 48 - (disks.length - i - 1) * diskHeight;

                const diskGroup = svg.append("g")
                    .attr("class", `disk-${disk.id}`);

                diskGroup.append("rect")
                    .attr("x", x - diskWidth / 2)
                    .attr("y", y)
                    .attr("width", diskWidth)
                    .attr("height", diskHeight - 2)
                    .attr("fill", disk.color);

                diskGroup.append("text")
                    .attr("x", x)
                    .attr("y", y + diskHeight / 2)
                    .attr("text-anchor", "middle")
                    .attr("dy", ".35em")
                    .attr("fill", FONT_COLOR)
                    .attr("font-size", "12px")
                    .text(`Disk ${disk.id}`);
            });
        });
    };

    useEffect(() => {
        if (Object.keys(pegs).length > 0) {
            renderPegs();
        }
    }, [pegs]);


    return (
        <div className="flex flex-col h-full bg-base-200 text-white relative">
            <NavBar menuItems={visualizerMenu}/>

            <div className="w-full mb-6 p-4 flex justify-center">
                <svg ref={svgRef} className="w-full max-w-4xl h-auto"></svg>
            </div>

            <div className="fixed left-1/3 right-1/3 bottom-5">
                <div className="flex justify-center items-center flex-row">
                    <button
                        className="btn mr-2"
                        onClick={handleRandom}
                        disabled={isCalculating}
                    >
                        Random
                    </button>
                    <button
                        className="btn mr-4"
                        onClick={animateCalculationSteps}
                        disabled={isCalculating}
                    >
                        Start Moves
                    </button>
                    <div className="join flex items-center w-full max-w-md mr-4">
                        <input
                            type="number"
                            value={inputValue}
                            className="input join-item w-full"
                            onChange={handleInput}
                            min="1"
                            max="5"
                        />
                        <button
                            className="btn join-item"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            Go
                        </button>
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

export default HanoiVisualization;