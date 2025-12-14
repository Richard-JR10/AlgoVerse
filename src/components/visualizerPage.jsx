import VisualizerCard from "./visualizerCard.jsx";
import NavBar from "./navBar.jsx";

const VisualizerPage = () => {
    const visualizerMenu = [
        { label: 'Visualizer', path: '/visualizer' },
        { label: 'Comparator', path: '/comparator' },
        { label: 'Challenges', path: '/challenge' },
        { label: 'Code Library', path: '/library' },
        { label: 'Examples', path: '/example' },
        { label: 'About', path: '/about' }
    ];


    const cards = [
        { imgUrl: "https://miro.medium.com/v2/resize:fit:640/format:webp/0*scHWqR8nUcqWCWGK", title: "Sorting Algorithm", desc: "", url: "/visualizer/sort/bubble" },
        { imgUrl: "https://i.imgur.com/xiuJxtt.png", title: "Searching Algorithm", desc: "", url: "/visualizer/search/linear" },
        { imgUrl: "https://miro.medium.com/v2/resize:fit:640/format:webp/1*Iu161N6Z5phs2Cp5TwWBLw.gif", title: "Graph Traversal", desc: "", url: "/visualizer/graph/bfs"  },
        { imgUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Iterative_algorithm_solving_a_6_disks_Tower_of_Hanoi.gif", title: "Recursion Algorithm", desc: "", url: "/visualizer/recursion/factorial" }
    ];

    return (
        <div className="scrollbar-hide overflow-auto h-screen bg-base-200">
            <NavBar menuItems={visualizerMenu}/>
            <div className="flex justify-center items-center mt-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-fit mb-4">
                        {cards.map((card, index) => (
                            <VisualizerCard key={index} imgUrl={card.imgUrl} title={card.title} desc={card.desc} btnUrl={card.url} />
                        ))}
                    </div>
            </div>
        </div>
    )
}
export default VisualizerPage

