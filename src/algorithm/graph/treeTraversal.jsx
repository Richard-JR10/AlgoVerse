import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import NavBar from "../../components/navBar.jsx";
import AlgorithmNavbar from "../algorithmNavbar.jsx";

// Constants
const COLORS = {
    NODE_DEFAULT: '#EDE2F3',
    NODE_VISITED: 'orange',
    NODE_CURRENT: 'green',
    NODE_QUEUED: 'blue',
    EDGE_DEFAULT: '#999',
    EDGE_TRAVERSED: '#6E199F',
    FONT: '#6E199F',
    NODE_HIGHLIGHT: '#FFEB3B'
};

const DIMENSIONS = {
    WIDTH: 1000,
    HEIGHT: 500,
    NODE_RADIUS: 25,
    LEVEL_HEIGHT: 80,
    MIN_HORIZONTAL_SPACING: 60
};

const TreeTraversal = () => {
    const [tree, setTree] = useState(null);
    const [traversalType, setTraversalType] = useState('inorder');
    const [nodeInput, setNodeInput] = useState('');
    const [speed, setSpeed] = useState(500);
    const [isAnimating, setIsAnimating] = useState(false);
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [visited, setVisited] = useState([]);
    const [error, setError] = useState(null);
    const [executionTime, setExecutionTime] = useState(null);
    const [showComplexity, setShowComplexity] = useState(false);
    const [size, setSize] = useState(7);

    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);

    // Tree Node class
    class TreeNode {
        constructor(value) {
            this.value = value;
            this.left = null;
            this.right = null;
        }
    }

    // Build tree from array (level-order, null for missing nodes)
    const buildTreeFromArray = (arr) => {
        if (!arr || arr.length === 0 || arr[0] === null) return null;

        const root = new TreeNode(arr[0]);
        const queue = [root];
        let i = 1;

        while (queue.length > 0 && i < arr.length) {
            const node = queue.shift();

            if (i < arr.length && arr[i] !== null) {
                node.left = new TreeNode(arr[i]);
                queue.push(node.left);
            }
            i++;

            if (i < arr.length && arr[i] !== null) {
                node.right = new TreeNode(arr[i]);
                queue.push(node.right);
            }
            i++;
        }

        return root;
    };

    // Traversal algorithms
    const inorderTraversal = (node, steps = []) => {
        if (!node) return steps;

        steps.push({ type: 'visit', node: node.value, action: 'exploring_left' });
        inorderTraversal(node.left, steps);

        steps.push({ type: 'process', node: node.value });

        steps.push({ type: 'visit', node: node.value, action: 'exploring_right' });
        inorderTraversal(node.right, steps);

        return steps;
    };

    const preorderTraversal = (node, steps = []) => {
        if (!node) return steps;

        steps.push({ type: 'process', node: node.value });

        steps.push({ type: 'visit', node: node.value, action: 'exploring_left' });
        preorderTraversal(node.left, steps);

        steps.push({ type: 'visit', node: node.value, action: 'exploring_right' });
        preorderTraversal(node.right, steps);

        return steps;
    };

    const postorderTraversal = (node, steps = []) => {
        if (!node) return steps;

        steps.push({ type: 'visit', node: node.value, action: 'exploring_left' });
        postorderTraversal(node.left, steps);

        steps.push({ type: 'visit', node: node.value, action: 'exploring_right' });
        postorderTraversal(node.right, steps);

        steps.push({ type: 'process', node: node.value });

        return steps;
    };

    const getTraversalSteps = (root, type) => {
        const startTime = performance.now();
        let steps = [];

        switch(type) {
            case 'inorder':
                steps = inorderTraversal(root);
                break;
            case 'preorder':
                steps = preorderTraversal(root);
                break;
            case 'postorder':
                steps = postorderTraversal(root);
                break;
            default:
                steps = inorderTraversal(root);
        }

        const endTime = performance.now();
        setExecutionTime((endTime - startTime) / 1000);

        return steps;
    };

    // Convert tree to D3 hierarchy format
    const treeToHierarchy = (node) => {
        if (!node) return null;

        return {
            name: node.value,
            children: [node.left, node.right]
                .filter(child => child !== null)
                .map(child => treeToHierarchy(child))
        };
    };

    // Draw tree
    const drawTree = (treeRoot) => {
        if (!svgRef.current || !treeRoot) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const width = svgRef.current.clientWidth || DIMENSIONS.WIDTH;
        const height = DIMENSIONS.HEIGHT;
        svg.attr('viewBox', `0 0 ${width} ${height}`);

        const hierarchyData = treeToHierarchy(treeRoot);
        const root = d3.hierarchy(hierarchyData);

        const treeLayout = d3.tree()
            .size([width - 100, height - 100])
            .separation((a, b) => (a.parent === b.parent ? 1.5 : 2));

        treeLayout(root);

        // Draw links
        const links = svg.append('g')
            .selectAll('path')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'tree-edge')
            .attr('data-source', d => d.source.data.name)
            .attr('data-target', d => d.target.data.name)
            .attr('d', d3.linkVertical()
                .x(d => d.x + 50)
                .y(d => d.y + 50))
            .attr('fill', 'none')
            .attr('stroke', COLORS.EDGE_DEFAULT)
            .attr('stroke-width', 2);

        // Draw nodes
        const nodes = svg.append('g')
            .selectAll('g')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'node-group')
            .attr('data-id', d => d.data.name)
            .attr('transform', d => `translate(${d.x + 50},${d.y + 50})`);

        nodes.append('circle')
            .attr('r', DIMENSIONS.NODE_RADIUS)
            .attr('fill', COLORS.NODE_DEFAULT)
            .attr('stroke', COLORS.FONT)
            .attr('stroke-width', 2)
            .attr('class', 'tree-node');

        nodes.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', COLORS.FONT)
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .text(d => d.data.name);
    };

    // Highlight functions
    const highlightNode = (nodeValue, color) => {
        if (!svgRef.current) return;
        d3.select(svgRef.current)
            .selectAll('.node-group')
            .filter(d => d.data.name === nodeValue)
            .select('.tree-node')
            .transition()
            .duration(200)
            .attr('fill', color);
    };

    const resetHighlight = () => {
        if (!svgRef.current) return;
        d3.select(svgRef.current).selectAll('.tree-node')
            .attr('fill', COLORS.NODE_DEFAULT);
        d3.select(svgRef.current).selectAll('.tree-edge')
            .attr('stroke', COLORS.EDGE_DEFAULT)
            .attr('stroke-width', 2);
    };

    // Animation
    const animateSingleStep = async (step) => {
        switch(step.type) {
            case 'visit':
                highlightNode(step.node, COLORS.NODE_QUEUED);
                break;
            case 'process':
                highlightNode(step.node, COLORS.NODE_CURRENT);
                await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
                highlightNode(step.node, COLORS.NODE_VISITED);
                setVisited(prev => [...prev, step.node]);
                break;
        }
        await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
    };

    const startTraversal = async () => {
        if (!tree || isAnimating) return;

        setIsAnimating(true);
        isCancelledRef.current = false;
        resetHighlight();
        setVisited([]);
        setCurrentStepIndex(-1);

        const traversalSteps = getTraversalSteps(tree, traversalType);
        setSteps(traversalSteps);

        for (let i = 0; i < traversalSteps.length; i++) {
            if (isCancelledRef.current) break;
            setCurrentStepIndex(i);
            await animateSingleStep(traversalSteps[i]);
        }

        setIsAnimating(false);
    };

    const handleStepForward = async () => {
        if (isAnimating || currentStepIndex >= steps.length - 1 || steps.length === 0) return;

        const nextIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextIndex);
        await animateSingleStep(steps[nextIndex]);
    };

    const handleStepBackward = () => {
        if (isAnimating || currentStepIndex <= -1 || steps.length === 0) return;

        const prevIndex = currentStepIndex - 1;
        setCurrentStepIndex(prevIndex);

        resetHighlight();
        const newVisited = [];

        for (let i = 0; i <= prevIndex; i++) {
            const step = steps[i];
            if (step.type === 'visit') {
                highlightNode(step.node, COLORS.NODE_QUEUED);
            } else if (step.type === 'process') {
                highlightNode(step.node, COLORS.NODE_VISITED);
                newVisited.push(step.node);
            }
        }

        setVisited(newVisited);
    };

    const cancelTraversal = () => {
        isCancelledRef.current = true;
        setIsAnimating(false);
        resetHighlight();
        setCurrentStepIndex(-1);
    };

    // Handle tree input
    const handleAddTree = () => {
        try {
            const input = nodeInput.trim();
            if (!input) throw new Error('Please enter tree values');

            const values = input.split(',').map(v => {
                const trimmed = v.trim();
                return trimmed === 'null' ? null : trimmed;
            });

            const newTree = buildTreeFromArray(values);
            if (!newTree) throw new Error('Invalid tree structure');

            setTree(newTree);
            drawTree(newTree);

            const traversalSteps = getTraversalSteps(newTree, traversalType);
            setSteps(traversalSteps);
            setCurrentStepIndex(-1);
            setVisited([]);

            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const generateRandomTree = () => {
        const treeSize = Math.min(Math.max(1, Number(size)), 15);
        const values = Array.from({ length: treeSize }, (_, i) => i + 1);

        // Shuffle values
        for (let i = values.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [values[i], values[j]] = [values[j], values[i]];
        }

        // Randomly insert nulls for variety
        const withNulls = [];
        values.forEach(v => {
            withNulls.push(v);
            if (Math.random() > 0.7) withNulls.push(null);
        });

        const newTree = buildTreeFromArray(withNulls);
        setTree(newTree);
        drawTree(newTree);

        const traversalSteps = getTraversalSteps(newTree, traversalType);
        setSteps(traversalSteps);
        setCurrentStepIndex(-1);
        setVisited([]);
    };

    // Handle traversal type change
    useEffect(() => {
        if (tree) {
            const traversalSteps = getTraversalSteps(tree, traversalType);
            setSteps(traversalSteps);
            setCurrentStepIndex(-1);
            setVisited([]);
            resetHighlight();
        }
    }, [traversalType]);

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        generateRandomTree();
    }, []);

    return (
        <div className="flex flex-col scrollbar-hide overflow-auto h-screen bg-base-200 relative">
            <NavBar/>
            <AlgorithmNavbar/>
            {/* Algorithm Performance Analysis */}
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
                                <span className="text-primary">Algorithm Performance Analysis</span>
                            </div>
                        </div>
                        <div className="collapse-content bg-base-100">
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
                                                    <div className="badge badge-primary badge-outline badge-lg font-mono font-bold">O(h)</div>
                                                </div>
                                            </div>
                                            <div className="mt-4 p-4 bg-info/10 rounded-xl border-l-4 border-info">
                                                <p className="text-sm text-base-content/80 leading-relaxed">
                                                    All traversals visit each node once (O(n) time). Space complexity is O(h) due to recursion stack, where h is tree height.
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
                                            {executionTime !== null ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-xl border border-secondary/10">
                                                        <span className="font-semibold text-base-content/80">Execution Time:</span>
                                                        <div className="badge badge-secondary badge-lg font-mono font-bold">
                                                            {executionTime.toFixed(4)}s
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
                                                </div>
                                            ) : (
                                                <div className="h-full">
                                                    <div className="flex flex-col h-full items-center justify-center p-8 bg-neutral/5 rounded-xl border-2 border-dashed border-base-300">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="w-12 h-12 rounded-full bg-neutral/10 flex items-center justify-center mb-3">
                                                                <span className="text-2xl">⏱️</span>
                                                            </div>
                                                            <p className="flex-1 text-sm text-base-content/60 text-center">
                                                                Run a tree traversal to see<br />detailed execution metrics
                                                            </p>
                                                        </div>
                                                    </div>
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

            <div className="flex justify-center flex-grow relative">
                <svg ref={svgRef} className="lg:ml-[10%] flex-1 flex"></svg>
                <div className="hidden lg:flex gap-2 items-start mr-12 mt-4">
                    <div className="flex flex-col items-center z-20 border-2 border-primary/30 bg-base-100 rounded-xl shadow-xl xl:w-40 h-fit overflow-hidden">
                        <div className="w-full text-center text-sm font-bold bg-gradient-to-r from-primary to-secondary text-primary-content py-3 border-b-2 border-primary/30">
                            <div className="flex items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                </svg>
                                <span>TRAVERSAL</span>
                            </div>
                        </div>
                        <div className="px-4 py-3 w-full min-h-[100px] max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-base-200">
                            {visited.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-base-content/40">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                    <span className="text-xs text-center">Start traversal<br/>to see output</span>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {visited.map((item, index) => (
                                        <div
                                            key={index}
                                            className="relative"
                                        >
                                            <div className="badge badge-lg bg-gradient-to-br from-primary to-secondary text-primary-content font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border-2 border-primary/50 px-4 py-3">
                                                {item}
                                            </div>
                                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-accent text-accent-content rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                                                {index + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {visited.length > 0 && (
                            <div className="w-full px-4 py-2 bg-base-200/50 border-t border-primary/20">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-base-content/60">Total:</span>
                                    <span className="badge badge-sm badge-primary font-bold">{visited.length}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center mb-4 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col xl:flex-row justify-center items-center gap-3 sm:gap-4 w-full xl:w-auto">
                    <div className="flex items-center gap-2 w-full xl:w-auto">
                        <span className="text-xs font-semibold">SPEED:</span>
                        <input
                            type="range"
                            min="50"
                            max="1000"
                            step="50"
                            value={speed}
                            className="range range-primary range-xs w-full xl:w-32"
                            onChange={(e) => setSpeed(Number(e.target.value))}
                        />
                        <span className="text-xs text-base-content/70 whitespace-nowrap w-12">{speed} ms</span>
                    </div>

                    <div className="flex flex-row items-center gap-1 w-full xl:w-auto">
                        <div className="join w-full">
                            <span className="join-item p-2 bg-base-200 text-sm font-semibold">Size</span>
                            <input
                                type="number"
                                value={size}
                                min="1"
                                max="15"
                                className="input join-item rounded-l-lg w-full xl:w-24"
                                onChange={(e) => setSize(e.target.value)}
                            />
                            <button
                                className="join-item btn btn-primary rounded-r-lg w-auto btn-md xl:w-24"
                                onClick={generateRandomTree}
                                disabled={isAnimating}
                            >
                                Random
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-row items-center gap-1 w-full xl:w-auto">
                        <div className="join w-full">
                            <select
                                value={traversalType}
                                onChange={(e) => setTraversalType(e.target.value)}
                                className="select select-bordered join-item w-full xl:w-32"
                                disabled={isAnimating}
                            >
                                <option value="inorder">In-Order</option>
                                <option value="preorder">Pre-Order</option>
                                <option value="postorder">Post-Order</option>
                            </select>
                            <button
                                className="join-item btn btn-success rounded-r-lg w-auto btn-md xl:w-32"
                                onClick={startTraversal}
                                disabled={!tree || isAnimating}
                            >
                                {isAnimating ? 'Running...' : 'Start'}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-row gap-2 md:gap-4 items-center justify-center w-full xl:w-auto">
                        <button
                            className={`btn btn-accent btn-sm lg:btn-md rounded-lg flex-1 lg:w-auto ${isAnimating || currentStepIndex <= -1 || steps.length === 0 ? 'btn-disabled' : ''}`}
                            onClick={handleStepBackward}
                            aria-label="Step backward"
                        >
                            Backward
                        </button>
                        <button
                            className={`btn btn-accent btn-sm lg:btn-md rounded flex-1 lg:w-auto ${isAnimating || currentStepIndex >= steps.length - 1 || steps.length === 0 ? 'btn-disabled' : ''}`}
                            onClick={handleStepForward}
                            aria-label="Step forward"
                        >
                            Forward
                        </button>
                    </div>

                    <div className="flex flex-row items-center gap-1 w-full xl:w-auto">
                        <div className="join w-full">
                            <span className="join-item p-2 bg-base-200 text-sm font-semibold">Tree</span>
                            <input
                                type="text"
                                value={nodeInput}
                                placeholder="e.g., 1,2,3,null,5"
                                className="input join-item rounded-l-lg w-full xl:w-48"
                                onChange={(e) => setNodeInput(e.target.value)}
                            />
                            <button
                                className="btn btn-accent join-item rounded-r-lg"
                                onClick={handleAddTree}
                                disabled={isAnimating || !nodeInput.trim()}
                            >
                                Set
                            </button>
                        </div>
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

export default TreeTraversal;