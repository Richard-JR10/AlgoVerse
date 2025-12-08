import {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";

const algorithmGroups = {
    sort: [
        { id: "bubble", label: "Bubble Sort", path: '/visualizer/sort/bubble' },
        { id: "merge", label: "Merge Sort", path: '/visualizer/sort/merge' },
        { id: "selection", label: "Selection Sort", path: '/visualizer/sort/select' },
        { id: "insert", label: "Insertion Sort", path: '/visualizer/sort/insert' },
        { id: "quick", label: "Quick Sort", path: '/visualizer/sort/quick' }
    ],
    graph: [
        { id: "bfs", label: "BFS", path: "/visualizer/graph/bfs" },
        { id: "dfs", label: "DFS", path: "/visualizer/graph/dfs" },
        { id: "dijkstra", label: 'Dijkstra', path: '/visualizer/graph/dijkstra' },
        { id: "kruskal", label: 'Kruskal', path: '/visualizer/graph/kruskal' },
    ],
    search: [
        { id: "linear", label: "Linear Search", path: "/visualizer/search/linear" },
        { id: "binary", label: "Binary Search", path: "/visualizer/search/binary" }
    ],
    recursion: [
        { id: "factorial", label: 'Factorial', path: '/visualizer/recursion/factorial' },
        { id: "hanoi", label: 'Tower of Hanoi', path: '/visualizer/recursion/hanoi' },
    ],
};


const AlgorithmNavbar = () => {
    const [selectedAlgo, setSelectedAlgo] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const category = location.pathname.split("/")[2];
    const algorithms = algorithmGroups[category] || [];

    const handleChange = (algo) => {
        setSelectedAlgo(algo.id);
        navigate(algo.path); // navigate to the route
    };

    useEffect(() => {
        const match = algorithms.find((algo) => location.pathname === algo.path);
        if (match) {
            setSelectedAlgo(match.id);
        }
    }, [location.pathname]);

    const handleChangeById = (id) => {
        const selected = algorithms.find((a) => a.id === id);
        setSelectedAlgo(id);
        if (selected) {
            navigate(selected.path); // only if you're using React Router
        }
    };
    return (
        <div>
            <div className="hidden md:flex justify-center overflow-x-auto w-full">
                <div className="join my-2 flex-nowrap whitespace-nowrap">
                    {algorithms.map((algo) => (
                        <button
                            key={algo.id}
                            className={`btn join-item ${selectedAlgo === algo.id ? "btn-active bg-primary light:text-base-200" : ""}`}
                            onClick={() => handleChange(algo)}
                        >
                            {algo.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="block md:hidden my-2 px-4">
                <select
                    className="select select-bordered w-full light:text-black/90"
                    value={selectedAlgo}
                    onChange={(e) => handleChangeById(e.target.value)}
                >
                    {algorithms.map((algo) => (
                        <option key={algo.id} value={algo.id}>
                            {algo.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
}
export default AlgorithmNavbar
