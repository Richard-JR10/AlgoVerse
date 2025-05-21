import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import NavBar from '../../components/navBar.jsx';
import axios from "axios";

// Constants for visualization
const COLORS = {
    NODE_DEFAULT: '#EDE2F3',
    NODE_VISITED: 'orange',
    NODE_QUEUED: 'blue',
    NODE_CURRENT: 'green',
    EDGE_DEFAULT: '#999',
    EDGE_TRAVERSED: '#6E199F',
    PATH_COLOR: '#00FF00',
    FONT: '#6E199F',
    NODE_HIGHLIGHT: '#FFEB3B'
};

const DIMENSIONS = {
    WIDTH: 800,
    HEIGHT: 400,
    PADDING: 40,
    NODE_RADIUS: 20,
    OVERLAP_THRESHOLD: 50, // 2 * nodeRadius + 10
    MIN_DISTANCE: 60, // nodeRadius * 3
    MAX_DISTANCE: 300,
    OFFSET_DISTANCE: 8 // Original offset for bidirectional edges
};

const SIMULATION_PARAMS = {
    CHARGE_STRENGTH: -600,
    CENTER_STRENGTH: 0.2,
    COLLISION_RADIUS_MULTIPLIER: 2.5,
    POSITION_STRENGTH: 0.2,
    LINK_STRENGTH: 0.5,
    ALPHA: 0.3,
    MAX_ITERATIONS: 500,
    MIN_ITERATIONS: 200,
    SIMULATION_STOP_DELAY: 2000
};

