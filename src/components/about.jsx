import NavBar from "./navBar.jsx";

const aboutMenu = [
    { label: 'Visualizer', path: '/visualizer' },
    { label: 'Comparator', path: '/comparator' },
    { label: 'Challenges', path: '/challenge' },
    { label: 'Code Library', path: '/library' },
    { label: 'Examples', path: '/example' },
    { label: 'About', path: '/about' }
];

const About = () => {
    return (
        <div className="scrollbar-hide overflow-auto h-screen bg-base-200">
            <NavBar menuItems={aboutMenu} />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header Section */}
                <section className="hero min-h-96 mb-16">
                    <div className="hero-content flex-col lg:flex-row-reverse gap-12">
                        <div className="flex-1 max-w-md">
                            <img
                                src="/hero-picture-team.jpg"
                                className="w-full rounded-2xl shadow-2xl"
                                alt="AlgoVerse team"
                            />
                        </div>
                        <div className="flex-1 text-center lg:text-left">
                            <h1 className="text-5xl font-bold mb-6 text-base-content">
                                Who We Are
                            </h1>
                            <p className="text-lg leading-relaxed text-base-content/80 max-w-2xl">
                                AlgoVerse is an interactive, AI-enhanced platform for learning algorithms through
                                visualization, comparison, and gamified challenges. It aims to engage both students
                                and educators with features like badges, leaderboards, and a code snippet library.
                                Real-life examples help learners connect concepts to practical applications, making
                                algorithm mastery intuitive and engaging.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Our Mission Section */}
                <section className="mb-20">
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body p-8 lg:p-12">
                            <div className="hero-content flex-col lg:flex-row gap-12">
                                <div className="flex-1 text-center lg:text-left">
                                    <div className="flex items-center justify-center lg:justify-start mb-6 gap-3">
                                        <div className="p-3 bg-primary/10 rounded-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" className="text-primary">
                                                <g fill="none">
                                                    <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                                                    <path fill="currentColor" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m0 2a8 8 0 1 0 0 16a8 8 0 0 0 0-16m0 12a1 1 0 1 1 0 2a1 1 0 0 1 0-2m0-9.5a3.625 3.625 0 0 1 1.348 6.99a.8.8 0 0 0-.305.201c-.044.05-.051.114-.05.18L13 14a1 1 0 0 1-1.993.117L11 14v-.25c0-1.153.93-1.845 1.604-2.116a1.626 1.626 0 1 0-2.229-1.509a1 1 0 1 1-2 0A3.625 3.625 0 0 1 12 6.5" />
                                                </g>
                                            </svg>
                                        </div>
                                        <h2 className="text-4xl font-bold text-base-content">Our Mission</h2>
                                    </div>
                                    <p className="text-lg leading-relaxed text-base-content/80 max-w-2xl">
                                        Our mission is to break down barriers to high-quality algorithmic education.
                                        We create free, open, and interactive resources that inspire curiosity, foster
                                        deep understanding, and help people solve real-world problems with code. We believe
                                        that by sharing knowledge and building an inclusive community, we can unlock
                                        creativity and potential everywhere.
                                    </p>
                                </div>
                                <div className="flex-1 max-w-md">
                                    <img
                                        src="/goal.png"
                                        className="w-full rounded-2xl shadow-lg"
                                        alt="Our mission"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Meet the Team Section */}
                <section className="mb-20">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="p-3 bg-secondary/10 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" className="text-secondary">
                                    <path fill="currentColor" d="M8 2.002a1.998 1.998 0 1 0 0 3.996a1.998 1.998 0 0 0 0-3.996M12.5 3a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3m-9 0a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3M5 7.993A1 1 0 0 1 6 7h4a1 1 0 0 1 1 1v3a3 3 0 0 1-.146.927A3.001 3.001 0 0 1 5 11zM4 8c0-.365.097-.706.268-1H2a1 1 0 0 0-1 1v2.5a2.5 2.5 0 0 0 3.436 2.319A4 4 0 0 1 4 10.999zm8 0v3c0 .655-.157 1.273-.436 1.819A2.5 2.5 0 0 0 15 10.5V8a1 1 0 0 0-1-1h-2.268c.17.294.268.635.268 1" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-4xl font-bold text-base-content mb-4">Meet the Team</h2>
                        <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                            Get to know the passionate individuals behind AlgoVerse who are dedicated to making
                            algorithm learning accessible and engaging for everyone.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                        {[
                            { name: "Richard De Ocampo Jr.", role: "Full Stack Developer",image: "/pfp/badar.jpg"},
                            { name: "Mac Elroy Badar", role: "Project Manager",image: "/pfp/badar.jpg"},
                            { name: "Ian Aquino", role: "UI Designer",image: "/pfp/aquino.jpg"}
                        ].map((member, index) => (
                            <div key={index} className="card bg-base-100 shadow-xl w-full max-w-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                                <div className="card-body items-center text-center p-8">
                                    <div className="avatar placeholder mb-6">
                                        <div className="rounded-full w-20 h-20">
                                            <img className="w-20 h-20 rounded-full" src={member.image} alt={member.name} />
                                        </div>
                                    </div>
                                    <h3 className="card-title text-xl mb-2 text-center leading-tight">
                                        {member.name}
                                    </h3>
                                    <p className="text-base-content/70 font-medium">
                                        {member.role}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* References Section */}
                <section className="mb-20">
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body p-8 lg:p-12">
                            <div className="text-center mb-12">
                                <div className="flex items-center justify-center gap-3 mb-4">
                                    <div className="p-3 bg-info/10 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-info">
                                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                                            <circle cx="10" cy="8" r="2"/>
                                            <path d="m20 13.5-2-2-4 4"/>
                                        </svg>
                                    </div>
                                </div>
                                <h2 className="text-4xl font-bold text-base-content mb-4">References & Inspiration</h2>
                                <p className="text-lg text-base-content/70 max-w-3xl mx-auto">
                                    AlgoVerse stands on the shoulders of giants. Here are the educational resources,
                                    research papers, and platforms that inspired our vision and guided our development.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Educational Platforms */}
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-base-content flex items-center gap-3">
                                        <div className="badge badge-primary badge-sm"></div>
                                        Educational Platforms
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="bg-base-200 rounded-lg p-4 hover:bg-base-300 transition-colors">
                                            <h4 className="font-semibold text-primary mb-1">VisuAlgo</h4>
                                            <p className="text-sm text-base-content/70 mb-2">
                                                Interactive algorithm visualization platform by Steven Halim
                                            </p>
                                            <a href="https://visualgo.net" target="_blank" rel="noopener noreferrer"
                                               className="text-xs text-primary hover:underline">
                                                visualgo.net
                                            </a>
                                        </div>
                                        <div className="bg-base-200 rounded-lg p-4 hover:bg-base-300 transition-colors">
                                            <h4 className="font-semibold text-primary mb-1">Algorithm Visualizer</h4>
                                            <p className="text-sm text-base-content/70 mb-2">
                                                Open-source interactive algorithm visualization tool
                                            </p>
                                            <a href="https://algorithm-visualizer.org" target="_blank" rel="noopener noreferrer"
                                               className="text-xs text-primary hover:underline">
                                                algorithm-visualizer.org
                                            </a>
                                        </div>
                                        <div className="bg-base-200 rounded-lg p-4 hover:bg-base-300 transition-colors">
                                            <h4 className="font-semibold text-primary mb-1">LeetCode</h4>
                                            <p className="text-sm text-base-content/70 mb-2">
                                                Competitive programming platform with extensive problem sets
                                            </p>
                                            <a href="https://leetcode.com" target="_blank" rel="noopener noreferrer"
                                               className="text-xs text-primary hover:underline">
                                                leetcode.com
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Academic References */}
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-base-content flex items-center gap-3">
                                        <div className="badge badge-secondary badge-sm"></div>
                                        Academic References
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="bg-base-200 rounded-lg p-4 hover:bg-base-300 transition-colors">
                                            <h4 className="font-semibold text-secondary mb-1">Introduction to Algorithms</h4>
                                            <p className="text-sm text-base-content/70 mb-2">
                                                Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein
                                            </p>
                                            <span className="text-xs text-base-content/60">MIT Press, 4th Edition</span>
                                        </div>
                                        <div className="bg-base-200 rounded-lg p-4 hover:bg-base-300 transition-colors">
                                            <h4 className="font-semibold text-secondary mb-1">Algorithms Illuminated</h4>
                                            <p className="text-sm text-base-content/70 mb-2">
                                                Tim Roughgarden - Stanford University
                                            </p>
                                            <span className="text-xs text-base-content/60">Comprehensive algorithm analysis</span>
                                        </div>
                                        <div className="bg-base-200 rounded-lg p-4 hover:bg-base-300 transition-colors">
                                            <h4 className="font-semibold text-secondary mb-1">Competitive Programming Handbook</h4>
                                            <p className="text-sm text-base-content/70 mb-2">
                                                Antti Laaksonen - University of Helsinki
                                            </p>
                                            <span className="text-xs text-base-content/60">Practical algorithmic problem solving</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Research & Tools */}
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-base-content flex items-center gap-3">
                                        <div className="badge badge-accent badge-sm"></div>
                                        Research & Tools
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="bg-base-200 rounded-lg p-4 hover:bg-base-300 transition-colors">
                                            <h4 className="font-semibold text-accent mb-1">Gamification in Education</h4>
                                            <p className="text-sm text-base-content/70 mb-2">
                                                Research on game-based learning effectiveness in computer science education
                                            </p>
                                            <span className="text-xs text-base-content/60">Educational Technology Research</span>
                                        </div>
                                        <div className="bg-base-200 rounded-lg p-4 hover:bg-base-300 transition-colors">
                                            <h4 className="font-semibold text-accent mb-1">Interactive Learning Systems</h4>
                                            <p className="text-sm text-base-content/70 mb-2">
                                                Studies on visualization-based learning in algorithm comprehension
                                            </p>
                                            <span className="text-xs text-base-content/60">Computer Science Education Research</span>
                                        </div>
                                        <div className="bg-base-200 rounded-lg p-4 hover:bg-base-300 transition-colors">
                                            <h4 className="font-semibold text-accent mb-1">Modern Web Technologies</h4>
                                            <p className="text-sm text-base-content/70 mb-2">
                                                React.js, D3.js, and modern JavaScript frameworks for educational applications
                                            </p>
                                            <span className="text-xs text-base-content/60">Web Development Stack</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Community & Open Source */}
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-base-content flex items-center gap-3">
                                        <div className="badge badge-warning badge-sm"></div>
                                        Community & Open Source
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="bg-base-200 rounded-lg p-4 hover:bg-base-300 transition-colors">
                                            <h4 className="font-semibold text-warning mb-1">GitHub Educational Resources</h4>
                                            <p className="text-sm text-base-content/70 mb-2">
                                                Open-source algorithm implementations and educational repositories
                                            </p>
                                            <span className="text-xs text-base-content/60">Community contributions</span>
                                        </div>
                                        <div className="bg-base-200 rounded-lg p-4 hover:bg-base-300 transition-colors">
                                            <h4 className="font-semibold text-warning mb-1">Stack Overflow Community</h4>
                                            <p className="text-sm text-base-content/70 mb-2">
                                                Developer community insights and algorithm discussions
                                            </p>
                                            <span className="text-xs text-base-content/60">Community knowledge base</span>
                                        </div>
                                        <div className="bg-base-200 rounded-lg p-4 hover:bg-base-300 transition-colors">
                                            <h4 className="font-semibold text-warning mb-1">Educational YouTube Channels</h4>
                                            <p className="text-sm text-base-content/70 mb-2">
                                                Algorithm explanation videos by educators and practitioners
                                            </p>
                                            <span className="text-xs text-base-content/60">Video learning resources</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="divider my-8"></div>

                            <div className="text-center">
                                <p className="text-base-content/60 text-sm max-w-3xl mx-auto">
                                    We acknowledge and thank all the educators, researchers, and developers who have contributed
                                    to the field of computer science education. Their work has made AlgoVerse possible and continues
                                    to inspire our mission to make algorithm learning accessible to everyone.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section className="mb-12">
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body p-8 lg:p-12 text-center">
                            <div className="flex items-center justify-center gap-3 mb-6">
                                <div className="p-3 bg-accent/10 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="26" viewBox="0 0 640 512" className="text-accent">
                                        <path fill="currentColor" d="M434.7 64h-85.9c-8 0-15.7 3-21.6 8.4l-98.3 90c-.1.1-.2.3-.3.4c-16.6 15.6-16.3 40.5-2.1 56c12.7 13.9 39.4 17.6 56.1 2.7c.1-.1.3-.1.4-.2l79.9-73.2c6.5-5.9 16.7-5.5 22.6 1c6 6.5 5.5 16.6-1 22.6l-26.1 23.9L504 313.8c2.9 2.4 5.5 5 7.9 7.7V128l-54.6-54.6c-5.9-6-14.1-9.4-22.6-9.4M544 128.2v223.9c0 17.7 14.3 32 32 32h64V128.2zm48 223.9c-8.8 0-16-7.2-16-16s7.2-16 16-16s16 7.2 16 16s-7.2 16-16 16M0 384h64c17.7 0 32-14.3 32-32V128.2H0zm48-63.9c8.8 0 16 7.2 16 16s-7.2 16-16 16s-16-7.2-16-16c0-8.9 7.2-16 16-16m435.9 18.6L334.6 217.5l-30 27.5c-29.7 27.1-75.2 24.5-101.7-4.4c-26.9-29.4-24.8-74.9 4.4-101.7L289.1 64h-83.8c-8.5 0-16.6 3.4-22.6 9.4L128 128v223.9h18.3l90.5 81.9c27.4 22.3 67.7 18.1 90-9.3l.2-.2l17.9 15.5c15.9 13 39.4 10.5 52.3-5.4l31.4-38.6l5.4 4.4c13.7 11.1 33.9 9.1 45-4.7l9.5-11.7c11.2-13.8 9.1-33.9-4.6-45.1" />
                                    </svg>
                                </div>
                            </div>
                            <h2 className="text-4xl font-bold text-base-content mb-6">Contact Us</h2>
                            <p className="text-lg text-base-content/80 mb-8 max-w-2xl mx-auto">
                                Have questions or suggestions? We'd love to hear from you! Reach out to us and
                                let's discuss how we can make algorithm learning even better together.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <div className="badge badge-outline badge-lg p-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                        <polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                    algoverse0805@gmail.com
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default About