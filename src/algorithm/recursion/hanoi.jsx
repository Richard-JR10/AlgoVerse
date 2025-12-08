import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import NavBar from '../../components/navBar.jsx';
import axios from 'axios';
import AlgorithmNavbar from "../algorithmNavbar.jsx";

const HanoiVisualization = () => {
    const [inputValue, setInputValue] = useState('3');
    const [number, setNumber] = useState(3);
    const [steps, setSteps] = useState([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pegs, setPegs] = useState({});
    const [currentMove, setCurrentMove] = useState(null); // Track current move for accessibility
    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);
    const [error, setError] = useState(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1); // Track current step
    const [currentPegsHistory, setCurrentPegsHistory] = useState([]); // Track peg states

    // State for complexity display
    const [showComplexity, setShowComplexity] = useState(false);
    const [executionTime, setExecutionTime] = useState(null);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setTimeout(() => setError(null), 5000));
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Visualization colors
    const diskColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
    const pegColor = '#e9c9fd';
    const FONT_COLOR = '#6E199F';

    const handleInput = (e) => {
        e.preventDefault();
        setInputValue(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const input = parseInt(inputValue.trim(), 10);
        if (isNaN(input) || input < 1 || input > 5) {
            setError('Please enter a valid number of disks between 1 and 5');
            return;
        }

        await fetchSteps();
        setNumber(input);
        initializeVisualization(input);
    };

    const initializeVisualization = async (num) => {
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
            setCurrentStepIndex(-1); // Reset step index
            setCurrentPegsHistory([JSON.parse(JSON.stringify(initialPegs))]); // Initialize history

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
        await fetchSteps();
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
            const startTime = performance.now();
            const response = await axios.post(
                'https://algoverse-backend-python.onrender.com/recursion/hanoi',
                { n: number },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            // Record end time and calculate execution time
            const endTime = performance.now();
            setExecutionTime((endTime - startTime) / 1000);

            const calculationSteps = response.data.steps;
            setSteps(calculationSteps);
            return calculationSteps;
        } catch (err) {
            console.error(err);
            setError('Failed to fetch Hanoi steps from the API. Please try again.');
            return [];
        }
    };

    const animateSingleStep = async (step, currentPegs, svg) => {
        if (step.type === "move") {
            const { disk, from, to } = step;
            const diskToMove = currentPegs[from].find(d => d.id === disk);
            if (diskToMove) {
                setCurrentMove({ disk, from, to });

                const containerWidth = svgRef.current?.parentElement?.clientWidth || 900;
                const baseWidth = Math.min(containerWidth, 900);
                const scale = baseWidth / 900;
                const width = baseWidth;
                const height = 400 * scale;
                svg.attr('viewBox', `0 0 ${width} ${height}`);

                const fromX = (['A', 'B', 'C'].indexOf(from) + 0.5) * (width / 3);
                const toX = (['A', 'B', 'C'].indexOf(to) + 0.5) * (width / 3);
                const diskWidth = (diskToMove.size / number) * 120 * scale;
                const initialY = 200 * scale - currentPegs[from].length * 20 * scale;
                const liftY = 50 * scale;
                const finalY = 200 * scale - (currentPegs[to].length + 1) * 20 * scale;

                currentPegs[from] = currentPegs[from].filter(d => d.id !== disk);
                svg.select(`g.disk-${diskToMove.id}`).remove();
                console.log(`Removed disk-${diskToMove.id} from source peg ${from}`);

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

                console.log(`Disk ${disk} moving:`, { fromX, toX, initialY, liftY, finalY, diskWidth, scale });
                console.log(`Moving element created:`, movingElement.node());

                await new Promise(resolve => setTimeout(resolve, 50));

                await new Promise((resolve) => {
                    movingElement.transition()
                        .duration(speedRef.current * 0.3)
                        .attr("transform", `translate(0, ${liftY - initialY})`)
                        .on("start", () => console.log(`Disk ${disk} lifting`))
                        .transition()
                        .duration(speedRef.current * 0.4)
                        .attr("transform", `translate(${toX - fromX}, ${liftY - initialY})`)
                        .on("start", () => console.log(`Disk ${disk} moving across`))
                        .transition()
                        .duration(speedRef.current * 0.3)
                        .attr("transform", `translate(${toX - fromX}, ${finalY - initialY})`)
                        .on("start", () => console.log(`Disk ${disk} dropping`))
                        .on("end", () => {
                            movingElement.remove();
                            currentPegs[to] = [diskToMove, ...currentPegs[to]].sort((a, b) => a.size - b.size);
                            setCurrentMove(null);
                            console.log(`Disk ${disk} placed on peg ${to}`);
                            resolve();
                        });
                });

                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        return currentPegs;
    };

    const handleStepForward = async () => {
        if (currentStepIndex >= steps.length - 1 || steps.length === 0 || isCalculating) return;

        setIsCalculating(true);
        const svg = d3.select(svgRef.current);
        const nextIndex = currentStepIndex + 1;
        const step = steps[nextIndex];
        let currentPegs = JSON.parse(JSON.stringify(pegs));

        currentPegs = await animateSingleStep(step, currentPegs, svg);
        setPegs(currentPegs);
        setCurrentPegsHistory([...currentPegsHistory, JSON.parse(JSON.stringify(currentPegs))]);
        setCurrentStepIndex(nextIndex);
        setIsCalculating(false);
    };

    const handleStepBackward = () => {
        if (currentStepIndex <= -1 || steps.length === 0 || isCalculating) return;

        setIsCalculating(true);
        const prevIndex = currentStepIndex;
        const prevPegs = JSON.parse(JSON.stringify(currentPegsHistory[prevIndex]));
        setPegs(prevPegs);
        setCurrentStepIndex(prevIndex - 1);
        setIsCalculating(false);
    };

    const animateCalculationSteps = async () => {
        setIsCalculating(true);
        isCancelledRef.current = false;

        // Reset to initial state
        const initialPegs = {
            A: Array.from({ length: number }, (_, i) => ({
                id: i + 1,
                size: i + 1,
                color: diskColors[i % diskColors.length],
            })),
            B: [],
            C: [],
        };
        setPegs(initialPegs);
        setCurrentStepIndex(-1);
        setCurrentPegsHistory([JSON.parse(JSON.stringify(initialPegs))]);

        let currentPegs = JSON.parse(JSON.stringify(initialPegs)); // Deep copy
        const svg = d3.select(svgRef.current);

        const steps = await fetchSteps();

        // Responsive scaling (match renderPegs)
        const containerWidth = svgRef.current?.parentElement?.clientWidth || 900;
        const baseWidth = Math.min(containerWidth, 900); // Cap at 900px
        const scale = baseWidth / 900; // Scale factor
        const width = baseWidth;
        const height = 400 * scale; // Maintain aspect ratio
        svg.attr('viewBox', `0 0 ${width} ${height}`);

        let stepIndex = -1;
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

                    // Update step index and history
                    stepIndex += 1;
                    setCurrentStepIndex(stepIndex);
                    setCurrentPegsHistory(prev => [...prev, JSON.parse(JSON.stringify(currentPegs))]);

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
        <div className="flex flex-col min-h-screen bg-base-200 relative">
            <NavBar/>
            <AlgorithmNavbar/>

            {/* Complexity Information Panel */}
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="collapse collapse-arrow bg-base-100 shadow-xl border border-base-300 rounded-2xl overflow-hidden">
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
                                                    <div className="badge badge-primary badge-lg font-mono font-bold">O(n)</div>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                    <span className="font-semibold text-base-content/80">Space Complexity:</span>
                                                    <div className="badge badge-primary badge-outline badge-lg font-mono font-bold">O(n)</div>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-4 bg-info/10 rounded-xl border-l-4 border-info">
                                                <p className="text-sm text-base-content/80 leading-relaxed">
                                                    Tower of Hanoi recursively moves a stack of disks from a source rod to a target rod using an auxiliary rod,
                                                    following the rule that only one disk can be moved at a time and no larger disk may be placed on top of a smaller one,
                                                    resulting in exponential time complexity with logarithmic space usage due to the recursive call stack.
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

            {/* Header Section - Connected to Collapse Above */}
            <div className="w-full px-4 sm:px-6 lg:px-8 -mt-2.5 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-indigo-900 rounded-b-2xl p-4 shadow-xl border border-slate-600/30 backdrop-blur-sm relative overflow-hidden">
                        {/* Subtle animated background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 -left-4 w-72 h-72 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
                            <div className="absolute top-0 -right-4 w-72 h-72 bg-gradient-to-l from-cyan-500 to-blue-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
                        </div>

                        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            {/* Left Section - Title and Status */}
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-xl font-bold text-white">!</span>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800 animate-pulse"></div>
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent tracking-tight">
                                        Tower of Hanoi: {number} Disks
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border transition-all duration-300 ${
                                            isCalculating
                                                ? 'bg-yellow-500/20 border-yellow-400/40 text-yellow-200'
                                                : 'bg-blue-500/20 border-blue-400/40 text-blue-200'
                                        }`}>
                                            <div className={`w-2 h-2 rounded-full ${
                                                isCalculating
                                                    ? 'bg-yellow-400 animate-ping'
                                                    :'bg-blue-400 animate-pulse'
                                            }`}></div>
                                            <span>
                                                {isCalculating
                                                    ? 'Moving disks...'
                                                    : steps.length > 0
                                                        ? 'Ready'
                                                        : 'Awaiting input'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Section - Result Display */}

                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
                                    <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl px-6 py-3 border border-slate-600/50">
                                        <div className="flex items-center gap-3">
                                            <div className="text-center">
                                                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                                                    Number of Moves:
                                                </div>
                                                <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent font-mono">
                                                    {(Math.pow(2, number) - 1).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                        </div>
                    </div>
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
                <div className="flex flex-col lg:flex-row justify-center items-center gap-2 lg:gap-4 max-w-7xl mx-auto">
                    <button
                        className="btn btn-accent btn-sm lg:btn-md w-full lg:w-auto"
                        onClick={handleRandom}
                        disabled={isCalculating}
                        aria-label="Generate random number of disks"
                    >
                        Random
                    </button>
                    <button
                        className="btn btn-accent btn-sm lg:btn-md w-full lg:w-auto"
                        onClick={animateCalculationSteps}
                        disabled={isCalculating || steps.length === 0}
                        aria-label="Start disk moves"
                    >
                        Start Moves
                    </button>
                    <button
                        className="btn btn-accent btn-sm lg:btn-md w-full lg:w-auto"
                        onClick={handleStepBackward}
                        disabled={isCalculating || steps.length === 0 || currentStepIndex <= -1}
                        aria-label="Move to previous step"
                    >
                        Step Backward
                    </button>
                    <button
                        className="btn btn-accent btn-sm lg:btn-md w-full lg:w-auto"
                        onClick={handleStepForward}
                        disabled={isCalculating || steps.length === 0 || currentStepIndex >= steps.length - 1}
                        aria-label="Move to next step"
                    >
                        Step Forward
                    </button>
                    <div className="join flex items-center w-full lg:max-w-sm">
                        <input
                            type="number"
                            value={inputValue}
                            className="input input-bordered join-item w-full text-xs lg:text-sm"
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
                    <div className="flex items-center gap-2 w-full lg:max-w-sm">
                        <span className="text-xs lg:text-sm font-semibold whitespace-nowrap light:text-black/80">
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
                        <span className="text-xs lg:text-sm text-base-content/70 whitespace-nowrap w-12">
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