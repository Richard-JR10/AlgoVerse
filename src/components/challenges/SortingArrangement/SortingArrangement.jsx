import { useState, useEffect, useContext } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    horizontalListSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem.jsx';
import { Item } from './Item.jsx';
import axios from 'axios';
import PropTypes from "prop-types";
import {useAuth} from "../../../Auth/AuthContext.jsx";
import {ErrorContext} from "../../../context/errorContext.jsx";
import {ChallengeContext} from "../ChallengeContext.jsx";

const ALGORITHMS = {
    BUBBLE: 'bubble sort',
    QUICK: 'quick sort',
    MERGE: 'merge sort',
    INSERTION: 'insertion sort',
    SELECTION: 'selection sort'
};

const SortingArrangement = ({ id, questions, pointsMultiplier }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const currentQuestion = questions[currentQuestionIndex];

    // State
    const [items, setItems] = useState([...currentQuestion.initialArray]);
    const [answers, setAnswers] = useState(questions.map(() => [...currentQuestion.initialArray]));
    const [activeId, setActiveId] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isRetaking, setIsRetaking] = useState(false);
    const [storedAnswers, setStoredAnswers] = useState(null);
    const [storedScore, setStoredScore] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const { auth } = useAuth();
    const { setError } = useContext(ErrorContext);
    const { addSolvedChallenge, addPoints } = useContext(ChallengeContext);
    const baseURL = 'https://algoverse-backend-nodejs.onrender.com';

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Check completion status
    useEffect(() => {
        const checkCompletion = async () => {
            if (auth.currentUser) {
                try {
                    const token = await auth.currentUser.getIdToken();
                    const response = await axios.get(`${baseURL}/api/userProgress`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (response.data.SolvedChallenges?.includes(id)) {
                        setIsCompleted(true);
                        const rawAnswers = response.data.challengeAttempts?.[id]?.answers || [];
                        // Normalize storedAnswers to array of arrays
                        let normalizedAnswers = [];
                        let answerIndex = 0;
                        for (const q of questions) {
                            const arrayLength = q.expectedArray.length;
                            const questionAnswer = rawAnswers.slice(answerIndex, answerIndex + arrayLength);
                            normalizedAnswers.push(questionAnswer);
                            answerIndex += arrayLength;
                        }
                        setStoredAnswers(normalizedAnswers);
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
    }, [auth.currentUser, id, setError, questions, baseURL]);

    // Update items when question changes
    useEffect(() => {
        setItems([...questions[currentQuestionIndex].initialArray]);
    }, [currentQuestionIndex, questions]);

    // Drag handlers
    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);
                // Update answers
                setAnswers((prev) => {
                    const newAnswers = [...prev];
                    newAnswers[currentQuestionIndex] = [...newItems];
                    return newAnswers;
                });
                return newItems;
            });
        }
    };

    // Reset question
    const resetQuestion = () => {
        setItems([...currentQuestion.initialArray]);
        setAnswers((prev) => {
            const newAnswers = [...prev];
            newAnswers[currentQuestionIndex] = [...currentQuestion.initialArray];
            return newAnswers;
        });
    };

    // Navigation
    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    // Submit quiz
    const handleSubmit = async () => {
        setIsSubmitted(true);
        setIsRetaking(false);
        const score = calculateScore();
        const totalPoints = score * pointsMultiplier;
        if (!isCompleted) {
            const success = await handleCompleteChallenge(totalPoints, answers, score);
            if (success) {
                setIsCompleted(true);
            }
        } else {
            await handleRecordRetry(answers, score);
        }
    };

    // Calculate score
    const calculateScore = () => {
        return answers.reduce((score, answer, index) => {
            return JSON.stringify(answer) === JSON.stringify(questions[index].expectedArray)
                ? score + 1
                : score;
        }, 0);
    };

    // Complete challenge
    const handleCompleteChallenge = async (totalPoints, answers, score) => {
        if (!auth.currentUser) {
            setError("You must be logged in to complete a challenge.");
            return false;
        }
        try {
            const token = await auth.currentUser.getIdToken();
            const payload = {
                challengeId: id || "unknown",
                points: Number(totalPoints) || 0,
                answers: answers.flat().map(a => a.toString()),
                score: Number(score) || 0,
            };
            if (!payload.challengeId || !Array.isArray(payload.answers)) {
                throw new Error("Invalid payload: challengeId or answers missing");
            }
            await axios.post(
                `${baseURL}/api/completeChallenge`,
                payload,
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
            console.error("Error in handleCompleteChallenge:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
            });
            setError(err.response?.data?.error || "Failed to complete challenge.");
            return false;
        }
    };

    // Record retry
    const handleRecordRetry = async (answers, score) => {
        if (!auth.currentUser) {
            setError("You must be logged in to retry a challenge.");
            return;
        }
        try {
            const token = await auth.currentUser.getIdToken();
            const sanitizedAnswers = answers.flat().map(a => a.toString());
            await axios.post(
                `${baseURL}/api/recordRetry`,
                { challengeId: id, answers: sanitizedAnswers, score },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setRetryCount(prev => prev + 1);
            setStoredAnswers(answers);
            setStoredScore(score);
        } catch (err) {
            console.error("Error recording retry:", err);
            setError(err.response?.data?.error || "Failed to record retry.");
        }
    };

    // Reset quiz
    const handleReset = () => {
        setIsSubmitted(false);
        setAnswers(questions.map(q => [...q.initialArray]));
        setCurrentQuestionIndex(0);
        setIsRetaking(true);
        setItems([...questions[0].initialArray]);
    };

    // Algorithm styling
    const getAlgorithmColor = () => {
        switch(currentQuestion.algorithm) {
            case ALGORITHMS.BUBBLE: return 'bg-blue-500';
            case ALGORITHMS.QUICK: return 'bg-purple-500';
            case ALGORITHMS.MERGE: return 'bg-green-500';
            case ALGORITHMS.INSERTION: return 'bg-yellow-500';
            case ALGORITHMS.SELECTION: return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    if (loading) {
        return <p className="text-center">Loading...</p>;
    }

    if (isSubmitted || (isCompleted && !isRetaking && !isSubmitted)) {
        const displayAnswers = isSubmitted ? answers : storedAnswers || answers;
        const displayScore = isSubmitted ? calculateScore() : storedScore !== null ? storedScore : calculateScore();

        return (
            <div className="max-w-3xl mx-auto p-6 rounded-xl flex flex-col justify-center">
                <div className="mt-4">
                    <div className="text-lg font-medium mb-10 text-center">
                        {isCompleted && !isSubmitted ? "Challenge Already Completed" : "Quiz Results"}
                    </div>
                    <div className="flex flex-col items-start w-full">
                        <div className="text-lg mb-4">
                            You scored {displayScore} out of {questions.length}!
                        </div>
                        {questions.map((q, qIndex) => (
                            <div key={qIndex} className="mb-4 w-full">
                                <div className="font-medium">
                                    {q.stepDescription} ({q.algorithm})
                                </div>
                                <div className=" p-3 rounded-md mt-2">
                                    <p className="font-semibold mb-1">Your arrangement:</p>
                                    <div className="flex gap-2">
                                        {displayAnswers[qIndex]?.map((num, i) => (
                                            <span key={`answer-${qIndex}-${i}`} className="font-mono">{num}</span>
                                        ))}
                                        <span
                                            className={
                                                JSON.stringify(displayAnswers[qIndex]) === JSON.stringify(q.expectedArray)
                                                    ? "text-green-500"
                                                    : "text-red-500"
                                            }
                                        >
                                            {JSON.stringify(displayAnswers[qIndex]) === JSON.stringify(q.expectedArray)
                                                ? " (Correct)"
                                                : " (Incorrect)"}
                                        </span>
                                    </div>
                                </div>
                                {JSON.stringify(displayAnswers[qIndex]) !== JSON.stringify(q.expectedArray) && (
                                    <div className=" p-3 rounded-md mt-2">
                                        <p className="font-semibold mb-1">Expected arrangement:</p>
                                        <div className="flex gap-2">
                                            {q.expectedArray.map((num, i) => (
                                                <span key={`expected-${qIndex}-${i}`} className="font-mono">{num}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-0 sm:p-6 rounded-xl flex flex-col justify-center">
            <div className="mt-20">
                <div className={`mb-4 p-2 rounded-lg ${getAlgorithmColor().replace('500', '100')} border-l-4 ${getAlgorithmColor()} border-opacity-75`}>
                    <h1 className="text-2xl font-bold text-center text-gray-800">
                        {currentQuestion.algorithm.toUpperCase()} Visualization
                    </h1>
                </div>
                <p className="mb-2 text-center dark:text-neutral-content/80 light:text-black">
                    Question {currentQuestionIndex + 1} of {questions.length}
                </p>
                <p className="mb-6 text-center dark:text-neutral-content/80 light:text-black/75 font-medium">
                    {currentQuestion.stepDescription}
                </p>

                <div className="mb-8 light:bg-base-200 dark:bg-white p-4 rounded-lg shadow-inner">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items}
                            strategy={horizontalListSortingStrategy}
                        >
                            <div className="flex gap-4 min-h-20 justify-center items-end">
                                {items.map((value) => (
                                    <SortableItem
                                        key={value}
                                        id={value}
                                        value={value} />
                                ))}
                            </div>
                        </SortableContext>

                        <DragOverlay>
                            {activeId ? (
                                <Item
                                    id={activeId}
                                    value={items.find(item => item === activeId)}
                                    isDragging
                                    colorClass={getAlgorithmColor()}
                                />
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>

                <div className="flex justify-between mb-6">
                    <button
                        onClick={prevQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="btn rounded-lg shadow-lg bg-gray-600"
                    >
                        Previous
                    </button>

                    <div className="flex gap-1 sm:gap-4">
                        <button
                            onClick={resetQuestion}
                            className="btn btn-error rounded-lg shadow-lg"
                        >
                            Reset
                        </button>

                    </div>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            className="btn btn-success rounded-lg shadow-lg"
                        >
                            Submit
                        </button>
                    ) : (
                        <button
                            onClick={nextQuestion}
                            disabled={currentQuestionIndex === questions.length - 1}
                            className="btn rounded-lg shadow-lg bg-gray-600"
                        >
                            Next
                        </button>
                    )}

                </div>

            </div>
        </div>
    );
};

SortingArrangement.propTypes = {
    id: PropTypes.string.isRequired,
    questions: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            algorithm: PropTypes.string.isRequired,
            initialArray: PropTypes.arrayOf(PropTypes.number).isRequired,
            expectedArray: PropTypes.arrayOf(PropTypes.number).isRequired,
            explanation: PropTypes.string.isRequired,
            stepDescription: PropTypes.string.isRequired,
        })
    ).isRequired,
    pointsMultiplier: PropTypes.number.isRequired,
};

export default SortingArrangement;