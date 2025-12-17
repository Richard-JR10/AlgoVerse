import { useState, useEffect, useRef } from 'react';
import NavBar from '../../components/navBar.jsx';
import axios from 'axios';
import AlgorithmNavbar from "../algorithmNavbar.jsx";
import SoundToggle from "../../components/utils/soundToggle.jsx";
import {useSound} from "../../context/soundContext.jsx";
import * as Tone from "tone";

const FactorialVisualization = () => {
    const [inputValue, setInputValue] = useState('10');
    const [number, setNumber] = useState(10);
    const [steps, setSteps] = useState([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cards, setCards] = useState([]);

    // Add step navigation state
    const [currentStep, setCurrentStep] = useState(-1);
    const [isStepMode, setIsStepMode] = useState(false);

    // State for complexity display
    const [showComplexity, setShowComplexity] = useState(false);
    const [executionTime, setExecutionTime] = useState(null);
    const [pseudocodeHighlight, setPseudocodeHighlight] = useState(null);

    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);
    const synthRef = useRef(null);
    const { soundEnabled } = useSound();
    const soundRef = useRef(soundEnabled);

    const [error, setError] = useState(null);

    useEffect(() => {
        soundRef.current = soundEnabled;
    }, [soundEnabled]);

    useEffect(() => {
        synthRef.current = new Tone.Synth().toDestination();
        return () => {
            if (synthRef.current) synthRef.current.dispose();
        };
    }, []);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleInput = (e) => {
        e.preventDefault();
        setInputValue(e.target.value);
    };

    const addHighlights = (rawSteps) => {
        return rawSteps.map(step => {
            if (step.type === 'base') {
                return {...step, highlightSub: 2, highlightReturn: 3};
            } else {
                return {...step, highlightSub: 4, highlightReturn: 5};
            }
        });
    };

    const initializeVisualization = async (num) => {
        try {
            setIsSubmitting(true);
            if (isCalculating) {
                isCancelledRef.current = true;
                setIsCalculating(false);
            }
            await Tone.start();
            // Reset step navigation
            setCurrentStep(-1);
            setIsStepMode(false);
            setPseudocodeHighlight(null);

            const startTime = performance.now();
            // Fetch steps from the API
            const response = await axios.post(
                'https://algoverse-backend-python.onrender.com/recursion/factorial',
                { n: num },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Record end time and calculate execution time
            const endTime = performance.now();
            setExecutionTime((endTime - startTime) / 1000);

            const calculationSteps = response.data.steps;
            const highlightedSteps = addHighlights(calculationSteps);
            setSteps(highlightedSteps);

            // Initialize cards with unique n values
            const uniqueNValues = [...new Set(highlightedSteps.map((step) => step.n))];
            const initialCards = uniqueNValues.map((n) => ({
                n,
                visible: false,
                subValue: null,
                returnValue: null,
                showingSubValue: false,
                showingReturnValue: false,
            }));
            setCards(initialCards);

            setIsSubmitting(false);
            isCancelledRef.current = false;
        } catch (err) {
            console.error(err);
            setError('Failed to fetch factorial steps from the API. Please try again.');
            setIsSubmitting(false);
            isCancelledRef.current = false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const input = parseInt(inputValue.trim(), 10);
        if (isNaN(input) || input < 0 || input > 12) {
            setError('Please enter a valid number between 0 and 12');
            return;
        }

        setNumber(input);
        await initializeVisualization(input);
    };

    const handleRandom = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        const randomNum = Math.floor(Math.random() * 10) + 1;
        setInputValue(randomNum.toString());
        setNumber(randomNum);
        await initializeVisualization(randomNum);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (svgRef.current) {
                handleRandom();
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    // Step forward function
    const stepForward = () => {
        if (!isStepMode) {
            setIsStepMode(true);
            setCurrentStep(0);
        } else if (currentStep < getTotalSteps() - 1) {
            setCurrentStep(currentStep + 1);
        }
        updateCardsForStep(currentStep + 1);
    };

    // Step backward function
    const stepBackward = () => {
        if (isStepMode && currentStep > 0) {
            setCurrentStep(currentStep - 1);
            updateCardsForStep(currentStep - 1);
        } else if (currentStep === 0) {
            setCurrentStep(-1);
            setIsStepMode(false);
            // Reset all cards to initial state
            const resetCards = cards.map(card => ({
                ...card,
                visible: false,
                subValue: null,
                returnValue: null,
                showingSubValue: false,
                showingReturnValue: false,
            }));
            setCards(resetCards);
            setPseudocodeHighlight(null);
        }
    };

    // Get total number of steps
    const getTotalSteps = () => {
        if (steps.length === 0) return 0;
        const uniqueNValues = [...new Set(steps.map((step) => step.n))];
        return uniqueNValues.length * 3; // Show card, show subValue, show returnValue
    };

    // Update cards based on current step
    const updateCardsForStep = (stepIndex) => {
        if (stepIndex < 0 || steps.length === 0) return;

        const uniqueNValues = [...new Set(steps.map((step) => step.n))].sort((a, b) => b - a);
        const totalCards = uniqueNValues.length;

        let updatedCards = [...cards];

        // Reset all cards first
        updatedCards = updatedCards.map(card => ({
            ...card,
            visible: false,
            subValue: null,
            returnValue: null,
            showingSubValue: false,
            showingReturnValue: false,
        }));

        // Phase 1: Show cards sequentially (steps 0 to totalCards-1)
        if (stepIndex < totalCards) {
            setPseudocodeHighlight(1);
            for (let i = 0; i <= stepIndex; i++) {
                const cardIndex = updatedCards.findIndex(card => card.n === uniqueNValues[i]);
                if (cardIndex !== -1) {
                    updatedCards[cardIndex] = { ...updatedCards[cardIndex], visible: true };
                }
            }
        } else {
            // Show all cards
            updatedCards = updatedCards.map(card => ({ ...card, visible: true }));

            // Phase 2: Show values from bottom up
            const phase2Step = stepIndex - totalCards;
            const reversedNValues = [...uniqueNValues].reverse();

            for (let i = 0; i <= Math.floor(phase2Step / 2); i++) {
                const n = reversedNValues[i];
                const cardIndex = updatedCards.findIndex(card => card.n === n);
                if (cardIndex !== -1) {
                    const step = steps.find(s => s.n === n && (s.type === 'base' || s.type === 'return'));
                    if (step) {
                        // Show subValue
                        updatedCards[cardIndex] = {
                            ...updatedCards[cardIndex],
                            subValue: step.type === 'base' ? 1 : step.subValue,
                            showingSubValue: true,
                        };
                        if (soundRef.current) synthRef.current.triggerAttackRelease('E4', '16n');
                        setPseudocodeHighlight(step.highlightSub);

                        // Show returnValue if we're at the second sub-step
                        if (phase2Step % 2 === 1 || phase2Step > i * 2 + 1) {
                            updatedCards[cardIndex] = {
                                ...updatedCards[cardIndex],
                                returnValue: step.type === 'base' ? 1 : step.returnValue,
                                showingReturnValue: true,
                            };
                            if (soundRef.current) synthRef.current.triggerAttackRelease('C5', '32n');
                            setPseudocodeHighlight(step.highlightReturn);
                        }
                    }
                }
            }
        }

        setCards(updatedCards);
    };

    const animateCalculationSteps = async () => {
        setIsCalculating(true);
        setIsStepMode(false);
        setCurrentStep(-1);
        isCancelledRef.current = false;
        setPseudocodeHighlight(null);

        // Clear all cards and reset to initial state
        let updatedCards = cards.map(card => ({
            ...card,
            visible: false,
            subValue: null,
            returnValue: null,
            showingSubValue: false,
            showingReturnValue: false,
        }));
        setCards(updatedCards);

        // Small delay to show the cleared state
        await new Promise((resolve) => setTimeout(resolve, 200));

        // First phase: Show all cards sequentially
        for (let i = 0; i < updatedCards.length; i++) {
            if (isCancelledRef.current) break;
            setPseudocodeHighlight(1);
            updatedCards[i] = { ...updatedCards[i], visible: true };
            setCards([...updatedCards]);
            await new Promise((resolve) => setTimeout(resolve, speedRef.current));
        }

        // Second phase: Calculate values from bottom up
        for (let i = updatedCards.length - 1; i >= 0; i--) {
            if (isCancelledRef.current) break;
            const step = steps.find(
                (s) => s.n === updatedCards[i].n && (s.type === 'base' || s.type === 'return')
            );

            if (step) {
                // Show subValue
                updatedCards[i] = {
                    ...updatedCards[i],
                    subValue: step.type === 'base' ? 1 : step.subValue,
                    showingSubValue: true,
                };
                setCards([...updatedCards]);
                setPseudocodeHighlight(step.highlightSub);
                await new Promise((resolve) => setTimeout(resolve, speedRef.current));

                // Show returnValue
                updatedCards[i] = {
                    ...updatedCards[i],
                    returnValue: step.type === 'base' ? 1 : step.returnValue,
                    showingReturnValue: true,
                };
                setCards([...updatedCards]);
                setPseudocodeHighlight(step.highlightReturn);
                await new Promise((resolve) => setTimeout(resolve, speedRef.current));
            }
        }

        // Set step mode to the final step after animation completes
        if (!isCancelledRef.current) {
            setIsStepMode(true);
            setCurrentStep(getTotalSteps() - 1);
        }

        setIsCalculating(false);
    };

    const getFactorialResult = () => {
        const returnStep = steps.find((step) => step.type === 'return' && step.n === number);
        return returnStep ? returnStep.returnValue : null;
    };

    return (
        <div className="flex flex-col scrollbar-hide overflow-auto h-screen bg-base-200 relative">
            <NavBar/>
            <AlgorithmNavbar/>

            {/* Complexity Information Panel */}
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="collapse collapse-arrow bg-base-100 shadow-md border border-base-300 rounded-2xl overflow-hidden">
                        <input
                            type="checkbox"
                            checked={showComplexity}
                            onChange={(e) => setShowComplexity(e.target.checked)}
                        />
                        <div className="collapse-title text-xl font-bold flex items-center justify-between bg-base-100 border-b border-base-300">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M20 12a2 2 0 0 0-.703.133l-2.398-1.963c.059-.214.101-.436.101-.67C17 8.114 15.886 7 14.5 7S12 8.114 12 9.5c0 .396.1.765.262 1.097l-2.909 3.438A2 2 0 0 0 9 14c-.179 0-.348.03-.512.074l-2.563-2.563C5.97 11.348 6 11.179 6 11c0-1.108-.892-2-2-2s-2 .892-2 2s.892 2 2 2c.179 0 .348-.03.512-.074l2.563 2.563A2 2 0 0 0 7 16c0 1.108.892 2 2 2s2-.892 2-2c0-.237-.048-.46-.123-.671l2.913-3.442c.227.066.462.113.71.113a2.5 2.5 0 0 0 1.133-.281l2.399 1.963A2 2 0 0 0 18 14c0 1.108.892 2 2 2s2-.892 2-2s-.892-2-2-2" />
                                    </svg>
                                </div>
                                <span className="text-primary">
                                   Algorithm Performance Analysis
                               </span>
                            </div>
                        </div>
                        <div className="collapse-content bg-base-50">
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
                                                    <div className="badge badge-primary badge-lg font-mono font-bold">O(n)</div>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                    <span className="font-semibold text-base-content/80">Space Complexity:</span>
                                                    <div className="badge badge-primary badge-outline badge-lg font-mono font-bold">O(n)</div>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-4 bg-info/10 rounded-xl border-l-4 border-info">
                                                <p className="text-sm text-base-content/80 leading-relaxed">
                                                    Factorial calculates the product of all positive integers up to a given number by repeatedly multiplying values in a sequence,
                                                    leading to linear time complexity.
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

                                            <div className="space-y-4">
                                                {executionTime !== null ? (
                                                    <>
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
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center p-8 bg-neutral/5 rounded-xl border-2 border-dashed border-base-300">
                                                        <div className="w-12 h-12 rounded-full bg-neutral/10 flex items-center justify-center mb-3">
                                                            <span className="text-2xl">⏱️</span>
                                                        </div>
                                                        <p className="text-sm text-base-content/60 text-center">
                                                            Run a search operation to see<br />detailed execution metrics
                                                        </p>
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
            </div>

            {/* Header Section - Connected to Collapse Above */}
            <div className="w-full px-4 sm:px-6 lg:px-8 -mt-2.5 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-indigo-900 rounded-b-2xl p-4 shadow-xl border border-slate-600/30 backdrop-blur-sm relative overflow-hidden">
                        {/* Subtle animated background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 -left-4 w-72 h-72 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
                            <div className="absolute top-0 -right-4 w-72 h-72 bg-gradient-to-l from-cyan-500 to-blue-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
                        </div>

                        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            {/* Left Section - Title and Status */}
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-xl font-bold text-white">!</span>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800 animate-pulse"></div>
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent tracking-tight">
                                        Factorial Visualization: {number}!
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border transition-all duration-300 ${
                                            isCalculating
                                                ? 'bg-yellow-500/20 border-yellow-400/40 text-yellow-200'
                                                : isStepMode
                                                    ? 'bg-blue-500/20 border-blue-400/40 text-blue-200'
                                                    : steps.length > 0
                                                        ? 'bg-green-500/20 border-green-400/40 text-green-200'
                                                        : 'bg-slate-500/20 border-slate-400/40 text-slate-300'
                                        }`}>
                                            <div className={`w-2 h-2 rounded-full ${
                                                isCalculating
                                                    ? 'bg-yellow-400 animate-ping'
                                                    : isStepMode
                                                        ? 'bg-blue-400 animate-pulse'
                                                        : steps.length > 0
                                                            ? 'bg-green-400'
                                                            : 'bg-slate-400'
                                            }`}></div>
                                            <span>
                                    {isCalculating
                                        ? 'Computing...'
                                        : isStepMode
                                            ? `Step ${currentStep + 1}/${getTotalSteps()}`
                                            : steps.length > 0
                                                ? 'Ready'
                                                : 'Awaiting input'}
                                </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Section - Result Display */}
                            {getFactorialResult() !== null && (
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
                                    <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl px-6 py-3 border border-slate-600/50">
                                        <div className="flex items-center gap-3">
                                            <div className="text-center">
                                                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                                                    Result
                                                </div>
                                                <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent font-mono">
                                                    {getFactorialResult().toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Card Grid Section */}
            <div className="flex-grow p-4 w-full mx-auto text-white">
                <div
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-7xl mx-auto"
                    style={{ minHeight: '200px' }}
                >
                    {cards.map((card, index) => (
                        card.visible && (
                            <div
                                key={index}
                                className="bg-indigo-800 rounded-lg p-3 sm:p-4 w-full min-w-[150px] max-w-[250px] mx-auto transition-all duration-300"
                                style={{
                                    animation: `fadeIn 0.5s ease-in-out ${index * 0.1}s both`,
                                }}
                            >
                                <div className="flex justify-between items-center mb-2 bg-indigo-900 rounded p-2">
                                    <span className="font-bold text-xs sm:text-sm">n</span>
                                    <span className="text-xs sm:text-base bg-indigo-300 text-indigo-900 px-3 sm:px-4 py-1 rounded font-bold">
                                        {card.n}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center mb-2 bg-indigo-900 rounded p-2">
                                    <span className="font-bold text-xs sm:text-sm">subValue</span>
                                    <span
                                        className={`text-xs sm:text-base transition-all duration-300 px-3 sm:px-4 py-1 rounded font-bold ${
                                            card.showingSubValue
                                                ? 'bg-indigo-300 text-indigo-900'
                                                : 'bg-transparent text-transparent'
                                        }`}
                                    >
                                        {card.subValue !== null ? card.subValue : '?'}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center bg-indigo-900 rounded p-2">
                                    <span className="font-bold text-xs sm:text-sm">returnValue</span>
                                    <span
                                        className={`text-xs sm:text-base transition-all duration-300 px-3 sm:px-4 py-1 rounded font-bold ${
                                            card.showingReturnValue
                                                ? 'bg-indigo-300 text-indigo-900'
                                                : 'bg-transparent text-transparent'
                                        }`}
                                    >
                                        {card.returnValue !== null ? card.returnValue : '?'}
                                    </span>
                                </div>

                                {card.showingReturnValue && card.returnValue !== null && (
                                    <div className="mt-2 text-xs sm:text-sm text-indigo-200 animate-fadeIn">
                                        {card.n <= 1 ? (
                                            <span>Base case: {card.n}! = 1</span>
                                        ) : (
                                            <span>
                                                {card.n} × {card.subValue} = {card.returnValue}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    ))}
                </div>
            </div>

            <details open className="hidden lg:block dropdown dropdown-left dropdown-center fixed bottom-1/3 right-2">
                <summary className="btn m-1 bg-base-content text-base-200">{"<"}</summary>
                {/* Pseudocode Panel */}
                <div tabIndex="-1" className="absolute dropdown-content menu rounded-box z-1 p-2 lg:w-fit lg:sticky lg:top-6 self-start">
                    <div className="card bg-base-100 shadow-lg border border-base-300">
                        <div className="card-body p-3 w-60">
                            <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="16 18 22 12 16 6"></polyline>
                                    <polyline points="8 6 2 12 8 18"></polyline>
                                </svg>
                                Pseudocode
                            </h3>
                            <div className="bg-base-200 rounded-lg p-2 font-mono text-xs space-y-0.5">
                                <div className={`px-2 py-1 rounded transition-all ${pseudocodeHighlight === 1 ? 'bg-primary/20 border-l-2 border-primary' : ''}`}>
                                    <span className="text-primary font-bold">function</span> factorial(n):
                                </div>
                                <div className={`px-2 py-1 rounded transition-all ml-2 ${pseudocodeHighlight === 2 ? 'bg-secondary/20 border-l-2 border-secondary' : ''}`}>
                                    <span className="text-secondary font-bold">if</span> n &lt;= 1:
                                </div>
                                <div className={`px-2 py-1 rounded transition-all ml-4 ${pseudocodeHighlight === 3 ? 'bg-info/20 border-l-2 border-info' : ''}`}>
                                    <span className="text-info font-bold">return</span> 1
                                </div>
                                <div className={`px-2 py-1 rounded transition-all ml-2 ${pseudocodeHighlight === 4 ? 'bg-warning/20 border-l-2 border-warning' : ''}`}>
                                    <span className="text-warning font-bold">else</span>:
                                </div>
                                <div className={`px-2 py-1 rounded transition-all ml-4 ${pseudocodeHighlight === 5 ? 'bg-success/20 border-l-2 border-success' : ''}`}>
                                    <span className="text-success font-bold">return</span> n * factorial(n-1)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </details>

            {/* Control Panel */}
            <div className="p-4 bg-base-200 w-full">
                <div className="flex flex-col lg:flex-row justify-center items-center gap-2 lg:gap-4 max-w-7xl mx-auto">
                    <button
                        className="btn btn-accent btn-sm lg:btn-md w-full lg:w-auto"
                        onClick={handleRandom}
                        disabled={isCalculating}
                        aria-label="Generate random number"
                    >
                        Random
                    </button>
                    <button
                        className="btn btn-accent btn-sm lg:btn-md w-full lg:w-auto"
                        onClick={animateCalculationSteps}
                        disabled={isCalculating || steps.length === 0}
                        aria-label="Start factorial calculation"
                    >
                        Start Calculation
                    </button>

                    {/* Step Navigation Buttons */}
                    <button
                        className="btn btn-accent btn-sm lg:btn-md w-full lg:w-auto"
                        onClick={stepBackward}
                        disabled={isCalculating || steps.length === 0 || (!isStepMode && currentStep <= -1)}
                        aria-label="Step backward"
                    >
                        Step Backward
                    </button>
                    <button
                        className="btn btn-accent btn-sm lg:btn-md w-full lg:w-auto"
                        onClick={stepForward}
                        disabled={isCalculating || steps.length === 0 || (isStepMode && currentStep >= getTotalSteps() - 1)}
                        aria-label="Step forward"
                    >
                        Step Forward
                    </button>

                    <div className="join flex items-center w-full lg:max-w-sm">
                        <input
                            type="number"
                            value={inputValue}
                            className="input input-bordered join-item w-full text-xs lg:text-sm"
                            onChange={handleInput}
                            min="0"
                            max="12"
                            aria-label="Enter number for factorial (0-12)"
                        />
                        <button
                            className="btn btn-primary btn-md join-item"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            aria-label="Submit number"
                        >
                            Go
                        </button>
                    </div>
                    <div className="flex items-center gap-2 w-full lg:max-w-sm">
                        <span className="text-xs lg:text-sm font-semibold whitespace-nowrap light:text-black/80">
                            SPEED:
                        </span>
                        <input
                            type="range"
                            min="50"
                            max="1000"
                            step="50"
                            value={speed}
                            className="range range-primary range-xs w-full"
                            onChange={(e) => setSpeed(Number(e.target.value))}
                            aria-label={`Animation speed: ${speed} milliseconds`}
                        />
                        <span className="text-xs lg:text-sm text-base-content/70 whitespace-nowrap w-12">
                            {speed} ms
                        </span>
                    </div>
                    <SoundToggle/>
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

export default FactorialVisualization;