const Dijkstra = () => {
    const [adjacencyList, setAdjacencyList] = useState({});
    const [startNode, setStartNode] = useState('');
    const [nodeInput, setNodeInput] = useState('');
    const [edgeInput, setEdgeInput] = useState('');
    const [isSorting, setIsSorting] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);
    const [size, setSize] = useState(6);
    const isInitializedRef = useRef(false);

    const baseURL = 'https://algoverse-backend-python.onrender.com';

    const graphMenu = [
        { label: 'BFS', path: '/visualizer/graph/bfs' },
        { label: 'DFS', path: '/visualizer/graph/dfs' },
        { label: 'Dijkstra', path: '/visualizer/graph/dijkstra' },
        { label: 'Kruskal', path: '/visualizer/graph/kruskal' },
    ];

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Input handlers
    const handleNodeInput = (e) => setNodeInput(e.target.value.toUpperCase());
    const handleEdgeInput = (e) => setEdgeInput(e.target.value.toUpperCase());
    const handleStartNodeInput = (e) => setStartNode(e.target.value.toUpperCase());
    const handleSizeInput = (e) => setSize(Math.max(1, Math.min(26, Number(e.target.value))));

    // Validate and add nodes
    const addNodes = (e) => {
        e.preventDefault();
        if (isSubmitting) return;
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
            drawGraph(newAdjacencyList, nodes);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Validate and add weighted edge
    const addEdge = (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const [edgePart, weightPart] = edgeInput.split(':');
            if (!edgePart || !weightPart) {
                setError("Edge must be in format 'nodeA-nodeB:weight' (e.g., 'A-B:4')");
                return;
            }

            const edgeParts = edgePart.split('-').map(part => part.trim());
            if (edgeParts.length !== 2) {
                setError("Edge must be in format 'nodeA-nodeB:weight'");
                return;
            }

            const weight = parseInt(weightPart, 10);
            if (isNaN(weight) || weight <= 0) {
                setError('Weight must be a positive number');
                return;
            }

            const [fromNode, toNode] = edgeParts;
            if (!/^[A-Z]+[0-9]*$/.test(fromNode) || !/^[A-Z]+[0-9]*$/.test(toNode)) {
                throw new Error('Nodes in edge must be letters (A-Z) optionally followed by numbers');
            }

            const newAdjacencyList = { ...adjacencyList };

            if (!newAdjacencyList[fromNode]) newAdjacencyList[fromNode] = [];
            if (!newAdjacencyList[toNode]) newAdjacencyList[toNode] = [];

            if (!newAdjacencyList[fromNode].find(edge => edge.toNode === toNode)) {
                newAdjacencyList[fromNode].push({ toNode, weight });
            }

            if (!startNode) setStartNode(fromNode);

            const newNodes = [fromNode, toNode].filter(node => !adjacencyList[node]);
            setAdjacencyList(newAdjacencyList);
            setEdgeInput('');
            drawGraph(newAdjacencyList, newNodes);
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

        for (let i = 0; i < nodes.length - 1; i++) {
            const fromNode = nodes[i];
            const toNode = nodes[i + 1];
            const weight = Math.floor(Math.random() * 10) + 1;
            newAdjacencyList[fromNode].push({ toNode, weight });
        }

        const edgeCount = Math.min(sizeInput * 2, sizeInput * (sizeInput - 1) / 2);
        let addedEdges = nodes.length - 1;

        while (addedEdges < edgeCount) {
            const fromIndex = Math.floor(Math.random() * nodes.length);
            const toIndex = Math.floor(Math.random() * nodes.length);

            if (fromIndex < toIndex) {
                const fromNode = nodes[fromIndex];
                const toNode = nodes[toIndex];

                if (!newAdjacencyList[fromNode].find(edge => edge.toNode === toNode)) {
                    const weight = Math.floor(Math.random() * 10) + 1;
                    newAdjacencyList[fromNode].push({ toNode, weight });
                    addedEdges++;
                }
            }
        }

        setStartNode(nodes[0]);
        return newAdjacencyList;
    };

    const handleRandom = (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const randomGraph = generateRandomGraph(size);
            setAdjacencyList(randomGraph);
            drawGraph(randomGraph, Object.keys(randomGraph));
            setError(null);
        } catch (err) {
            setError('Error generating random graph: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Initial render
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
    const drawGraph = (graph, newNodes = []) => {
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
            const node = { id, distance: Infinity };
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

        Object.entries(graph).forEach(([sourceId, edges]) => {
            edges.forEach(({ toNode, weight }) => {
                const sourceNode = nodeMap.get(sourceId);
                const targetNode = nodeMap.get(toNode);
                if (sourceNode && targetNode) {
                    const key = `${sourceId}-${toNode}`;
                    const reverseKey = `${toNode}-${sourceId}`;
                    const isBidirectional = graph[toNode]?.some(edge => edge.toNode === sourceId);

                    if (!linkMap.has(key)) {
                        links.push({
                            source: sourceNode,
                            target: targetNode,
                            direction: key,
                            isBidirectional,
                            weight,
                            offsetIndex: isBidirectional ? 0 : null,
                        });
                        linkMap.set(key, { weight, node: targetNode });
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
            .attr('refX', 12)
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

        svg.selectAll('.edge-label')
            .data(links)
            .enter()
            .append('text')
            .attr('class', 'edge-label')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '16px')
            .attr('font-weight', 'bold')
            .text(d => d.weight)
            .attr('x', d => {
                const sourceX = d.source.x;
                const targetX = d.target.x;
                const sourceY = d.source.y;
                const targetY = d.target.y;
                const dx = targetX - sourceX;
                const dy = targetY - sourceY;
                const length = Math.sqrt(dx * dx + dy * dy);
                const normalX = -dy / length;
                const offsetDistance = d.isBidirectional && d.offsetIndex !== null ? 20 * (d.offsetIndex === 0 ? -1 : 1) : 0;
                return (sourceX + targetX) / 2 + normalX * offsetDistance;
            })
            .attr('y', d => {
                const sourceX = d.source.x;
                const targetX = d.target.x;
                const sourceY = d.source.y;
                const targetY = d.target.y;
                const dx = targetX - sourceX;
                const dy = targetY - sourceY;
                const length = Math.sqrt(dx * dx + dy * dy);
                const normalY = dx / length;
                const offsetDistance = d.isBidirectional && d.offsetIndex !== null ? 20 * (d.offsetIndex === 0 ? -1 : 1) : 0;
                return (sourceY + targetY) / 2 + normalY * offsetDistance;
            });

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

        nodeGroup.append('text')
            .attr('class', 'distance-label')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'hanging')
            .attr('fill', 'white')
            .attr('font-size', '12px')
            .attr('dy', '20px')
            .text(d => (d.distance === Infinity ? '' : d.distance));

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
                svg.selectAll('.edge-label')
                    .attr('x', d => {
                        const sourceX = d.source.x;
                        const targetX = d.target.x;
                        const sourceY = d.source.y;
                        const targetY = d.target.y;
                        const dx = targetX - sourceX;
                        const dy = targetY - sourceY;
                        const length = Math.sqrt(dx * dx + dy * dy);
                        const normalX = -dy / length;
                        const offsetDistance = d.isBidirectional && d.offsetIndex !== null ? 20 * (d.offsetIndex === 0 ? -1 : 1) : 0;
                        return (sourceX + targetX) / 2 + normalX * offsetDistance;
                    })
                    .attr('y', d => {
                        const sourceX = d.source.x;
                        const targetX = d.target.x;
                        const sourceY = d.source.y;
                        const targetY = d.target.y;
                        const dx = targetX - sourceX;
                        const dy = targetY - sourceY;
                        const length = Math.sqrt(dx * dx + dy * dy);
                        const normalY = dx / length;
                        const offsetDistance = d.isBidirectional && d.offsetIndex !== null ? 20 * (d.offsetIndex === 0 ? -1 : 1) : 0;
                        return (sourceY + targetY) / 2 + normalY * offsetDistance;
                    });
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
            for (let i = 0; i < iterations; ++i) simulation.tick();
        }
    };

    const resetHighlight = () => {
        if (!svgRef.current) return;
        d3.select(svgRef.current).selectAll('.graph-node').attr('fill', COLORS.NODE_DEFAULT);
        d3.select(svgRef.current).selectAll('.graph-edge').attr('stroke', COLORS.EDGE_DEFAULT);
        d3.select(svgRef.current).selectAll('.distance-label').text(d => (d.distance === Infinity ? '' : d.distance));
    };

    const highlightNode = (nodeId, color, distance = null) => {
        if (!svgRef.current) return;

        const nodeGroup = d3.select(svgRef.current)
            .selectAll('.node-group')
            .filter(d => d.id === nodeId);

        nodeGroup.select('.graph-node').attr('fill', color);

        if (distance !== null) {
            nodeGroup.select('.distance-label').text(distance);
            nodeGroup.data().forEach(d => { d.distance = distance; });
        }
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

    const animateDijkstraSteps = async (steps) => {
        for (const step of steps) {
            if (isCancelledRef.current) break;

            if (step.type === 'queue') {
                highlightNode(step.node, COLORS.NODE_QUEUED);
            } else if (step.type === 'dequeue') {
                highlightNode(step.node, COLORS.NODE_CURRENT);
            } else if (step.type === 'explore') {
                highlightEdge(step.source, step.target, COLORS.EDGE_TRAVERSED);
            } else if (step.type === 'visited') {
                resetEdgeHighlight(step.source, step.target);
            } else if (step.type === 'visit') {
                highlightNode(step.node, COLORS.NODE_VISITED, step.distance);
            } else if (step.type === 'distance') {
                highlightNode(step.node, COLORS.NODE_VISITED, step.distance);
            } else if (step.type === 'finish') {
                highlightNode(step.node, COLORS.NODE_VISITED, step.distance);
            } else if (step.type === 'path') {
                highlightEdge(step.source, step.target, COLORS.PATH_COLOR);
            }

            await new Promise(resolve => setTimeout(resolve, speedRef.current));
        }
    };

    const startTraversalDijkstra = async () => {
        if (!startNode) {
            setError('Please select a start node');
            return;
        }

        if (!adjacencyList[startNode]) {
            setError(`Start node "${startNode}" does not exist in the graph`);
            return;
        }

        setIsSorting(true);
        isCancelledRef.current = false;
        resetHighlight();

        try {
            const response = await axios.post(`${baseURL}/graph/dijkstra`, {
                adjacency_list: adjacencyList,
                start_node: startNode
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && Array.isArray(response.data)) {
                await animateDijkstraSteps(response.data);
            } else {
                throw new Error('Received unexpected response format from server');
            }
        } catch (err) {
            console.error('Error during Dijkstra traversal:', err);
            setError(err.response?.data?.detail || err.message || 'Failed to process Dijkstra traversal');
        } finally {
            setIsSorting(false);
        }
    };

    const cancelTraversal = () => {
        isCancelledRef.current = true;
        setIsSorting(false);
    };

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    return (
        <div className="flex flex-col h-full bg-base-200 relative">
            <NavBar menuItems={graphMenu} />
            <div className="flex justify-center flex-grow">
                <svg ref={svgRef} className="w-full h-full"></svg>
            </div>
            <div className="flex flex-col items-center mb-4 p-4">
                <div className="flex justify-center items-center flex-row flex-wrap gap-2 mb-4">
                    <button
                        className="btn btn-primary"
                        onClick={handleRandom}
                        disabled={isSorting || isSubmitting}
                    >
                        Random Graph
                    </button>
                    {isSorting ? (
                        <button className="btn btn-error" onClick={cancelTraversal}>
                            Stop
                        </button>
                    ) : (
                        <button
                            className="btn btn-success"
                            onClick={startTraversalDijkstra}
                            disabled={!startNode || Object.keys(adjacencyList).length === 0 || isSubmitting}
                        >
                            Start Dijkstra
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                    <div className="join w-full">
                        <input
                            type="text"
                            value={nodeInput}
                            placeholder="Add nodes (e.g., A,B,C)"
                            className="input join-item w-3/4"
                            onChange={handleNodeInput}
                        />
                        <button
                            className="btn btn-accent join-item w-1/4"
                            onClick={addNodes}
                            disabled={isSorting || isSubmitting || !nodeInput.trim()}
                        >
                            Add Nodes
                        </button>
                    </div>
                    <div className="join w-full">
                        <input
                            type="text"
                            value={edgeInput}
                            placeholder="Add edge (e.g., A-B:4)"
                            className="input join-item w-3/4"
                            onChange={handleEdgeInput}
                        />
                        <button
                            className="btn btn-accent join-item w-1/4"
                            onClick={addEdge}
                            disabled={isSorting || isSubmitting || !edgeInput.trim()}
                        >
                            Add Edge
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mt-4">
                    <div className="join w-full">
                        <span className="join-item p-2 bg-base-200 h-fit">Start</span>
                        <input
                            type="text"
                            value={startNode}
                            placeholder="Start node (e.g., A)"
                            className="input join-item w-full"
                            onChange={handleStartNodeInput}
                        />
                    </div>
                    <div className="join w-full">
                        <span className="join-item p-2 bg-base-200 h-fit">Nodes</span>
                        <input
                            type="number"
                            value={size}
                            min="1"
                            max="26"
                            className="input join-item w-full"
                            onChange={handleSizeInput}
                        />
                    </div>
                    <div className="flex items-center w-full gap-2">
                        <span className="text-xs font-semibold">SPEED:</span>
                        <input
                            type="range"
                            min="50"
                            max="1000"
                            step="50"
                            value={speed}
                            className="range range-primary w-3/4"
                            onChange={(e) => setSpeed(Number(e.target.value))}
                        />
                        <span className="w-1/4 text-sm">{speed} ms</span>
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


export default Dijkstra;