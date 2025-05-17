import { useState, useEffect, useRef } from 'react';
import NavBar from "../../components/navBar.jsx";
import axios from "axios";

const FactorialVisualization = () => {
    const [inputValue, setInputValue] = useState("10");
    const [number, setNumber] = useState(10);
    const [steps, setSteps] = useState([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cards, setCards] = useState([]);
    const svgRef = useRef(null);
    const speedRef = useRef(speed);
    const isCancelledRef = useRef(false);

    // Navigation menu items
    const visualizerMenu = [
        { label: 'Factorial', path: '/visualizer/recursion/factorial' },
        { label: 'Tower of Hanoi', path: '/visualizer/recursion/hanoi' }
    ];


    const handleInput = (e) => {
        e.preventDefault();
        setInputValue(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const input = parseInt(inputValue.trim(), 10);
        if (isNaN(input) || input < 0 || input > 12) {
            alert("Please enter a valid number between 0 and 12");
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
            const response = await axios.post(`https://algoverse-backend-python.onrender.com/recursion/factorial`, {
                n: num
            },{
                headers: {
                    'Content-Type': 'application/json',
                    // Add Authorization header if needed, e.g., 'Bearer <token>'
                }
            });

            const calculationSteps = response.data.steps;
            setSteps(calculationSteps);

            // Initialize cards with unique n values
            const uniqueNValues = [...new Set(calculationSteps.map(step => step.n))];
            const initialCards = uniqueNValues.map(n => ({
                n,
                visible: false,
                subValue: null,
                returnValue: null,
                showingSubValue: false,
                showingReturnValue: false
            }));
            setCards(initialCards);

            setIsSubmitting(false);
            isCancelledRef.current = false;
        } catch (err) {
            console.error(err);
            alert("Failed to fetch factorial steps from the API. Please try again.");
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
            await new Promise(resolve => setTimeout(resolve, speedRef.current));
        }

        // Second phase: Calculate values from bottom up
        for (let i = updatedCards.length - 1; i >= 0; i--) {
            if (isCancelledRef.current) break;
            const step = steps.find(s => s.n === updatedCards[i].n && (s.type === "base" || s.type === "return"));

            if (step) {
                // Show subValue
                updatedCards[i] = { ...updatedCards[i], subValue: step.type === "base" ? 1 : step.subValue, showingSubValue: true };
                setCards([...updatedCards]);
                await new Promise(resolve => setTimeout(resolve, speedRef.current));

                // Show returnValue
                updatedCards[i] = { ...updatedCards[i], returnValue: step.type === "base" ? 1 : step.returnValue, showingReturnValue: true };
                setCards([...updatedCards]);
                await new Promise(resolve => setTimeout(resolve, speedRef.current));
            }
        }

        setIsCalculating(false);
    };

    const getFactorialResult = () => {
        const returnStep = steps.find(step => step.type === "return" && step.n === number);
        return returnStep ? returnStep.returnValue : null;
    };

    return (
        <div className="flex flex-col h-full bg-base-200 text-white relative">
            <NavBar menuItems={visualizerMenu}/>

            <div className="flex justify-between items-center mx-4 mt-4 p-4 bg-indigo-900 rounded-lg text-white">
                <div>
                    <h2 className="text-sm md:text-xl font-bold">Factorial Visualization: {number}!</h2>
                    <p className="text-xs md:text-lg">{isCalculating ? "Calculating..." : steps.length > 0 ? "Ready to start calculation" : "Enter a number to begin"}</p>
                </div>
                {getFactorialResult() !== null && (
                    <div className="bg-indigo-700 p-3 rounded-lg">
                        <span className="font-bold text-sm md:text-xl ">Result: {getFactorialResult().toLocaleString()}</span>
                    </div>
                )}
            </div>

            <div className="w-full mb-6 p-4 flex justify-center">
                <div className="w-300 grid grid-cols-5 gap-4">
                    {cards.map((card, index) => (
                        card.visible && (
                            <div
                                key={index}
                                className={`bg-indigo-800 rounded-lg p-4 transition-all duration-300`}
                                style={{
                                    animation: `fadeIn 0.5s ease-in-out ${index * 0.1}s both`,
                                }}
                            >
                                <div className="flex justify-between items-center mb-2 bg-indigo-900 rounded p-2">
                                    <span className="font-bold text-xs md:text-sm">n</span>
                                    <span className="text-xs sm:text-base bg-indigo-300 text-indigo-900 px-4 py-1 rounded font-bold">{card.n}</span>
                                </div>

                                <div className="flex justify-between items-center mb-2 bg-indigo-900 rounded p-2">
                                    <span className="font-bold text-xs md:text-sm">subValue</span>
                                    <span className={`text-xs sm:text-base transition-all duration-300 px-4 py-1 rounded font-bold ${card.showingSubValue ? 'bg-indigo-300 text-indigo-900' : 'bg-transparent text-transparent'}`}>
                                        {card.subValue !== null ? card.subValue : '?'}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center bg-indigo-900 rounded p-2">
                                    <span className="font-bold text-xs md:text-sm">returnValue</span>
                                    <span className={`text-xs sm:text-base transition-all duration-300 px-4 py-1 rounded font-bold ${card.showingReturnValue ? 'bg-indigo-300 text-indigo-900' : 'bg-transparent text-transparent'}`}>
                                        {card.returnValue !== null ? card.returnValue : '?'}
                                    </span>
                                </div>

                                {card.showingReturnValue && card.returnValue !== null && (
                                    <div className="mt-2 text-sm text-indigo-200 animate-fadeIn">
                                        {card.n <= 1 ? (
                                            <span>Base case: {card.n}! = 1</span>
                                        ) : (
                                            <span>{card.n} × {card.subValue} = {card.returnValue}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    ))}
                </div>
            </div>

            <div className="fixed left-1/3 right-1/3 bottom-5">
                <div className="flex justify-center items-center flex-row">
                    <button
                        className="btn mr-2"
                        onClick={handleRandom}
                        disabled={isCalculating}
                    >
                        Random
                    </button>
                    <button
                        className="btn mr-4"
                        onClick={animateCalculationSteps}
                        disabled={isCalculating || steps.length === 0}
                    >
                        Start Calculation
                    </button>
                    <div className="join flex items-center w-full max-w-md mr-4">
                        <input
                            type="number"
                            value={inputValue}
                            className="input join-item w-full"
                            onChange={handleInput}
                            min="0"
                            max="12"
                        />
                        <button
                            className="btn join-item"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            Go
                        </button>
                    </div>
                    <div className="flex justify-center w-full max-w-md">
                        <input
                            type="range"
                            min={50}
                            max="1000"
                            value={speed}
                            className="range range-primary"
                            onChange={(e) => setSpeed(Number(e.target.value))}
                        />
                        <span>Speed: {speed} ms</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FactorialVisualization;