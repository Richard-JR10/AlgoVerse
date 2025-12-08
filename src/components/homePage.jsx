import NavBar from "./navBar.jsx";
import ParticleBackground from "./utils/ParticleBackground.jsx";
import {useNavigate} from "react-router-dom";

const HomePage = () => {
    const homeMenu = [
        { label: 'Visualizer', path: '/visualizer' },
        { label: 'Comparator', path: '/comparator' },
        { label: 'Challenges', path: '/challenge' },
        { label: 'Code Library', path: '/library' },
        { label: 'Examples', path: '/example' },
        { label: 'About', path: '/about' }
    ];

    const navigate = useNavigate();

    return (
        <div className="scrollbar-hide overflow-auto h-screen bg-base-200 relative">
            <ParticleBackground />
            <NavBar menuItems={homeMenu}/>
            <div className="hero bg-transparent text-accent" style={{ minHeight: "calc(100vh - var(--navbar-height))" }}>
                <div className="hero-content text-center">
                    <div className="max-w-md">
                        <h1 className="text-5xl font-bold light:text-black/80">ALGOVERSE</h1>
                        <p className="py-6 light:text-black/80">
                            Interactive <span className="font-bold">COMMON</span> Algorithm Visualizer with Gamification and AI-Powered Comparisons
                        </p>
                        <button className="btn btn-primary" onClick={() => navigate('/login')}>Get Started</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HomePage