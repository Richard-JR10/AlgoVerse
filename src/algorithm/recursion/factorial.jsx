import { useState, useEffect, useRef } from 'react';
import NavBar from '../../components/navBar.jsx';
import axios from 'axios';

const FactorialVisualization = () => {
    const [inputValue, setInputValue] = useState('10');
    const [number, setNumber] = useState(10);
    const [steps, setSteps] = useState([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cards, setCards] = useState([]);
    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);

    const [error, setError] = useState(null);

    // Navigation menu items
    const visualizerMenu = [
        { label: 'Factorial', path: '/visualizer/recursion/factorial' },
        { label: 'Tower of Hanoi', path: '/visualizer/recursion/hanoi' },
    ];

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

    const initializeVisualization = async (num) => {
        try {
            setIsSubmitting(true);
            if (isCalculating) {
                isCancelledRef.current = true;
                setIsCalculating(false);
            }

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

            const calculationSteps = response.data.steps;
            setSteps(calculationSteps);

            // Initialize cards with unique n values
            const uniqueNValues = [...new Set(calculationSteps.map((step) => step.n))];
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

    const animateCalculationSteps = async () => {
        setIsCalculating(true);
        isCancelledRef.current = false;

        // First phase: Show all cards sequentially
        let updatedCards = [...cards];
        for (let i = 0; i < updatedCards.length; i++) {
            if (isCancelledRef.current) break;
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
                await new Promise((resolve) => setTimeout(resolve, speedRef.current));

                // Show returnValue
                updatedCards[i] = {
                    ...updatedCards[i],
                    returnValue: step.type === 'base' ? 1 : step.returnValue,
                    showingReturnValue: true,
                };
                setCards([...updatedCards]);
                await new Promise((resolve) => setTimeout(resolve, speedRef.current));
            }
        }

        setIsCalculating(false);
    };

    const getFactorialResult = () => {
        const returnStep = steps.find((step) => step.type === 'return' && step.n === number);
        return returnStep ? returnStep.returnValue : null;
    };

    return (
        <div className="flex flex-col scrollbar-hide overflow-auto h-screen bg-base-200 text-white relative">
            <NavBar menuItems={visualizerMenu} />

            {/* Header Section */}
            <div className="mx-4 mt-4 p-4 bg-indigo-900 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-sm sm:text-lg md:text-xl font-bold">
                        Factorial Visualization: {number}!
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base">
                        {isCalculating
                            ? 'Calculating...'
                            : steps.length > 0
                                ? 'Ready to start calculation'
                                : 'Enter a number to begin'}
                    </p>
                </div>
                {getFactorialResult() !== null && (
                    <div
                        className="bg-indigo-700 p-2 sm:p-3 rounded-lg w-full sm:w-auto"
                        aria-live="polite"
                    >
                        <span className="font-bold text-sm sm:text-lg md:text-xl">
                            Result: {getFactorialResult().toLocaleString()}
                        </span>
                    </div>
                )}
            </div>

            {/* Card Grid Section */}
            <div className="flex-grow p-4 w-full mx-auto">
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

            {/* Control Panel */}
            <div className="p-4 bg-base-200 w-full">
                <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 max-w-4xl mx-auto">
                    <button
                        className="btn btn-accent btn-sm sm:btn-md w-full sm:w-auto"
                        onClick={handleRandom}
                        disabled={isCalculating}
                        aria-label="Generate random number"
                    >
                        Random
                    </button>
                    <button
                        className="btn btn-accent btn-sm sm:btn-md w-full sm:w-auto"
                        onClick={animateCalculationSteps}
                        disabled={isCalculating || steps.length === 0}
                        aria-label="Start factorial calculation"
                    >
                        Start Calculation
                    </button>
                    <div className="join flex items-center w-full sm:max-w-sm">
                        <input
                            type="number"
                            value={inputValue}
                            className="input input-bordered join-item w-full text-xs sm:text-sm"
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
                    <div className="flex items-center gap-2 w-full sm:max-w-sm">
                        <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
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
                        <span className="text-xs sm:text-sm text-base-content/70 whitespace-nowrap w-12">
                            {speed} ms
                        </span>
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

export default FactorialVisualization;