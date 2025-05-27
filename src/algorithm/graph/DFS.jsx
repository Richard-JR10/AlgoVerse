import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import NavBar from '../../components/navBar.jsx';
import axios from "axios";
import AlgorithmNavbar from "../algorithmNavbar.jsx";

// Constants for visualization
const COLORS = {
    NODE_DEFAULT: '#EDE2F3',
    NODE_VISITED: 'orange',
    NODE_QUEUED: 'blue',
    NODE_CURRENT: 'green',
    EDGE_DEFAULT: '#999',
    EDGE_TRAVERSED: '#6E199F',
    FONT: '#6E199F',
    NODE_HIGHLIGHT: '#FFEB3B'
};

const DIMENSIONS = {
    WIDTH: 800,
    HEIGHT: 400,
    PADDING: 40,
    NODE_RADIUS: 20,
    OVERLAP_THRESHOLD: 50,
    MIN_DISTANCE: 60,
    MAX_DISTANCE: 300,
    OFFSET_DISTANCE: 8
};

const SIMULATION_PARAMS = {
    CHARGE_STRENGTH: -400,
    CENTER_STRENGTH: 0.1,
    COLLISION_RADIUS_MULTIPLIER: 2,
    POSITION_STRENGTH: 0.1,
    LINK_STRENGTH: 0.5,
    ALPHA: 0.3,
    MAX_ITERATIONS: 500,
    MIN_ITERATIONS: 200,
    SIMULATION_STOP_DELAY: 2000
};

