import { useState, useEffect, useRef, useContext } from 'react';
import * as d3 from 'd3';
import axios from "axios";
import NavBar from "../../components/navBar.jsx";
import { ErrorContext } from "../../context/errorContext.jsx";

const BFS = () => {
    const [adjacencyList, setAdjacencyList] = useState({});
    const [startNode, setStartNode] = useState("");
    const [nodeInput, setNodeInput] = useState("");
    const [edgeInput, setEdgeInput] = useState("");
    const [isSorting, setIsSorting] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { setError } = useContext(ErrorContext);
    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);
    const [size, setSize] = useState(10);

    const graphMenu = [
        { label: 'BFS', path: '/visualizer/bfs' },
        { label: 'DFS', path: '/visualizer/dfs' },
        { label: 'Dijkstra', path: '/visualizer/dijkstra' },
        { label: 'A*', path: '/visualizer/astar' },
        { label: 'Prim', path: '/visualizer/prim' },
        { label: 'Kruskal', path: '/visualizer/kruskal' }
    ];

    // Visualization colors
    const nodeDefaultColor = "#EDE2F3";
    const nodeVisitedColor = "orange";
    const nodeQueuedColor = "blue";
    const nodeCurrentColor = "green";
    const edgeDefaultColor = "#999";
    const edgeTraversedColor = "#6E199F";
    const FONT_COLOR = "#6E199F";

    // Handle input changes
    const handleNodeInput = (e) => {
        e.preventDefault();
        setNodeInput(e.target.value);
    };

    const handleEdgeInput = (e) => {
        e.preventDefault();
        setEdgeInput(e.target.value);
    };

    const handleStartNodeInput = (e) => {
        e.preventDefault();
        setStartNode(e.target.value);
    };

    const handleSizeInput = (e) => {
        e.preventDefault();
        setSize(e.target.value);
    };

    // Add nodes to the graph
    const addNodes = (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        try {
            const nodes = nodeInput.split(",").map(node => node.trim()).filter(Boolean);

            if (nodes.length === 0) {
                setError("Please enter at least one node");
                return;
            }

            // Create new adjacency list with the nodes
            const newAdjacencyList = { ...adjacencyList };
            nodes.forEach(node => {
                if (!newAdjacencyList[node]) {
                    newAdjacencyList[node] = [];
                }
            });

            setAdjacencyList(newAdjacencyList);
            setNodeInput("");
            drawGraph(newAdjacencyList);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    // Add edges to the graph
    const addEdge = (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        try {
            const edgeParts = edgeInput.split("-").map(part => part.trim());

            if (edgeParts.length !== 2) {
                setError("Edge must be in format 'nodeA-nodeB'");
                return;
            }

            const [fromNode, toNode] = edgeParts;

            // Check if nodes exist
            if (!adjacencyList[fromNode] || !adjacencyList[toNode]) {
                setError("Both nodes must exist in the graph");
                return;
            }

            // Add edge (for undirected graph, add in both directions)
            const newAdjacencyList = { ...adjacencyList };

            if (!newAdjacencyList[fromNode].includes(toNode)) {
                newAdjacencyList[fromNode] = [...newAdjacencyList[fromNode], toNode];
            }

            if (!newAdjacencyList[toNode].includes(fromNode)) {
                newAdjacencyList[toNode] = [...newAdjacencyList[toNode], fromNode];
            }

            setAdjacencyList(newAdjacencyList);
            setEdgeInput("");
            drawGraph(newAdjacencyList);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    // Generate a random graph
    const generateRandomGraph = (size) => {
        const sizeInput = Number(size);
        if (!Number.isInteger(sizeInput) || sizeInput < 0) {
            setError("Size must be a non-negative integer");
            return {};
        }

        // Create nodes
        const nodes = Array.from({ length: sizeInput }, (_, i) => String.fromCharCode(65 + i)); // A, B, C, ...

        // Create adjacency list
        const newAdjacencyList = {};
        nodes.forEach(node => {
            newAdjacencyList[node] = [];
        });

        // Add random edges (approximately 2 * nodes edges for connected but not too dense graph)
        const edgeCount = Math.min(sizeInput * 2, sizeInput * (sizeInput - 1) / 2);
        let addedEdges = 0;

        // First ensure graph connectivity by creating a spanning tree
        for (let i = 1; i < nodes.length; i++) {
            const fromNode = nodes[Math.floor(Math.random() * i)];
            const toNode = nodes[i];
            newAdjacencyList[fromNode].push(toNode);
            newAdjacencyList[toNode].push(fromNode);
            addedEdges++;
        }

        // Add additional random edges
        while (addedEdges < edgeCount) {
            const fromIndex = Math.floor(Math.random() * nodes.length);
            const toIndex = Math.floor(Math.random() * nodes.length);

            if (fromIndex !== toIndex) {
                const fromNode = nodes[fromIndex];
                const toNode = nodes[toIndex];

                if (!newAdjacencyList[fromNode].includes(toNode)) {
                    newAdjacencyList[fromNode].push(toNode);
                    newAdjacencyList[toNode].push(fromNode);
                    addedEdges++;
                }
            }
        }

        // Set a default start node
        setStartNode(nodes[0]);

        return newAdjacencyList;
    };

    const handleRandom = (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        const randomGraph = generateRandomGraph(size);
        setAdjacencyList(randomGraph);
        drawGraph(randomGraph);
    };

    const isInitializedRef = useRef(false);

    useEffect(() => {
        const initializeVisualization = () => {
            if (svgRef.current && !isInitializedRef.current) {
                isInitializedRef.current = true;
                handleRandom();
            }
        };

        const timer = setTimeout(initializeVisualization, 100);
        return () => clearTimeout(timer);
    }, []);

    // Draw the graph using D3
    const drawGraph = (graph) => {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = svgRef.current.clientWidth;
        const height = 400;
        svg.attr("viewBox", `0 0 ${width} ${height}`);

        // Create force simulation
        const nodes = Object.keys(graph).map(id => ({ id }));
        const links = [];

        Object.entries(graph).forEach(([source, targets]) => {
            targets.forEach(target => {
                // Add each edge only once
                const existingLink = links.find(
                    link => (link.source === source && link.target === target) ||
                        (link.source === target && link.target === source)
                );
                if (!existingLink) {
                    links.push({ source, target });
                }
            });
        });

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .stop();

        // Run simulation for 100 iterations
        for (let i = 0; i < 100; ++i) simulation.tick();

        // Draw links
        const link = svg.append("g")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke", edgeDefaultColor)
            .attr("stroke-width", 2)
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y)
            .attr("class", "graph-edge")
            .attr("data-source", d => d.source.id)
            .attr("data-target", d => d.target.id);

        // Draw nodes
        const nodeGroup = svg.append("g")
            .selectAll("g")
            .data(nodes)
            .enter().append("g")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .attr("class", "node-group")
            .attr("data-id", d => d.id);

        nodeGroup.append("circle")
            .attr("r", 20)
            .attr("fill", nodeDefaultColor)
            .attr("stroke", FONT_COLOR)
            .attr("stroke-width", 2)
            .attr("class", "graph-node");

        nodeGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("fill", FONT_COLOR)
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .text(d => d.id);
    };

    // Reset node and edge colors
    const resetHighlight = () => {
        d3.select(svgRef.current)
            .selectAll(".graph-node")
            .attr("fill", nodeDefaultColor);

        d3.select(svgRef.current)
            .selectAll(".graph-edge")
            .attr("stroke", edgeDefaultColor);
    };

    // Highlight a node with the specified color
    const highlightNode = (nodeId, color) => {
        d3.select(svgRef.current)
            .selectAll(".node-group")
            .filter(d => d.id === nodeId)
            .select(".graph-node")
            .attr("fill", color);
    };

    // Highlight an edge with the specified color
    const highlightEdge = (sourceId, targetId, color) => {
        d3.select(svgRef.current)
            .selectAll(".graph-edge")
            .filter(d =>
                (d.source.id === sourceId && d.target.id === targetId) ||
                (d.source.id === targetId && d.target.id === sourceId)
            )
            .attr("stroke", color);
    };

    // Animate BFS traversal
    const animateBFSSteps = async (steps) => {
        for (const step of steps) {
            if (isCancelledRef.current) break;

            if (step.type === "queue") {
                // Node added to queue
                highlightNode(step.node, nodeQueuedColor);
            } else if (step.type === "dequeue") {
                // Current node being visited
                highlightNode(step.node, nodeCurrentColor);
            } else if (step.type === "visit") {
                // Neighbor node being visited
                highlightNode(step.node, nodeVisitedColor);
                if (step.from) {
                    highlightEdge(step.from, step.node, edgeTraversedColor);
                }
            } else if (step.type === "finish") {
                // Node finished processing
                highlightNode(step.node, nodeVisitedColor);
            }

            await new Promise(resolve => setTimeout(resolve, speedRef.current));
        }
    };

    // Start BFS traversal
    const startTraversal = async () => {
        if (Object.keys(adjacencyList).length > 0 && startNode) {
            setIsSorting(true);
            isCancelledRef.current = false;
            resetHighlight();

            try {
                // In a real implementation, this would call the backend API
                // For demonstration, we'll simulate the BFS steps here
                const bfsSteps = simulateBFS(adjacencyList, startNode);
                await animateBFSSteps(bfsSteps);
            } catch (err) {
                setError(err.message || 'Failed to process BFS traversal');
            }

            setIsSorting(false);
        } else {
            setError("Please add nodes and select a start node");
        }
    };

    // Simulate BFS traversal and generate steps
    const simulateBFS = (graph, start) => {
        const steps = [];
        const visited = new Set();
        const queue = [start];
        visited.add(start);

        // Add start node to queue
        steps.push({ type: "queue", node: start });

        while (queue.length > 0) {
            const current = queue.shift();
            steps.push({ type: "dequeue", node: current });

            // Get neighbors
            const neighbors = graph[current] || [];

            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                    steps.push({ type: "visit", node: neighbor, from: current });
                    steps.push({ type: "queue", node: neighbor });
                }
            }

            steps.push({ type: "finish", node: current });
        }

        return steps;
    };

    // Update speed ref when speed changes
    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    return (
        <div className="flex flex-col h-full">
            <NavBar menuItems={graphMenu} />
            <div className="flex justify-center mt-6 flex-grow">
                <svg ref={svgRef} className="block w-full h-auto"></svg>
            </div>
            <div className="flex flex-col items-center mb-4">
                <div className="flex justify-center items-center flex-row flex-wrap">
                    <button className="btn mr-2" onClick={handleRandom}>
                        Random Graph
                    </button>
                    <button className="btn mr-4" onClick={startTraversal} disabled={isSorting}>
                        Start BFS
                    </button>
                    <div className="join flex items-center w-full max-w-md mr-4">
                        <input
                            type="text"
                            value={nodeInput}
                            placeholder="Add nodes (e.g., A,B,C)"
                            className="input join-item w-full"
                            onChange={handleNodeInput}
                        />
                        <button
                            className="btn join-item"
                            onClick={addNodes}
                            disabled={isSubmitting}
                        >
                            Add Nodes
                        </button>
                    </div>

                    <div className="join flex items-center w-full max-w-md mr-4">
                        <input
                            type="text"
                            value={edgeInput}
                            placeholder="Add edge (e.g., A-B)"
                            className="input join-item w-full"
                            onChange={handleEdgeInput}
                        />
                        <button
                            className="btn join-item"
                            onClick={addEdge}
                            disabled={isSubmitting}
                        >
                            Add Edge
                        </button>
                    </div>
                </div>

                <div className="flex justify-center items-center flex-row mt-2">
                    <div className="join flex items-center w-full max-w-md mr-4">
                        <input
                            type="text"
                            value={startNode}
                            placeholder="Start node (e.g., A)"
                            className="input join-item w-full"
                            onChange={handleStartNodeInput}
                        />
                    </div>

                    <div className="join flex items-center w-full max-w-md mr-4">
                        <input
                            type="number"
                            value={size}
                            className="input join-item w-full"
                            onChange={handleSizeInput}
                        />
                        <span className="ml-2">Nodes</span>
                    </div>

                    <div className="flex justify-center items-center w-full max-w-md">
                        <input
                            type="range"
                            min={50}
                            max="1000"
                            value={speed}
                            className="range range-primary"
                            onChange={(e) => setSpeed(Number(e.target.value))}
                        />
                        <span className="ml-2">Speed: {speed} ms</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BFS;