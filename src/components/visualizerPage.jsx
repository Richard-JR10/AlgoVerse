import React from 'react'
import VisualizerCard from "./visualizerCard.jsx";
import NavBar from "./navBar.jsx";

const VisualizerPage = () => {
    const visualizerMenu = [
        { label: 'Visualizer', path: '/visualizer' },
        { label: 'Comparator', path: '/comparator' },
        { label: 'Challenges', path: '/' },
        { label: 'Code Library', path: '/library' },
        { label: 'Examples', path: '/' }
    ];

    const cards = [
        { imgUrl: "https://miro.medium.com/v2/resize:fit:640/format:webp/0*scHWqR8nUcqWCWGK", title: "Sorting Algorithm", desc: "Sorts", url: "/visualizer/bubblesort" },
        { imgUrl: "https://i.gifer.com/7Fmb.gif", title: "Searching Algorithm", desc: "Sorts" },
        { imgUrl: "https://data-structure-visualization.netlify.app/dijkstra.gif", title: "Graph Traversal", desc: "Sorts" },
        { imgUrl: "https://miro.medium.com/v2/resize:fit:640/format:webp/0*scHWqR8nUcqWCWGK", title: "Recursion Algorithm", desc: "Sorts" }
    ];

    return (
        <div className="scrollbar-hide overflow-auto h-screen bg-base-200">
            <NavBar menuItems={visualizerMenu}/>
            <div className="flex justify-center items-center min-h-screen">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-fit max-w-5xl">
                        {cards.map((card, index) => (
                            <VisualizerCard key={index} imgUrl={card.imgUrl} title={card.title} desc={card.desc} btnUrl={card.url} />
                        ))}
                    </div>
            </div>
        </div>
    )
}
export default VisualizerPage