const DFS = () => {
    const [adjacencyList, setAdjacencyList] = useState({});
    const [startNode, setStartNode] = useState('A');
    const [nodeInput, setNodeInput] = useState('');
    const [edgeInput, setEdgeInput] = useState('');
    const [isSorting, setIsSorting] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [size, setSize] = useState(6);
    const [error, setError] = useState(null);
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [executionTime, setExecutionTime] = useState(null);
    const [showComplexity, setShowComplexity] = useState(false);
    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);
    const isInitializedRef = useRef(false);

    const baseURL = 'https://algoverse-backend-python.onrender.com';

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Input handlers
    const handleNodeInput = (e) => setNodeInput(e.target.value.toUpperCase());
    const handleEdgeInput = (e) => setEdgeInput(e.target.value.toUpperCase());
    const handleStartNodeInput = (e) => {
        const newStartNode = e.target.value.toUpperCase();
        setStartNode(newStartNode);
        if (newStartNode && adjacencyList[newStartNode]) {
            fetchDFSSteps(adjacencyList, newStartNode);
        } else {
            setSteps([]);
            setCurrentStepIndex(-1);
        }
    };
    const handleSizeInput = (e) => setSize(Math.max(1, Math.min(26, Number(e.target.value))));

    // Fetch DFS steps
    const fetchDFSSteps = async (graph, start) => {
        if (!start || !graph[start]) return;
        try {
            resetHighlight();
            const startTime = performance.now();
            const response = await axios.post(`${baseURL}/graph/dfs`, {
                adjacency_list: graph,
                start_node: start
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const endTime = performance.now();
            setExecutionTime((endTime - startTime) / 1000);
            setSteps(response.data);
            setCurrentStepIndex(-1);
        } catch (err) {
            console.error('Failed to fetch DFS steps:', err);
            setError(err.response?.data?.detail || 'Failed to fetch DFS steps');
            setSteps([]);
        }
    };

    // Validate and add nodes
    const addNodes = async (e) => {
        e.preventDefault();
        if (isSubmitting || isAnimating) return;
        setIsSubmitting(true);

        try {
            const nodes = nodeInput.split(',').map(node => node.trim()).filter(Boolean);
            if (nodes.length === 0) throw new Error('Please enter at least one node');
            if (nodes.some(node => !/^[A-Z]+[0-9]*$/.test(node))) {
                throw new Error('Nodes must be letters (A-Z) optionally followed by numbers');
            }

            const newAdjacencyList = { ...adjacencyList };
            nodes.forEach(node => {
                if (!newAdjacencyList[node]) newAdjacencyList[node] = [];
            });

            if (!startNode && nodes.length > 0) setStartNode(nodes[0]);

            setAdjacencyList(newAdjacencyList);
            setNodeInput('');
            await drawGraph(newAdjacencyList, nodes);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Validate and add directed edge
    const addEdge = async (e) => {
        e.preventDefault();
        if (isSubmitting || isAnimating) return;
        setIsSubmitting(true);

        try {
            const edgeParts = edgeInput.split('-').map(part => part.trim());
            if (edgeParts.length !== 2) throw new Error("Edge must be in format 'nodeA-nodeB'");
            if (edgeParts.some(part => !/^[A-Z]+[0-9]*$/.test(part))) {
                throw new Error('Nodes in edge must be letters (A-Z) optionally followed by numbers');
            }

            const [fromNode, toNode] = edgeParts;
            const newAdjacencyList = { ...adjacencyList };

            if (!newAdjacencyList[fromNode]) newAdjacencyList[fromNode] = [];
            if (!newAdjacencyList[toNode]) newAdjacencyList[toNode] = [];

            if (!newAdjacencyList[fromNode].includes(toNode)) {
                newAdjacencyList[fromNode].push(toNode);
            }

            if (!startNode) setStartNode(fromNode);

            const newNodes = [fromNode, toNode].filter(node => !adjacencyList[node]);
            setAdjacencyList(newAdjacencyList);
            setEdgeInput('');
            await drawGraph(newAdjacencyList, newNodes);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Generate a random graph with specified size
    const generateRandomGraph = (size) => {
        const sizeInput = Number(size);
        if (!Number.isInteger(sizeInput) || sizeInput <= 0 || sizeInput > 26) {
            setError('Size must be a positive integer between 1 and 26');
            return {};
        }

        const nodes = Array.from({ length: sizeInput }, (_, i) =>
            String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : '')
        );

        const newAdjacencyList = {};
        nodes.forEach(node => newAdjacencyList[node] = []);

        // Ensure connectivity
        for (let i = 1; i < nodes.length; i++) {
            const fromNode = nodes[Math.floor(Math.random() * i)];
            const toNode = nodes[i];
            if (!newAdjacencyList[fromNode].includes(toNode)) {
                newAdjacencyList[fromNode].push(toNode);
            }
        }

        // Add additional random edges
        const edgeCount = Math.min(sizeInput * 2, sizeInput * (sizeInput - 1));
        let addedEdges = nodes.length - 1;
        while (addedEdges < edgeCount) {
            const fromIndex = Math.floor(Math.random() * nodes.length);
            const toIndex = Math.floor(Math.random() * nodes.length);
            if (fromIndex !== toIndex) {
                const fromNode = nodes[fromIndex];
                const toNode = nodes[toIndex];
                if (!newAdjacencyList[fromNode].includes(toNode)) {
                    newAdjacencyList[fromNode].push(toNode);
                    addedEdges++;
                }
            }
        }

        setStartNode(nodes[0]);
        return newAdjacencyList;
    };

    const handleRandom = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting || isAnimating) return;
        setIsSubmitting(true);

        try {
            const randomGraph = generateRandomGraph(size);
            setAdjacencyList(randomGraph);
            await drawGraph(randomGraph, Object.keys(randomGraph));
            setError(null);
        } catch (err) {
            setError('Error generating random graph: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Draw the graph using D3
    const drawGraph = async (graph, newNodes = []) => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        const existingNodes = svg.selectAll('.node-group').size() > 0;
        const existingPositions = {};

        if (existingNodes) {
            svg.selectAll('.node-group').each(function (d) {
                const transform = d3.select(this).attr('transform');
                const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
                if (match) {
                    existingPositions[d.id] = {
                        x: parseFloat(match[1]),
                        y: parseFloat(match[2]),
                    };
                    d.x = parseFloat(match[1]);
                    d.y = parseFloat(match[2]);
                }
            });
        }

        svg.selectAll('*').remove();
        const width = svgRef.current.clientWidth || DIMENSIONS.WIDTH;
        const height = DIMENSIONS.HEIGHT;
        svg.attr('viewBox', `0 0 ${width} ${height}`);

        const nodeCount = Object.keys(graph).length;
        if (nodeCount === 0) return;

        const minX = DIMENSIONS.PADDING;
        const maxX = width - DIMENSIONS.PADDING;
        const minY = DIMENSIONS.PADDING;
        const maxY = height - DIMENSIONS.PADDING;

        const nodes = Object.keys(graph).map((id, index) => {
            const node = { id };
            if (newNodes.includes(id) && !existingPositions[id]) {
                let newX, newY, positionValid = false, attempts = 0;
                const angle = (2 * Math.PI * index) / nodeCount;
                const radius = Math.min(width, height) / 3;
                newX = width / 2 + radius * Math.cos(angle);
                newY = height / 2 + radius * Math.sin(angle);

                do {
                    positionValid = Object.values(existingPositions).every(pos => {
                        const dx = newX - pos.x;
                        const dy = newY - pos.y;
                        return Math.sqrt(dx * dx + dy * dy) >= DIMENSIONS.OVERLAP_THRESHOLD;
                    });
                    if (!positionValid) {
                        newX += Math.random() * 20 - 10;
                        newY += Math.random() * 20 - 10;
                    }
                    attempts++;
                } while (!positionValid && attempts < 100);

                node.x = Math.max(minX, Math.min(maxX, newX));
                node.y = Math.max(minY, Math.min(maxY, newY));
                existingPositions[id] = { x: node.x, y: node.y };
            } else if (existingPositions[id]) {
                node.x = existingPositions[id].x;
                node.y = existingPositions[id].y;
                node.fx = node.x;
                node.fy = node.y;
            }
            return node;
        });

        const nodeMap = new Map(nodes.map(node => [node.id, node]));
        const links = [];
        const linkMap = new Map();

        Object.entries(graph).forEach(([sourceId, targets]) => {
            targets.forEach(targetId => {
                const sourceNode = nodeMap.get(sourceId);
                const targetNode = nodeMap.get(targetId);
                if (sourceNode && targetNode) {
                    const key = `${sourceId}-${targetId}`;
                    const reverseKey = `${targetId}-${sourceId}`;
                    const isBidirectional = graph[targetId]?.includes(sourceId);

                    if (!linkMap.has(key)) {
                        links.push({
                            source: sourceNode,
                            target: targetNode,
                            direction: key,
                            isBidirectional,
                            offsetIndex: isBidirectional ? 0 : null,
                        });
                        linkMap.set(key, { node: targetNode });
                    }
                }
            });
        });

        const nodeDensity = nodeCount / (width * height);
        const optimalDistance = Math.max(DIMENSIONS.MIN_DISTANCE, Math.min(DIMENSIONS.MAX_DISTANCE, 150 / Math.sqrt(nodeDensity)));

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(optimalDistance).strength(SIMULATION_PARAMS.LINK_STRENGTH))
            .force('charge', d3.forceManyBody().strength(SIMULATION_PARAMS.CHARGE_STRENGTH))
            .force('center', d3.forceCenter(width / 2, height / 2).strength(SIMULATION_PARAMS.CENTER_STRENGTH))
            .force('collision', d3.forceCollide().radius(DIMENSIONS.NODE_RADIUS * SIMULATION_PARAMS.COLLISION_RADIUS_MULTIPLIER))
            .force('x', d3.forceX().x(d => Math.max(minX, Math.min(maxX, d.x))).strength(SIMULATION_PARAMS.POSITION_STRENGTH))
            .force('y', d3.forceY().y(d => Math.max(minY, Math.min(maxY, d.y))).strength(SIMULATION_PARAMS.POSITION_STRENGTH));

        svg.append('defs')
            .append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -6 12 12')
            .attr('refX', 10)
            .attr('refY', 0)
            .attr('markerWidth', 5)
            .attr('markerHeight', 5)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-6 L12,0 L0,6')
            .attr('fill', COLORS.EDGE_DEFAULT)
            .attr('stroke', 'none');

        const computeEdgePath = (d) => {
            const sourceX = d.source.x ?? minX;
            const sourceY = d.source.y ?? minY;
            const targetX = d.target.x ?? minX;
            const targetY = d.target.y ?? minY;

            const dx = targetX - sourceX;
            const dy = targetY - sourceY;
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length === 0) return `M${sourceX},${sourceY} L${targetX},${targetY}`;

            const offset = DIMENSIONS.NODE_RADIUS + 5;
            const scale = (length - 2 * offset) / length;
            const adjustedDx = dx * scale;
            const adjustedDy = dy * scale;

            let x1 = sourceX + (dx * offset) / length;
            let y1 = sourceY + (dy * offset) / length;
            let x2 = targetX - (dx * offset) / length;
            let y2 = targetY - (dy * offset) / length;

            if (d.isBidirectional && d.offsetIndex !== null) {
                const normalX = -dy / length;
                const normalY = dx / length;
                const sideMultiplier = d.offsetIndex === 0 ? -1 : 1;
                x1 += normalX * DIMENSIONS.OFFSET_DISTANCE * sideMultiplier;
                y1 += normalY * DIMENSIONS.OFFSET_DISTANCE * sideMultiplier;
                x2 += normalX * DIMENSIONS.OFFSET_DISTANCE * sideMultiplier;
                y2 += normalY * DIMENSIONS.OFFSET_DISTANCE * sideMultiplier;
            }

            return `M${x1},${y1} L${x2},${y2}`;
        };

        const link = svg.append('g')
            .selectAll('path')
            .data(links)
            .enter()
            .append('path')
            .attr('d', computeEdgePath)
            .attr('stroke', COLORS.EDGE_DEFAULT)
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('marker-end', 'url(#arrowhead)')
            .attr('class', 'graph-edge')
            .attr('data-source', d => d.source.id)
            .attr('data-target', d => d.target.id);

        const nodeGroup = svg.append('g')
            .selectAll('g')
            .data(nodes)
            .enter()
            .append('g')
            .attr('transform', d => `translate(${d.x || minX},${d.y || minY})`)
            .attr('class', 'node-group')
            .attr('data-id', d => d.id);

        nodeGroup.append('circle')
            .attr('r', DIMENSIONS.NODE_RADIUS)
            .attr('fill', d => newNodes.includes(d.id) ? COLORS.NODE_HIGHLIGHT : COLORS.NODE_DEFAULT)
            .attr('stroke', COLORS.FONT)
            .attr('stroke-width', 2)
            .attr('class', 'graph-node');

        nodeGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', COLORS.FONT)
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .text(d => d.id);

        if (newNodes.length > 0) {
            svg.selectAll('.node-group')
                .filter(d => newNodes.includes(d.id))
                .select('circle')
                .attr('r', 10)
                .transition()
                .duration(300)
                .attr('r', DIMENSIONS.NODE_RADIUS)
                .transition()
                .duration(300)
                .attr('fill', COLORS.NODE_DEFAULT);
        }

        if (startNode && nodes.some(node => node.id === startNode)) {
            highlightNode(startNode, COLORS.NODE_QUEUED);
        }

        if (newNodes.length > 0) {
            simulation.on('tick', () => {
                nodeGroup.attr('transform', d => {
                    d.x = Math.max(minX, Math.min(maxX, d.x));
                    d.y = Math.max(minY, Math.min(maxY, d.y));
                    return `translate(${d.x},${d.y})`;
                });
                link.attr('d', computeEdgePath);
            });

            setTimeout(() => {
                nodes.forEach(node => {
                    if (newNodes.includes(node.id)) {
                        delete node.fx;
                        delete node.fy;
                    }
                });
                simulation.alpha(SIMULATION_PARAMS.ALPHA).restart();
                setTimeout(() => simulation.stop(), SIMULATION_PARAMS.SIMULATION_STOP_DELAY);
            }, 100);
        } else {
            simulation.stop();
            const iterations = Math.min(SIMULATION_PARAMS.MAX_ITERATIONS, Math.max(SIMULATION_PARAMS.MIN_ITERATIONS, nodeCount * 10));
            for (let i = 0; i < iterations; i++) simulation.tick();
        }

        // Fetch DFS steps if startNode is valid
        await fetchDFSSteps(graph, startNode);
    };

    const resetHighlight = () => {
        if (!svgRef.current) return;
        d3.select(svgRef.current).selectAll('.graph-node').attr('fill', COLORS.NODE_DEFAULT);
        d3.select(svgRef.current).selectAll('.graph-edge').attr('stroke', COLORS.EDGE_DEFAULT);
        if (startNode && adjacencyList[startNode]) highlightNode(startNode, COLORS.NODE_QUEUED);
    };

    const highlightNode = (nodeId, color) => {
        if (!svgRef.current) return;
        d3.select(svgRef.current)
            .selectAll('.node-group')
            .filter(d => d.id === nodeId)
            .select('.graph-node')
            .attr('fill', color);
    };

    const highlightEdge = (sourceId, targetId, color) => {
        if (!svgRef.current) return;
        d3.select(svgRef.current)
            .selectAll('.graph-edge')
            .filter(d => (typeof d.source === 'object' ? d.source.id : d.source) === sourceId &&
                (typeof d.target === 'object' ? d.target.id : d.target) === targetId)
            .attr('stroke', color);
    };

    const resetEdgeHighlight = (sourceId, targetId) => {
        if (!svgRef.current) return;
        d3.select(svgRef.current)
            .selectAll('.graph-edge')
            .filter(d => (typeof d.source === 'object' ? d.source.id : d.source) === sourceId &&
                (typeof d.target === 'object' ? d.target.id : d.target) === targetId)
            .attr('stroke', COLORS.EDGE_DEFAULT);
    };

    const animateSingleStep = async (step) => {
        setIsAnimating(true);
        try {
            switch (step.type) {
                case 'queue':
                    highlightNode(step.node, COLORS.NODE_QUEUED);
                    break;
                case 'dequeue':
                    highlightNode(step.node, COLORS.NODE_CURRENT);
                    break;
                case 'explore':
                    highlightEdge(step.source, step.target, COLORS.EDGE_TRAVERSED);
                    break;
                case 'visited':
                    resetEdgeHighlight(step.source, step.target);
                    break;
                case 'visit':
                case 'finish':
                    highlightNode(step.node, COLORS.NODE_VISITED);
                    break;
            }
            await new Promise(resolve => setTimeout(resolve, speedRef.current / 2));
        } catch (err) {
            setError(`Error in step: ${err.message}`);
        } finally {
            setIsAnimating(false);
        }
    };

    const handleStepForward = async () => {
        if (isAnimating || currentStepIndex >= steps.length - 1 || steps.length === 0) return;

        const nextStepIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextStepIndex);
        await animateSingleStep(steps[nextStepIndex]);
    };

    const handleStepBackward = async () => {
        if (isAnimating || currentStepIndex <= -1 || steps.length === 0) return;

        setIsAnimating(true);
        const prevStepIndex = currentStepIndex - 1;
        setCurrentStepIndex(prevStepIndex);

        try {
            resetHighlight();
            for (let i = 0; i <= prevStepIndex; i++) {
                const step = steps[i];
                switch (step.type) {
                    case 'queue':
                        highlightNode(step.node, COLORS.NODE_QUEUED);
                        break;
                    case 'dequeue':
                        highlightNode(step.node, COLORS.NODE_CURRENT);
                        break;
                    case 'explore':
                        highlightEdge(step.source, step.target, COLORS.EDGE_TRAVERSED);
                        break;
                    case 'visited':
                        resetEdgeHighlight(step.source, step.target);
                        break;
                    case 'visit':
                    case 'finish':
                        highlightNode(step.node, COLORS.NODE_VISITED);
                        break;
                }
            }
        } catch (err) {
            setError(`Error in step backward: ${err.message}`);
        } finally {
            setIsAnimating(false);
        }
    };

    const animateDFSSteps = async (steps) => {
        setIsAnimating(true);
        setIsSorting(true);
        for (let i = 0; i < steps.length; i++) {
            if (isCancelledRef.current) break;
            setCurrentStepIndex(i);
            await animateSingleStep(steps[i]);
        }
        setIsAnimating(false);
        setIsSorting(false);
    };

    const startTraversalDFS = async () => {
        if (!startNode) {
            setError('Please select a start node');
            return;
        }

        if (!adjacencyList[startNode]) {
            setError(`Start node "${startNode}" does not exist in the graph`);
            return;
        }

        if (isSorting || isAnimating) return;

        setIsSorting(true);
        setIsAnimating(true);
        isCancelledRef.current = false;
        resetHighlight();
        setCurrentStepIndex(-1);

        try {
            await fetchDFSSteps(adjacencyList, startNode);
            await animateDFSSteps(steps);
            setCurrentStepIndex(steps.length - 1);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to process DFS traversal');
        } finally {
            setIsSorting(false);
            setIsAnimating(false);
            isCancelledRef.current = false;
        }
    };

    const cancelTraversal = () => {
        isCancelledRef.current = true;
        setIsSorting(false);
        setIsAnimating(false);
        resetHighlight();
        setCurrentStepIndex(-1);
    };

    // Initial render
    useEffect(() => {
        speedRef.current = speed;
        const initializeVisualization = async () => {
            if (svgRef.current && !isInitializedRef.current) {
                isInitializedRef.current = true;
                await handleRandom();
                if (Object.keys(adjacencyList).length > 0 && startNode && adjacencyList[startNode]) {
                    try {
                        await fetchDFSSteps(adjacencyList, startNode);
                        console.log('Initial DFS steps fetched:', steps);
                    } catch (err) {
                        console.error('Initial fetchDFSSteps failed:', err);
                    }
                }
            }
        };
        const timer = setTimeout(initializeVisualization, 100);
        return () => clearTimeout(timer);
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
                                                    <div className="badge badge-primary badge-lg font-mono font-bold">O(V + E)</div>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                    <span className="font-semibold text-base-content/80">Space Complexity:</span>
                                                    <div className="badge badge-primary badge-outline badge-lg font-mono font-bold">O(V)</div>
                                                </div>
                                            </div>
                                            <div className="mt-4 p-4 bg-info/10 rounded-xl border-l-4 border-info">
                                                <p className="text-sm text-base-content/80 leading-relaxed">
                                                    DFS explores vertices and edges recursively, using a stack to track nodes, where V is the number of vertices and E is the number of edges.
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
                                                </div>
                                            ) : (
                                                <div className="h-full">
                                                    <div className="flex flex-col h-full items-center justify-center p-8 bg-neutral/5 rounded-xl border-2 border-dashed border-base-300">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="w-12 h-12 rounded-full bg-neutral/10 flex items-center justify-center mb-3">
                                                                <span className="text-2xl">⏱️</span>
                                                            </div>
                                                            <p className="flex-1 text-sm text-base-content/60 text-center">
                                                                Run a DFS traversal to see<br />detailed execution metrics
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

            <div className="flex justify-center flex-grow">
                <svg ref={svgRef} className="w-full h-full"></svg>
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
                                max="26"
                                className="input join-item rounded-l-lg w-full xl:w-24"
                                onChange={handleSizeInput}
                            />
                            <button
                                className="join-item btn btn-primary rounded-r-lg w-auto btn-md xl:w-24"
                                onClick={handleRandom}
                                disabled={isSorting || isSubmitting || isAnimating}
                            >
                                Random
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-row items-center gap-1 w-full xl:w-auto">
                        <div className="join w-full">
                            <span className="join-item p-2 bg-base-200 text-sm font-semibold">Start</span>
                            <input
                                type="text"
                                value={startNode}
                                placeholder="e.g., A"
                                className="input join-item rounded-l-lg w-full xl:w-12"
                                onChange={handleStartNodeInput}
                            />
                            <button
                                className="join-item btn btn-success rounded-r-lg w-auto btn-md xl:w-24"
                                onClick={startTraversalDFS}
                                disabled={!startNode || Object.keys(adjacencyList).length === 0 || isSubmitting || isAnimating || isSorting}
                            >
                                Start DFS
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
                            className={`btn btn-accent btn-sm lg:btn-md rounded-lg flex-1 lg:w-auto ${isAnimating || currentStepIndex >= steps.length - 1 || steps.length === 0 ? 'btn-disabled' : ''}`}
                            onClick={handleStepForward}
                            aria-label="Step forward"
                        >
                            Forward
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 md:gap-4 items-center justify-center w-full">
                        <div className="flex flex-row items-center gap-1 w-full">
                            <div className="join w-full">
                                <span className="join-item p-2 bg-base-200 text-sm font-semibold">Nodes</span>
                                <input
                                    type="text"
                                    value={nodeInput}
                                    placeholder="e.g., A,B,C"
                                    className="input join-item rounded-l-lg w-full"
                                    onChange={handleNodeInput}
                                />
                                <button
                                    className="btn btn-accent join-item rounded-r-lg"
                                    onClick={addNodes}
                                    disabled={isSorting || isSubmitting || isAnimating || !nodeInput.trim()}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-row items-center gap-1 w-full">
                            <div className="join w-full">
                                <span className="join-item p-2 bg-base-200 text-sm font-semibold">Edge</span>
                                <input
                                    type="text"
                                    value={edgeInput}
                                    placeholder="e.g., A-B"
                                    className="input join-item rounded-l-lg w-full"
                                    onChange={handleEdgeInput}
                                />
                                <button
                                    className="btn btn-accent join-item rounded-r-lg"
                                    onClick={addEdge}
                                    disabled={isSorting || isSubmitting || isAnimating || !edgeInput.trim()}
                                >
                                    Add
                                </button>
                            </div>
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

export default DFS;