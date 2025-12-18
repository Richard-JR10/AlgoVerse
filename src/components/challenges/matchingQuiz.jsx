import { useState, useEffect, useContext, useRef } from "react";
import { useAuth } from "../../Auth/AuthContext.jsx";
import axios from "axios";
import { ErrorContext } from "../../context/errorContext.jsx";
import PropTypes from "prop-types";
import { ChallengeContext } from "./ChallengeContext.jsx";

const MatchingQuiz = ({ id, pairs, pointsMultiplier }) => {
    const [matches, setMatches] = useState({});
    const [revealed, setRevealed] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isRetaking, setIsRetaking] = useState(false);
    const [storedMatches, setStoredMatches] = useState(null);
    const [storedScore, setStoredScore] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [shuffledRight, setShuffledRight] = useState([]);
    const [selectedLeft, setSelectedLeft] = useState(null);
    const [lines, setLines] = useState([]);

    const leftRefs = useRef({});
    const rightRefs = useRef({});
    const containerRef = useRef(null);

    const { setError } = useContext(ErrorContext);
    const { auth } = useAuth();
    const { addSolvedChallenge, addPoints } = useContext(ChallengeContext);
    const baseURL = "https://algoverse-backend-nodejs.onrender.com";

    // Shuffle right column items on mount
    useEffect(() => {
        const shuffled = [...pairs.map(p => p.right)].sort(() => Math.random() - 0.5);
        setShuffledRight(shuffled);
    }, []);

    // Update lines when matches change
    useEffect(() => {
        const updateLines = () => {
            const newLines = [];
            Object.entries(matches).forEach(([left, right]) => {
                const leftEl = leftRefs.current[left];
                const rightEl = rightRefs.current[right];
                const container = containerRef.current;

                if (leftEl && rightEl && container) {
                    const leftRect = leftEl.getBoundingClientRect();
                    const rightRect = rightEl.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();

                    const x1 = leftRect.right - containerRect.left;
                    const y1 = leftRect.top + leftRect.height / 2 - containerRect.top;
                    const x2 = rightRect.left - containerRect.left;
                    const y2 = rightRect.top + rightRect.height / 2 - containerRect.top;

                    newLines.push({ x1, y1, x2, y2, left, right });
                }
            });
            setLines(newLines);
        };

        updateLines();
        window.addEventListener('resize', updateLines);
        return () => window.removeEventListener('resize', updateLines);
    }, [matches, shuffledRight]);

    // Check completion status and fetch stored data
    useEffect(() => {
        const checkCompletion = async () => {
            if (auth.currentUser) {
                try {
                    const token = await auth.currentUser.getIdToken();
                    const response = await axios.get(`${baseURL}/api/userProgress`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (response.data.SolvedChallenges?.includes(id)) {
                        setIsCompleted(true);
                        setStoredMatches(response.data.challengeAttempts?.[id]?.matches || {});
                        setStoredScore(response.data.challengeAttempts?.[id]?.score || 0);
                        setRetryCount(response.data.retryCount?.[id] || 0);
                    }
                } catch (err) {
                    console.error("Error checking completion:", err);
                    setError("Failed to load challenge status.");
                }
            }
            setLoading(false);
        };
        checkCompletion();
    }, [auth.currentUser, id, setError]);

    const handleLeftSelect = (leftItem) => {
        setSelectedLeft(leftItem);
    };

    const handleRightSelect = (rightItem) => {
        if (selectedLeft && !Object.values(matches).includes(rightItem)) {
            setMatches(prev => ({
                ...prev,
                [selectedLeft]: rightItem
            }));
            setSelectedLeft(null);
        }
    };

    const handleReveal = async (leftItem) => {
        if (!auth.currentUser) {
            setError("You must be logged in to reveal the answer.");
            return;
        }
        try {
            const token = await auth.currentUser.getIdToken();
            if (true) {
                setRevealed(prev => ({
                    ...prev,
                    [leftItem]: true
                }));
            } else {
                setError("Insufficient credits.");
            }
        } catch (err) {
            console.error("Error revealing answer:", err);
            setError(err.response?.data?.error || "Failed to reveal answer.");
        }
    };

    const handleCompleteChallenge = async (totalPoints, matches, score) => {
        if (!auth.currentUser) {
            setError("You must be logged in to complete a challenge.");
            return;
        }
        try {
            const token = await auth.currentUser.getIdToken();
            await axios.post(
                `${baseURL}/api/completeChallenge`,
                { challengeId: id, points: totalPoints, matches, score },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            addSolvedChallenge(id);
            addPoints(totalPoints);
            return true;
        } catch (err) {
            console.error("Error:", err);
            setError(err.response?.data?.error || "Failed to complete challenge.");
        }
    };

    const handleRecordRetry = async (matches, score) => {
        if (!auth.currentUser) {
            setError("You must be logged in to retry a challenge.");
            return;
        }
        try {
            const token = await auth.currentUser.getIdToken();
            await axios.post(
                `${baseURL}/api/recordRetry`,
                { challengeId: id, matches, score },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setRetryCount(prev => prev + 1);
            setStoredMatches(matches);
            setStoredScore(score);
        } catch (err) {
            console.error("Error recording retry:", err);
            setError(err.response?.data?.error || "Failed to record retry.");
        }
    };

    const calculateScore = () => {
        return pairs.reduce((score, pair) => {
            return matches[pair.left] === pair.right ? score + 1 : score;
        }, 0);
    };

    const handleSubmit = async () => {
        setIsSubmitted(true);
        setIsRetaking(false);
        const score = calculateScore();
        const totalPoints = score * pointsMultiplier;
        if (!isCompleted) {
            const success = await handleCompleteChallenge(totalPoints, matches, score);
            if (success) {
                setIsCompleted(true);
            }
        } else {
            await handleRecordRetry(matches, score);
        }
    };

    const handleReset = () => {
        setIsSubmitted(false);
        setMatches({});
        setRevealed({});
        setIsRetaking(true);
        setSelectedLeft(null);
        const shuffled = [...pairs.map(p => p.right)].sort(() => Math.random() - 0.5);
        setShuffledRight(shuffled);
    };

    if (loading) {
        return <p className="text-center">Loading...</p>;
    }

    if (isSubmitted || (isCompleted && !isRetaking && !isSubmitted)) {
        const displayMatches = isSubmitted ? matches : storedMatches || matches;
        const displayScore = isSubmitted ? calculateScore() : storedScore !== null ? storedScore : calculateScore();
        return (
            <div className="flex flex-col items-center px-4">
                <div className="text-lg font-medium mt-20 mb-10">
                    {isCompleted && !isSubmitted ? "Challenge Already Completed" : "Quiz Results"}
                </div>
                <div className="flex flex-col items-start w-full max-w-2xl">
                    <div className="text-lg mb-4">
                        You scored {displayScore} out of {pairs.length}!
                    </div>
                    {pairs.map((pair, index) => (
                        <div key={index} className="mb-4 p-4 border rounded-lg w-full">
                            <div className="font-medium mb-2">{pair.left}</div>
                            <div>
                                Your match: {displayMatches[pair.left] || "Not answered"}
                                {displayMatches[pair.left] && (
                                    <span
                                        className={
                                            displayMatches[pair.left] === pair.right
                                                ? "text-green-500"
                                                : "text-red-500"
                                        }
                                    >
                                        {" "}
                                        ({displayMatches[pair.left] === pair.right ? "Correct" : "Incorrect"})
                                    </span>
                                )}
                            </div>
                            {!displayMatches[pair.left] || displayMatches[pair.left] !== pair.right ? (
                                <div className="text-green-600">Correct match: {pair.right}</div>
                            ) : null}
                        </div>
                    ))}
                    {isCompleted && (
                        <div className="text-sm text-gray-600 mb-4">
                            This challenge was previously completed. No additional points will be awarded upon retry.
                        </div>
                    )}
                    {isCompleted && (
                        <div className="text-sm text-gray-600 mb-4">
                            Retry attempts: {retryCount}
                        </div>
                    )}
                    <button
                        className="btn btn-primary w-full mt-4"
                        onClick={handleReset}
                    >
                        Retake Quiz
                    </button>
                </div>
            </div>
        );
    }

    const allMatched = pairs.every(pair => matches[pair.left]);

    return (
        <div className="flex flex-col items-center px-4">
            <div className="text-lg font-medium mt-20 mb-4">
                {pairs.instruction}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-10">
                Click an algorithm on the left, then click its matching time complexity on the right
            </div>
            <div className="relative w-full max-w-5xl" ref={containerRef}>
                {/* SVG for drawing lines */}
                <svg
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 1 }}
                >
                    {lines.map((line, idx) => {
                        const isCorrect = pairs.find(p => p.left === line.left)?.right === line.right;
                        return (
                            <g key={idx}>
                                <line
                                    x1={line.x1}
                                    y1={line.y1}
                                    x2={line.x2}
                                    y2={line.y2}
                                    stroke={isCorrect ? "#10b981" : "#3b82f6"}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                                {/* Connection dots */}
                                <circle cx={line.x1} cy={line.y1} r="6" fill={isCorrect ? "#10b981" : "#3b82f6"} />
                                <circle cx={line.x2} cy={line.y2} r="6" fill={isCorrect ? "#10b981" : "#3b82f6"} />
                            </g>
                        );
                    })}
                </svg>

                <div className="grid grid-cols-[1fr_80px_1fr] gap-4 relative" style={{ zIndex: 2 }}>
                    {/* Left Column - Algorithms */}
                    <div className="flex flex-col gap-4">
                        <div className="text-sm font-semibold mb-2 text-center">Algorithms</div>
                        {pairs.map((pair, index) => (
                            <div key={index} className="flex flex-col gap-2">
                                <button
                                    ref={(el) => leftRefs.current[pair.left] = el}
                                    className={`p-4 border-2 rounded-lg text-left transition-all relative ${
                                        matches[pair.left]
                                            ? "bg-gray-200 dark:bg-gray-700 border-gray-400"
                                            : selectedLeft === pair.left
                                                ? "bg-blue-200 dark:bg-blue-900 border-blue-500 shadow-lg"
                                                : "bg-blue-50 dark:bg-blue-950 border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
                                    }`}
                                    onClick={() => handleLeftSelect(pair.left)}
                                    disabled={matches[pair.left]}
                                >
                                    <div className="font-medium">{pair.left}</div>
                                    {matches[pair.left] && (
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1">
                                            <span className="text-green-500">●</span> Matched
                                        </div>
                                    )}
                                </button>
                                {!revealed[pair.left] ? (
                                    <button
                                        className="btn btn-warning btn-sm"
                                        onClick={() => handleReveal(pair.left)}
                                    >
                                        Reveal (10 credits)
                                    </button>
                                ) : (
                                    <div className="text-sm text-green-600 dark:text-green-400 p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                                        ✓ {pair.right}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Middle spacer for lines */}
                    <div></div>

                    {/* Right Column - Time Complexities */}
                    <div className="flex flex-col gap-4">
                        <div className="text-sm font-semibold mb-2 text-center">Time Complexities</div>
                        {shuffledRight.map((rightItem, index) => (
                            <button
                                key={index}
                                ref={(el) => rightRefs.current[rightItem] = el}
                                className={`p-4 border-2 rounded-lg text-left transition-all relative ${
                                    Object.values(matches).includes(rightItem)
                                        ? "bg-gray-200 dark:bg-gray-700 border-gray-400 opacity-50"
                                        : selectedLeft
                                            ? "bg-green-50 dark:bg-green-950 border-green-300 hover:bg-green-100 dark:hover:bg-green-900 hover:shadow-lg"
                                            : "bg-green-50 dark:bg-green-950 border-green-300"
                                }`}
                                onClick={() => handleRightSelect(rightItem)}
                                disabled={Object.values(matches).includes(rightItem)}
                            >
                                {rightItem}
                                {Object.values(matches).includes(rightItem) && (
                                    <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-green-500 text-xl">●</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-4 w-full max-w-md mt-10">
                <button
                    className="btn btn-error flex-1"
                    onClick={() => {
                        setMatches({});
                        setSelectedLeft(null);
                    }}
                    disabled={Object.keys(matches).length === 0}
                >
                    Reset
                </button>
                <button
                    className="btn btn-success flex-1"
                    onClick={handleSubmit}
                    disabled={!allMatched}
                >
                    Submit ({Object.keys(matches).length}/{pairs.length})
                </button>
            </div>
        </div>
    );
};

export default MatchingQuiz;

MatchingQuiz.propTypes = {
    id: PropTypes.string.isRequired,
    pairs: PropTypes.arrayOf(
        PropTypes.shape({
            left: PropTypes.string.isRequired,
            right: PropTypes.string.isRequired,
        })
    ).isRequired,
    pointsMultiplier: PropTypes.number.isRequired,
};