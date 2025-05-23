import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import NavBar from '../../components/navBar.jsx';
import axios from 'axios';

const HanoiVisualization = () => {
    const [inputValue, setInputValue] = useState('3');
    const [number, setNumber] = useState(3);
    const [steps, setSteps] = useState([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [speed, setSpeed] = useState(1000);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pegs, setPegs] = useState({});
    const [currentMove, setCurrentMove] = useState(null); // Track current move for accessibility
    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);

    const [error, setError] = useState(null);

    // Navigation menu items
    const visualizerMenu = [
        { label: 'Factorial', path: '/visualizer/recursion/factorial' },
        { label: 'Tower of Hanoi', path: '/visualizer/recursion/hanoi' },
    ];

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Visualization colors
    const diskColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
    const pegColor = '#EDE2F3';
    const FONT_COLOR = '#6E199F';

    const handleInput = (e) => {
        e.preventDefault();
        setInputValue(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const input = parseInt(inputValue.trim(), 10);
        if (isNaN(input) || input < 1 || input > 5) {
            setError('Please enter a valid number of disks between 1 and 5');
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
                    color: diskColors[i % diskColors.length],
                })),
                B: [],
                C: [],
            };
            setPegs(initialPegs);

            setIsSubmitting(false);
            isCancelledRef.current = false;
        } catch (err) {
            console.error(err);
            setError('Failed to fetch Hanoi steps from the API. Please try again.');
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
        try {
            const response = await axios.post(
                'https://algoverse-backend-python.onrender.com/recursion/hanoi',
                { n: number },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            const calculationSteps = response.data.steps;
            setSteps(calculationSteps);
            return calculationSteps;
        } catch (err) {
            console.error(err);
            setError('Failed to fetch Hanoi steps from the API. Please try again.');
            return [];
        }
    };

    const animateCalculationSteps = async () => {
        setIsCalculating(true);
        isCancelledRef.current = false;

        let currentPegs = JSON.parse(JSON.stringify(pegs)); // Deep copy
        const svg = d3.select(svgRef.current);

        const steps = await fetchSteps();

        // Responsive scaling (match renderPegs)
        const containerWidth = svgRef.current?.parentElement?.clientWidth || 900;
        const baseWidth = Math.min(containerWidth, 900); // Cap at 900px
        const scale = baseWidth / 900; // Scale factor
        const width = baseWidth;
        const height = 400 * scale; // Maintain aspect ratio
        svg.attr('viewBox', `0 0 ${width} ${height}`);

        for (const step of steps) {
            if (isCancelledRef.current) break;
            if (step.type === "move") {
                const { disk, from, to } = step;
                const diskToMove = currentPegs[from].find(d => d.id === disk);
                if (diskToMove) {
                    // Update current move for accessibility
                    setCurrentMove({ disk, from, to });

                    // Calculate scaled positions
                    const fromX = (['A', 'B', 'C'].indexOf(from) + 0.5) * (width / 3);
                    const toX = (['A', 'B', 'C'].indexOf(to) + 0.5) * (width / 3);
                    const diskWidth = (diskToMove.size / number) * 120 * scale;
                    const initialY = 200 * scale - currentPegs[from].length * 20 * scale;
                    const liftY = 50 * scale; // Lift above pegs
                    const finalY = 200 * scale - (currentPegs[to].length + 1) * 20 * scale;

                    // Remove disk from source peg
                    currentPegs[from] = currentPegs[from].filter(d => d.id !== disk);

                    // Remove source disk's SVG element immediately
                    svg.select(`g.disk-${diskToMove.id}`).remove();
                    console.log(`Removed disk-${diskToMove.id} from source peg ${from}`);

                    // Create the moving disk for animation
                    const movingElement = svg.append("g")
                        .attr("class", `moving-disk-${diskToMove.id}`);

                    movingElement.append("rect")
                        .attr("x", fromX - diskWidth / 2)
                        .attr("y", initialY)
                        .attr("width", diskWidth)
                        .attr("height", 18 * scale)
                        .attr("fill", diskToMove.color);

                    movingElement.append("text")
                        .attr("x", fromX)
                        .attr("y", initialY + (18 * scale) / 2)
                        .attr("text-anchor", "middle")
                        .attr("dy", ".35em")
                        .attr("fill", FONT_COLOR)
                        .attr("font-size", `${12 * scale}px`)
                        .text(`Disk ${diskToMove.id}`);

                    // Debug: Log coordinates and moving element
                    console.log(`Disk ${disk} moving:`, { fromX, toX, initialY, liftY, finalY, diskWidth, scale });
                    console.log(`Moving element created:`, movingElement.node());

                    // Small initial delay to ensure rendering
                    await new Promise(resolve => setTimeout(resolve, 50));

                    // Animate the moving disk
                    await new Promise((resolve) => {
                        movingElement.transition()
                            .duration(speedRef.current * 0.3) // 30% for up
                            .attr("transform", `translate(0, ${liftY - initialY})`)
                            .on("start", () => console.log(`Disk ${disk} lifting`))
                            .transition()
                            .duration(speedRef.current * 0.4) // 40% for across
                            .attr("transform", `translate(${toX - fromX}, ${liftY - initialY})`)
                            .on("start", () => console.log(`Disk ${disk} moving across`))
                            .transition()
                            .duration(speedRef.current * 0.3) // 30% for down
                            .attr("transform", `translate(${toX - fromX}, ${finalY - initialY})`)
                            .on("start", () => console.log(`Disk ${disk} dropping`))
                            .on("end", () => {
                                movingElement.remove();
                                // Update pegs with disk on destination
                                currentPegs[to] = [diskToMove, ...currentPegs[to]].sort((a, b) => a.size - b.size);
                                setPegs({ ...currentPegs }); // Trigger renderPegs for destination
                                setCurrentMove(null); // Clear move
                                console.log(`Disk ${disk} placed on peg ${to}`);
                                resolve();
                            });
                    });

                    // Delay between moves
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        }

        setIsCalculating(false);
    };

    const renderPegs = () => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('g[class^=disk-], g[class^=moving-disk-], rect').remove();

        // Get container width for responsive scaling
        const containerWidth = svgRef.current?.parentElement?.clientWidth || 900;
        const baseWidth = Math.min(containerWidth, 900); // Cap at 900px
        const scale = baseWidth / 900; // Scale factor
        const width = baseWidth;
        const height = 400 * scale; // Maintain aspect ratio
        svg.attr('viewBox', `0 0 ${width} ${height}`);

        const pegWidth = 10 * scale;
        const baseHeight = 20 * scale;
        const pegHeight = 200 * scale;
        const diskHeight = 20 * scale;
        const maxDiskWidth = 120 * scale;
        const pegSpacing = width / 3;

        // Draw base
        svg
            .append('rect')
            .attr('x', 50 * scale)
            .attr('y', height - baseHeight - 10 * scale)
            .attr('width', width - 100 * scale)
            .attr('height', baseHeight)
            .attr('fill', pegColor);

        // Draw pegs
        ['A', 'B', 'C'].forEach((peg, index) => {
            const x = pegSpacing * (index + 0.5);
            svg
                .append('rect')
                .attr('x', x - pegWidth / 2)
                .attr('y', height - pegHeight - baseHeight - 10 * scale)
                .attr('width', pegWidth)
                .attr('height', pegHeight)
                .attr('fill', pegColor);
        });

        // Draw disks
        ['A', 'B', 'C'].forEach((peg, index) => {
            const x = pegSpacing * (index + 0.5);
            const disks = pegs[peg] || [];
            disks.forEach((disk, i) => {
                const diskWidth = (disk.size / number) * maxDiskWidth;
                const y = height - 48 * scale - (disks.length - i - 1) * diskHeight;

                const diskGroup = svg.append('g').attr('class', `disk-${disk.id}`);

                diskGroup
                    .append('rect')
                    .attr('x', x - diskWidth / 2)
                    .attr('y', y)
                    .attr('width', diskWidth)
                    .attr('height', diskHeight - 2 * scale)
                    .attr('fill', disk.color);

                diskGroup
                    .append('text')
                    .attr('x', x)
                    .attr('y', y + diskHeight / 2)
                    .attr('text-anchor', 'middle')
                    .attr('dy', '.35em')
                    .attr('fill', FONT_COLOR)
                    .attr('font-size', `${12 * scale}px`)
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
        <div className="flex flex-col min-h-screen bg-base-200 text-white relative">
        <NavBar menuItems={visualizerMenu} />

            {/* Header Section */}
            <div className="mx-4 mt-4 p-4 bg-indigo-900 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-sm sm:text-lg md:text-xl font-bold">
                        Tower of Hanoi: {number} Disks
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base">
                        {isCalculating
                            ? 'Moving disks...'
                            : steps.length > 0
                                ? 'Ready to start moves'
                                : 'Enter number of disks to begin'}
                    </p>
                </div>
                <div
                    className="bg-indigo-700 p-2 sm:p-3 rounded-lg w-full sm:w-auto"
                    aria-live="polite"
                >
                    <span className="font-bold text-sm sm:text-lg md:text-xl">
                        Number of Moves: {(Math.pow(2, number) - 1).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* SVG Visualization */}
            <div className="flex-grow p-4 flex justify-center">
                <svg
                    ref={svgRef}
                    className="w-full max-w-4xl h-auto"
                    style={{ minHeight: '200px' }}
                    aria-label="Tower of Hanoi visualization"
                ></svg>
            </div>

            {/* Accessibility: Announce moves */}
            <div aria-live="polite" className="sr-only">
                {currentMove &&
                    `Disk ${currentMove.disk} moved from ${currentMove.from} to ${currentMove.to}`}
            </div>

            {/* Control Panel */}
            <div className="p-4 bg-base-200 w-full">
                <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 max-w-4xl mx-auto">
                    <button
                        className="btn btn-accent btn-sm sm:btn-md w-full sm:w-auto"
                        onClick={handleRandom}
                        disabled={isCalculating}
                        aria-label="Generate random number of disks"
                    >
                        Random
                    </button>
                    <button
                        className="btn btn-accent btn-sm sm:btn-md w-full sm:w-auto"
                        onClick={animateCalculationSteps}
                        disabled={isCalculating}
                        aria-label="Start disk moves"
                    >
                        Start Moves
                    </button>
                    <div className="join flex items-center w-full sm:max-w-sm">
                        <input
                            type="number"
                            value={inputValue}
                            className="input input-bordered join-item w-full text-xs sm:text-sm"
                            onChange={handleInput}
                            min="1"
                            max="5"
                            aria-label="Enter number of disks (1-5)"
                        />
                        <button
                            className="btn btn-primary btn-md join-item"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            aria-label="Submit number of disks"
                        >
                            Go
                        </button>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:max-w-sm">
                        <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                            SPEED:
                        </span>
                        <input
                            type="range"
                            min="50"
                            max="1000"
                            step="50"
                            value={speed}
                            className="range range-primary range-xs w-full"
                            onChange={(e) => setSpeed(Number(e.target.value))}
                            aria-label={`Animation speed: ${speed} milliseconds`}
                        />
                        <span className="text-xs sm:text-sm text-base-content/70 whitespace-nowrap w-12">
                            {speed} ms
                        </span>
                    </div>
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

export default HanoiVisualization;