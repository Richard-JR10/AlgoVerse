import { useState, useEffect, useRef, useContext } from 'react';
import * as d3 from 'd3';
import NavBar from '../../components/navBar.jsx';
import { ErrorContext } from '../../context/errorContext.jsx';

const BFS = () => {
    const [adjacencyList, setAdjacencyList] = useState({});
    const [startNode, setStartNode] = useState('');
    const [nodeInput, setNodeInput] = useState('');
    const [edgeInput, setEdgeInput] = useState('');
    const [isSorting, setIsSorting] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { setError } = useContext(ErrorContext);
    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);
    const [size, setSize] = useState(6);
    const isInitializedRef = useRef(false);

    const graphMenu = [
        { label: 'BFS', path: '/visualizer/graph/bfs' },
        { label: 'DFS', path: '/visualizer/graph/dfs' },
        { label: 'Dijkstra', path: '/visualizer/graph/dijkstra' },
        { label: 'Kruskal', path: '/visualizer/graph/kruskal' },
    ];

    // Visualization colors
    const nodeDefaultColor = '#EDE2F3';
    const nodeVisitedColor = 'orange';
    const nodeQueuedColor = 'blue';
    const nodeCurrentColor = 'green';
    const edgeDefaultColor = '#999';
    const edgeTraversedColor = '#6E199F';
    const FONT_COLOR = '#6E199F';

    // Handle input changes
    const handleNodeInput = (e) => {
        setNodeInput(e.target.value.toUpperCase());
    };

    const handleEdgeInput = (e) => {
        setEdgeInput(e.target.value.toUpperCase());
    };

    const handleStartNodeInput = (e) => {
        setStartNode(e.target.value.toUpperCase());
    };

    const handleSizeInput = (e) => {
        setSize(Number(e.target.value));
    };

    // Add nodes to the graph
    const addNodes = (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        try {
            const nodes = nodeInput
                .split(',')
                .map((node) => node.trim())
                .filter(Boolean);

            if (nodes.length === 0) {
                setError('Please enter at least one node');
                return;
            }

            const newAdjacencyList = { ...adjacencyList };
            nodes.forEach((node) => {
                if (!newAdjacencyList[node]) {
                    newAdjacencyList[node] = [];
                }
            });

            if (!startNode && nodes.length > 0) {
                setStartNode(nodes[0]);
            }

            setAdjacencyList(newAdjacencyList);
            setNodeInput('');
            drawGraph(newAdjacencyList, nodes);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    // Add edges to the graph (directed)
    const addEdge = (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        try {
            const edgeParts = edgeInput.split('-').map((part) => part.trim());

            if (edgeParts.length !== 2) {
                setError("Edge must be in format 'nodeA-nodeB'");
                return;
            }

            const [fromNode, toNode] = edgeParts;

            if (!adjacencyList[fromNode] || !adjacencyList[toNode]) {
                const newAdjacencyList = { ...adjacencyList };

                if (!newAdjacencyList[fromNode]) {
                    newAdjacencyList[fromNode] = [];
                }

                if (!newAdjacencyList[toNode]) {
                    newAdjacencyList[toNode] = [];
                }

                if (!newAdjacencyList[fromNode].includes(toNode)) {
                    newAdjacencyList[fromNode].push(toNode);
                }

                if (!startNode) {
                    setStartNode(fromNode);
                }

                const newNodes = [fromNode, toNode].filter(
                    (node) => !adjacencyList[node]
                );
                setAdjacencyList(newAdjacencyList);
                setEdgeInput('');
                drawGraph(newAdjacencyList, newNodes);
                setError(null);
            } else {
                const newAdjacencyList = { ...adjacencyList };

                if (!newAdjacencyList[fromNode].includes(toNode)) {
                    newAdjacencyList[fromNode].push(toNode);
                }

                setAdjacencyList(newAdjacencyList);
                setEdgeInput('');
                drawGraph(newAdjacencyList);
                setError(null);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    // Generate a random graph
    const generateRandomGraph = (size) => {
        const sizeInput = Number(size);
        if (!Number.isInteger(sizeInput) || sizeInput <= 0) {
            setError('Size must be a positive integer');
            return {};
        }

        const nodes = Array.from({ length: sizeInput }, (_, i) =>
            String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : '')
        );

        const newAdjacencyList = {};
        nodes.forEach((node) => {
            newAdjacencyList[node] = [];
        });

        const edgeCount = Math.min(sizeInput * 2, sizeInput * (sizeInput - 1));
        let addedEdges = 0;

        for (let i = 1; i < nodes.length; i++) {
            const fromNode = nodes[Math.floor(Math.random() * i)];
            const toNode = nodes[i];
            if (!newAdjacencyList[fromNode].includes(toNode)) {
                newAdjacencyList[fromNode].push(toNode);
                addedEdges++;
            }
        }

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

    const handleRandom = (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        try {
            const randomGraph = generateRandomGraph(size);
            setAdjacencyList(randomGraph);
            drawGraph(randomGraph, Object.keys(randomGraph));
            setError(null);
        } catch (err) {
            setError('Error generating random graph: ' + err.message);
        }
    };

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

        const width = svgRef.current.clientWidth || 800;
        const height = 400;
        svg.attr('viewBox', `0 0 ${width} ${height}`);

        const nodeCount = Object.keys(graph).length;
        if (nodeCount === 0) return;

        const padding = 40;
        const minX = padding;
        const maxX = width - padding;
        const minY = padding;
        const maxY = height - padding;
        const nodeRadius = 20;
        const overlapThreshold = 2 * nodeRadius + 10; // Increased to 50 to add edge clearance

        const nodes = Object.keys(graph).map((id) => {
            const node = { id };
            if (newNodes.includes(id) && !existingPositions[id]) {
                let newX, newY;
                let positionValid = false;
                const maxAttempts = 100;
                let attempts = 0;

                do {
                    newX = minX + Math.random() * (maxX - minX);
                    newY = minY + Math.random() * (maxY - minY);

                    positionValid = Object.values(existingPositions).every((pos) => {
                        const dx = newX - pos.x;
                        const dy = newY - pos.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        return distance >= overlapThreshold;
                    });

                    attempts++;
                } while (!positionValid && attempts < maxAttempts);

                node.x = positionValid ? newX : minX + (maxX - minX) / 2;
                node.y = positionValid ? newY : minY + (maxY - minY) / 2;
                existingPositions[id] = { x: node.x, y: node.y };
            } else if (existingPositions[id]) {
                node.x = existingPositions[id].x;
                node.y = existingPositions[id].y;
                node.fx = node.x;
                node.fy = node.y;
            }
            return node;
        });

        const nodeMap = new Map(nodes.map((node) => [node.id, node]));

        // Create directed links with curve for bidirectional edges
        const links = [];
        const linkMap = new Map(); // Track edges to detect bidirectionality

        Object.entries(graph).forEach(([sourceId, targets]) => {
            targets.forEach((targetId) => {
                const sourceNode = nodeMap.get(sourceId);
                const targetNode = nodeMap.get(targetId);
                if (sourceNode && targetNode) {
                    const key = `${sourceId}-${targetId}`;
                    const reverseKey = `${targetId}-${sourceId}`;
                    const isBidirectional = linkMap.has(reverseKey);

                    linkMap.set(key, true);

                    links.push({
                        source: sourceNode,
                        target: targetNode,
                        direction: `${sourceId}-${targetId}`,
                        isBidirectional,
                        curveDirection: isBidirectional ? (linkMap.get(reverseKey) ? -1 : 1) : 0,
                    });
                }
            });
        });

        const minDistance = nodeRadius * 3;
        const nodeDensity = nodeCount / (width * height);
        const optimalDistance = Math.max(minDistance, Math.min(300, 150 / Math.sqrt(nodeDensity))); // Increased max distance

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id((d) => d.id).distance(optimalDistance))
            .force('charge', d3.forceManyBody().strength(-400)) // Increased repulsion
            .force('center', d3.forceCenter(width / 2, height / 2).strength(0.1)) // Reduced centering strength
            .force('collision', d3.forceCollide().radius(nodeRadius * 2)) // Increased collision radius
            .force('x', d3.forceX().x((d) => Math.max(minX, Math.min(maxX, d.x))).strength(0.1))
            .force('y', d3.forceY().y((d) => Math.max(minY, Math.min(maxY, d.y))).strength(0.1));

        // Define arrowhead marker
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
            .attr('fill', edgeDefaultColor)
            .attr('stroke', 'none');

        const computeEdgePath = (d) => {
            const sourceX = d.source.x !== undefined ? d.source.x : minX;
            const sourceY = d.source.y !== undefined ? d.source.y : minY;
            const targetX = d.target.x !== undefined ? d.target.x : minX;
            const targetY = d.target.y !== undefined ? d.target.y : minY;

            const dx = targetX - sourceX;
            const dy = targetY - sourceY;
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length === 0) {
                return `M${sourceX},${sourceY} L${targetX},${targetY}`;
            }

            const offset = nodeRadius + 5; // Increased offset to 5 for more clearance
            const scale = (length - offset) / length;
            const adjustedDx = dx * scale;
            const adjustedDy = dy * scale;

            const x1 = sourceX;
            const y1 = sourceY;
            const x2 = sourceX + adjustedDx;
            const y2 = sourceY + adjustedDy;

            if (!d.isBidirectional) {
                // Straight line for unidirectional edges
                return `M${x1},${y1} L${x2},${y2}`;
            } else {
                // Quadratic Bézier curve for bidirectional edges
                const normalX = -dy / length;
                const normalY = dx / length;
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                const curveDistance = 30 * d.curveDirection; // Maintain current curve distance

                const controlX = midX + normalX * curveDistance;
                const controlY = midY + normalY * curveDistance;

                return `M${x1},${y1} Q${controlX},${controlY} ${x2},${y2}`;
            }
        };

        const link = svg
            .append('g')
            .selectAll('path')
            .data(links)
            .enter()
            .append('path')
            .attr('d', (d) => computeEdgePath(d))
            .attr('stroke', edgeDefaultColor)
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('marker-end', 'url(#arrowhead)')
            .attr('class', 'graph-edge')
            .attr('data-source', (d) => d.source.id)
            .attr('data-target', (d) => d.target.id);

        const nodeGroup = svg
            .append('g')
            .selectAll('g')
            .data(nodes)
            .enter()
            .append('g')
            .attr('transform', (d) => `translate(${d.x || minX},${d.y || minY})`)
            .attr('class', 'node-group')
            .attr('data-id', (d) => d.id);

        nodeGroup
            .append('circle')
            .attr('r', 20)
            .attr('fill', (d) => (newNodes.includes(d.id) ? '#FFEB3B' : nodeDefaultColor))
            .attr('stroke', FONT_COLOR)
            .attr('stroke-width', 2)
            .attr('class', 'graph-node');

        nodeGroup
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', FONT_COLOR)
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .text((d) => d.id);

        if (newNodes.length > 0) {
            svg.selectAll('.node-group')
                .filter((d) => newNodes.includes(d.id))
                .select('circle')
                .attr('r', 10)
                .transition()
                .duration(300)
                .attr('r', 20)
                .transition()
                .duration(300)
                .attr('fill', nodeDefaultColor);
        }

        if (startNode && nodes.some((node) => node.id === startNode)) {
            highlightNode(startNode, nodeQueuedColor);
        }

        if (newNodes.length > 0) {
            simulation.on('tick', () => {
                nodeGroup.attr('transform', (d) => {
                    d.x = Math.max(minX, Math.min(maxX, d.x));
                    d.y = Math.max(minY, Math.min(maxY, d.y));
                    return `translate(${d.x},${d.y})`;
                });

                link.attr('d', (d) => computeEdgePath(d));
            });

            setTimeout(() => {
                nodes.forEach((node) => {
                    if (newNodes.includes(node.id)) {
                        delete node.fx;
                        delete node.fy;
                    }
                });
                simulation.alpha(0.3).restart();
                setTimeout(() => simulation.stop(), 2000);
            }, 100);
        } else {
            simulation.stop();
            const iterations = Math.min(500, Math.max(200, nodeCount * 10)); // Increased iterations
            for (let i = 0; i < iterations; ++i) simulation.tick();
        }
    };
    // Reset node and edge colors
    const resetHighlight = () => {
        if (!svgRef.current) return;

        d3.select(svgRef.current)
            .selectAll('.graph-node')
            .attr('fill', nodeDefaultColor);

        d3.select(svgRef.current)
            .selectAll('.graph-edge')
            .attr('stroke', edgeDefaultColor);
    };

    // Highlight a node with the specified color
    const highlightNode = (nodeId, color) => {
        if (!svgRef.current) return;

        d3.select(svgRef.current)
            .selectAll('.node-group')
            .filter((d) => d.id === nodeId)
            .select('.graph-node')
            .attr('fill', color);
    };

    // Highlight an edge with the specified color
    const highlightEdge = (sourceId, targetId, color) => {
        if (!svgRef.current) return;

        d3.select(svgRef.current)
            .selectAll('.graph-edge')
            .filter((d) => {
                const source = typeof d.source === 'object' ? d.source.id : d.source;
                const target = typeof d.target === 'object' ? d.target.id : d.target;
                return source === sourceId && target === targetId; // Match exact direction
            })
            .attr('stroke', color);
    };

    const resetEdgeHighlight = (sourceId, targetId) => {
        if (!svgRef.current) return;

        d3.select(svgRef.current)
            .selectAll('.graph-edge')
            .filter((d) => {
                const source = typeof d.source === 'object' ? d.source.id : d.source;
                const target = typeof d.target === 'object' ? d.target.id : d.target;
                return source === sourceId && target === targetId; // Match exact direction
            })
            .attr('stroke', edgeDefaultColor);
    };

    // Animate BFS traversal
    const animateBFSSteps = async (steps) => {
        for (const step of steps) {
            if (isCancelledRef.current) break;

            if (step.type === 'queue') {
                highlightNode(step.node, nodeQueuedColor);
            } else if (step.type === 'dequeue') {
                highlightNode(step.node, nodeCurrentColor);
            } else if (step.type === 'explore') {
                highlightEdge(step.source, step.target, edgeTraversedColor);
            } else if (step.type === 'visited') {
                resetEdgeHighlight(step.source, step.target);
            } else if (step.type === 'visit') {
                highlightNode(step.node, nodeVisitedColor);
            } else if (step.type === 'finish') {
                highlightNode(step.node, nodeVisitedColor);
            }

            await new Promise((resolve) => setTimeout(resolve, speedRef.current));
        }
    };

    // Start BFS traversal
    const startTraversal = async () => {
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
            const bfsSteps = simulateBFS(adjacencyList, startNode);
            await animateBFSSteps(bfsSteps);
        } catch (err) {
            setError(err.message || 'Failed to process BFS traversal');
        }

        setIsSorting(false);
    };

    // Simulate BFS traversal and generate steps
    const simulateBFS = (graph, start) => {
        const steps = [];
        const visited = new Set();
        const queue = [start];
        visited.add(start);

        steps.push({ type: 'queue', node: start });

        while (queue.length > 0) {
            const current = queue.shift();
            steps.push({ type: 'dequeue', node: current });

            const neighbors = graph[current] || [];

            for (const neighbor of neighbors) {
                // Highlight the edge being explored
                steps.push({ type: 'explore', source: current, target: neighbor });

                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                    steps.push({ type: 'visit', node: neighbor, from: current });
                    steps.push({ type: 'queue', node: neighbor });
                } else {
                    // If the neighbor is already visited, add a step to remove the highlight
                    steps.push({ type: 'visited', source: current, target: neighbor });
                }
            }

            steps.push({ type: 'finish', node: current });
        }

        return steps;
    };

    // Cancel ongoing traversal
    const cancelTraversal = () => {
        isCancelledRef.current = true;
        setIsSorting(false);
    };

    // Update speed ref when speed changes
    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    const helpText = (
        <div className="text-sm text-center max-w-3xl mx-auto mb-4 text-gray-600">
            <p>
                <strong>Tips:</strong> Newly added nodes appear in yellow. Edges are directed (A-B means A points to B).
            </p>
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            <NavBar menuItems={graphMenu} />
            <div className="flex justify-center flex-grow">
                <svg ref={svgRef} className="w-full h-full"></svg>
            </div>
            <div className="flex flex-col items-center mb-4 p-4">
                {helpText}
                <div className="flex justify-center items-center flex-row flex-wrap gap-2 mb-4">
                    <button
                        className="btn btn-primary"
                        onClick={handleRandom}
                        disabled={isSorting}
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
                            onClick={startTraversal}
                            disabled={!startNode || Object.keys(adjacencyList).length === 0}
                        >
                            Start BFS
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
                            disabled={isSorting}
                        />
                        <button
                            className="btn join-item w-1/4"
                            onClick={addNodes}
                            disabled={isSorting || !nodeInput.trim()}
                        >
                            Add Nodes
                        </button>
                    </div>

                    <div className="join w-full">
                        <input
                            type="text"
                            value={edgeInput}
                            placeholder="Add edge (e.g., A-B)"
                            className="input join-item w-3/4"
                            onChange={handleEdgeInput}
                            disabled={isSorting}
                        />
                        <button
                            className="btn join-item w-1/4"
                            onClick={addEdge}
                            disabled={isSorting || !edgeInput.trim()}
                        >
                            Add Edge
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mt-4">
                    <div className="join w-full">
                        <span className="join-item p-3 bg-base-200">Start Node</span>
                        <input
                            type="text"
                            value={startNode}
                            placeholder="Start node (e.g., A)"
                            className="input join-item w-full"
                            onChange={handleStartNodeInput}
                            disabled={isSorting}
                        />
                    </div>

                    <div className="join w-full">
                        <span className="join-item p-3 bg-base-200">Nodes</span>
                        <input
                            type="number"
                            value={size}
                            min="1"
                            max="26"
                            className="input join-item w-full"
                            onChange={handleSizeInput}
                            disabled={isSorting}
                        />
                    </div>

                    <div className="flex items-center w-full gap-2">
                        <input
                            type="range"
                            min="50"
                            max="1000"
                            step="50"
                            value={speed}
                            className="range range-primary w-3/4"
                            onChange={(e) => setSpeed(Number(e.target.value))}
                            disabled={isSorting}
                        />
                        <span className="w-1/4 text-sm">{speed} ms</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BFS;