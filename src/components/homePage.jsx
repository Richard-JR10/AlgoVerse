import {useContext} from 'react'
import NavBar from "./navBar.jsx";
import {ErrorContext} from "../context/errorContext.jsx";

const HomePage = () => {
    const homeMenu = [
        { label: 'Visualizer', path: '/visualizer' },
        { label: 'Comparator', path: '/comparator' },
        { label: 'Challenges', path: '/' },
        { label: 'Code Library', path: '/library' },
        { label: 'Examples', path: '/' }
    ];

    const { setError } = useContext(ErrorContext);

    return (
        <div className="scrollbar-hide overflow-auto h-screen bg-base-200">
            <NavBar menuItems={homeMenu}/>
            <div className="hero bg-base-200 text-accent" style={{ minHeight: "calc(100vh - var(--navbar-height))" }}>

                <div className="hero-content text-center">
                    <div className="max-w-md">
                        <h1 className="text-5xl font-bold">ALGOVERSE</h1>
                        <p className="py-6">
                            Interactive <span className="font-bold">COMMON</span> AlgorithmS Visualizer with Gamification and AI-Powered Comparisons
                        </p>
                        <div className="btn btn-primary" onClick={() => setError("test")}>
                            Test
                        </div>
                        <button className="btn btn-primary">Get Started</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default HomePage
