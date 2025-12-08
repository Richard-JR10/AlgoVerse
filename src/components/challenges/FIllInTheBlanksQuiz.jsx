import React, { useContext, useEffect, useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    useDroppable,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    horizontalListSortingStrategy,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PropTypes from "prop-types";
import { useAuth } from "../../Auth/AuthContext.jsx";
import { ErrorContext } from "../../context/errorContext.jsx";
import { ChallengeContext } from "./ChallengeContext.jsx";
import axios from "axios";

// Sortable Item component
const SortableItem = ({ id, value }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        touchAction: 'none',
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`px-4 py-2 rounded-lg shadow cursor-grab bg-gray-600 text-white
                ${isDragging ? 'opacity-50' : 'opacity-100'}`
            }
        >
            {value}
        </div>
    );
};

// Item component for DragOverlay
const Item = ({ value, isDragging, colorClass }) => {
    return (
        <div
            className={`px-4 py-2 rounded-lg shadow ${colorClass} text-white ${
                isDragging ? 'shadow-lg cursor-grabbing' : 'cursor-grab'
            }`}
        >
            {value}
        </div>
    );
};

// Droppable Blank component
const Blank = ({ id, questionId, blankIndex, filledAnswer }) => {
    const { setNodeRef} = useDroppable({
        id,
        data: { questionId, blankIndex },
    });
    return (
        <div
            ref={setNodeRef}
            className={`inline-block min-w-[100px] h-8 mb-2 border-b-2 border-gray-400 mx-2`}
        >
            {filledAnswer && (
                <div
                    className={`px-2 py-1.5 rounded-lg bg-gray-600 text-white`}
                >
                    {filledAnswer}
                </div>
            )}
        </div>
    );
};

// Main Quiz component
const FillInBlanksQuiz = ({ id, questions: rawQuestions, pointsMultiplier }) => {
    // Always assign fallback IDs
    const questions = rawQuestions.map((q, index) => ({
        ...q,
        id: `question-${index}`
    }));

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState(
        questions.map((q) => Array(q.correctAnswers.length).fill(null))
    );
    const [availableChoices, setAvailableChoices] = useState(
        questions.map((q) => [...q.choices])
    );
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isRetaking, setIsRetaking] = useState(false);
    const [storedAnswers, setStoredAnswers] = useState(null);
    const [storedScore, setStoredScore] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState(null);

    const { auth } = useAuth();
    const { setError } = useContext(ErrorContext);
    const { addSolvedChallenge, addPoints } = useContext(ChallengeContext);
    const baseURL = 'https://algoverse-backend-nodejs.onrender.com';


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
                        const rawAnswers = response.data.challengeAttempts?.[id]?.answers || [];
                        // Normalize storedAnswers to nested array
                        let normalizedAnswers = [];
                        let answerIndex = 0;
                        for (const q of questions) {
                            const numBlanks = q.correctAnswers.length;
                            const questionAnswers = rawAnswers.slice(answerIndex, answerIndex + numBlanks);
                            normalizedAnswers.push(questionAnswers);
                            answerIndex += numBlanks;
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
    }, [auth.currentUser]);

    // Sensors for accessibility
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag start
    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    // Handle drag end
    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        const activeId = active.id;
        const overId = over.id;

        // Handle sorting within available choices
        if (overId.startsWith('choice-')) {
            setAvailableChoices((prev) => {
                const newChoices = [...prev];
                const currentChoices = [...newChoices[currentQuestionIndex]];
                const oldIndex = currentChoices.indexOf(activeId);
                const newIndex = currentChoices.indexOf(overId);
                if (oldIndex !== -1 && newIndex !== -1) {
                    newChoices[currentQuestionIndex] = arrayMove(
                        currentChoices,
                        oldIndex,
                        newIndex
                    );
                }
                return newChoices;
            });
        }

        // Handle dropping into a blank
        if (overId.startsWith('blank-')) {
            const { blankIndex } = over.data.current;
            const answer = activeId;
            let existingAnswer;
            setAnswers((prev) => {
                const newAnswers = [...prev];
                const currentAnswers = [...newAnswers[currentQuestionIndex]];
                existingAnswer = currentAnswers[blankIndex];
                currentAnswers[blankIndex] = answer;
                newAnswers[currentQuestionIndex] = currentAnswers;
                return newAnswers;
            });

            setAvailableChoices((prev) => {
                const newChoices = [...prev];
                const currentChoices = [...newChoices[currentQuestionIndex]];
                if (existingAnswer && !currentChoices.includes(existingAnswer)) {
                    currentChoices.push(existingAnswer);
                }
                newChoices[currentQuestionIndex] = currentChoices.filter((c) => c !== answer);
                return newChoices;
            });
        }
    };

    // Reset current question
    const resetQuestion = () => {
        setAnswers((prev) => {
            const newAnswers = [...prev];
            newAnswers[currentQuestionIndex] = Array(questions[currentQuestionIndex].correctAnswers.length).fill(null);
            return newAnswers;
        });
        setAvailableChoices((prev) => {
            const newChoices = [...prev];
            newChoices[currentQuestionIndex] = [...questions[currentQuestionIndex].choices];
            return newChoices;
        });
    };

    // Navigate to next question
    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    // Navigate to previous question
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
                answers: answers.flat().map(a => a || ""),
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
            const sanitizedAnswers = answers.flat().map(a => a || "");
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
            setStoredAnswers(answers); // Store nested answers
            setStoredScore(score);
        } catch (err) {
            console.error("Error recording retry:", err);
            setError(err.response?.data?.error || "Failed to record retry.");
        }
    };

    // Calculate score
    const calculateScore = () => {
        return answers.reduce((score, questionAnswers, qIndex) => {
            const correctAnswers = questions[qIndex].correctAnswers;
            return score + questionAnswers.reduce((qScore, answer, aIndex) => {
                return answer === correctAnswers[aIndex] ? qScore + 1 : qScore;
            }, 0);
        }, 0);
    };

    // Reset quiz
    const handleReset = () => {
        setIsSubmitted(false);
        setAnswers(questions.map((q) => Array(q.correctAnswers.length).fill(null)));
        setAvailableChoices(questions.map((q) => [...q.choices]));
        setCurrentQuestionIndex(0);
        setIsRetaking(true);
    };

    // Render question text with blanks
    const renderQuestionText = () => {
        const currentQuestion = questions[currentQuestionIndex];
        const parts = currentQuestion.text.split('____');
        const currentAnswers = answers[currentQuestionIndex];
        return parts.map((part, index) => (
            <React.Fragment key={`${currentQuestion.id}-part-${index}`}>
                {part}
                {index < parts.length - 1 && (
                    <Blank
                        key={`${currentQuestion.id}-blank-${index}`}
                        id={`blank-${currentQuestion.id}-${index}`}
                        questionId={currentQuestion.id}
                        blankIndex={index}
                        filledAnswer={currentAnswers[index]}
                    />
                )}
            </React.Fragment>
        ));
    };

    // Get question-specific styling
    const getQuestionColor = () => {
        // Extract the numeric part from id (e.g., "question-0" -> 0)
        const questionIdNumber = parseInt(questions[currentQuestionIndex].id.split('-')[1], 10);
        return questionIdNumber % 2 === 0 ? 'bg-blue-400' : 'bg-green-400';
    };

    if (loading) return <p className="text-center">Loading...</p>;

    if (isSubmitted || (isCompleted && !isRetaking && !isSubmitted)) {
        const displayAnswers = isSubmitted ? answers : storedAnswers || answers;
        const displayScore = isSubmitted ? calculateScore() : storedScore !== null ? storedScore : calculateScore();
        const totalBlanks = questions.reduce((sum, q) => sum + q.correctAnswers.length, 0);

        return (
            <div className="max-w-3xl mx-auto p-6 rounded-xl flex flex-col justify-center">
                <div className="mt-20">
                    <div className="text-lg font-medium mb-10 text-center">
                        {isCompleted && !isSubmitted ? "Challenge Already Completed" : "Quiz Results"}
                    </div>
                    <div className="flex flex-col items-start w-full">
                        <div className="text-lg mb-4">
                            You scored {displayScore} out of {totalBlanks}!
                        </div>
                        {questions.map((q, qIndex) => {
                            // Validate displayAnswers[qIndex]
                            const questionAnswers = Array.isArray(displayAnswers[qIndex])
                                ? displayAnswers[qIndex]
                                : Array(q.correctAnswers.length).fill(null);
                            return (
                                <div key={q.id} className="mb-4 w-full">
                                    <div className="font-medium">
                                        {q.text.split('____').map((part, i) => (
                                            <React.Fragment key={`${q.id}-part-${i}`}>
                                                {part}
                                                {i < q.correctAnswers.length && (
                                                    <span
                                                        key={`${q.id}-answer-${i}`}
                                                        className="inline-block min-w-[100px] mx-2"
                                                    >
                                                        {questionAnswers[i] || "Not answered"}
                                                        {questionAnswers[i] && (
                                                            <span
                                                                key={`${q.id}-status-${i}`}
                                                                className={
                                                                    questionAnswers[i] === q.correctAnswers[i]
                                                                        ? "text-green-500"
                                                                        : "text-red-500"
                                                                }
                                                            >
                                                                {" "}
                                                                ({questionAnswers[i] === q.correctAnswers[i] ? "Correct" : "Incorrect"})
                                                            </span>
                                                        )}
                                                    </span>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                    {Array.isArray(questionAnswers) && questionAnswers.some((answer, i) => answer !== q.correctAnswers[i]) && (
                                        <div>
                                            Correct answers: {q.correctAnswers.join(", ")}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
    const allBlanksFilled = answers[currentQuestionIndex].every((answer) => answer !== null);

    return (
        <div className="max-w-3xl mx-auto p-6 rounded-xl flex flex-col justify-center">
            <div>
                <div
                    className={`mb-4 p-2 rounded-lg ${getQuestionColor().replace(
                        '400',
                        '200'
                    )} border-l-4 ${getQuestionColor()} border-opacity-75`}
                >
                    <h1 className="text-2xl font-bold text-center text-gray-800">
                        Fill in the Blanks Quiz
                    </h1>
                </div>
                <p className="mb-2 text-center dark:text-neutral-content/80 light:text-black">
                    Question {currentQuestionIndex + 1} of {questions.length}
                </p>
                <p className="mb-6 text-center dark:text-neutral-content/80 light:text-black/75 font-medium">
                    Drag the correct answers to fill in the blanks
                </p>

                <div className="mb-8 p-4 rounded-lg">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="text-lg mb-4 text-center flex items-center justify-center">{renderQuestionText()}</div>
                        <SortableContext
                            items={availableChoices[currentQuestionIndex]}
                            strategy={horizontalListSortingStrategy}
                        >
                            <div className="flex gap-4 min-h-20 justify-center items-end">
                                {availableChoices[currentQuestionIndex].map((choice, index) => (
                                    <SortableItem
                                        key={`${choice}-${index}`}
                                        id={choice}
                                        value={choice}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                        <DragOverlay>
                            {activeId ? (
                                <Item
                                    id={activeId}
                                    value={activeId}
                                    isDragging
                                    colorClass={getQuestionColor()}
                                />
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>

                <div className="flex justify-between mb-6">
                    <button
                        onClick={prevQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="btn bg-gray-600 rounded-lg"
                    >
                        Previous
                    </button>
                    <div className="flex gap-4">
                        <button
                            onClick={resetQuestion}
                            className="btn rounded-lg btn-error shadow-lg"
                        >
                            Reset
                        </button>
                    </div>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={!allBlanksFilled}
                            className="btn rounded-lg btn-success shadow-lg"
                        >
                            Submit
                        </button>
                    ) : (
                        <button
                            onClick={nextQuestion}
                            disabled={currentQuestionIndex === questions.length - 1 || !allBlanksFilled}
                            className="btn bg-gray-600 rounded-lg"
                        >
                            Next
                        </button>
                    )}

                </div>
            </div>
        </div>
    );
};

FillInBlanksQuiz.propTypes = {
    id: PropTypes.string.isRequired,
    questions: PropTypes.arrayOf(
        PropTypes.shape({
            text: PropTypes.string.isRequired,
            choices: PropTypes.arrayOf(PropTypes.string).isRequired,
            correctAnswers: PropTypes.arrayOf(PropTypes.string).isRequired,
            explanation: PropTypes.string.isRequired,
        })
    ).isRequired,
    pointsMultiplier: PropTypes.number.isRequired,
};

SortableItem.propTypes = {
    id: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
};

Blank.propTypes = {
    id: PropTypes.string.isRequired,
    questionId: PropTypes.string.isRequired,
    blankIndex: PropTypes.number.isRequired,
    filledAnswer: PropTypes.string,
};

Item.propTypes = {
    value: PropTypes.string.isRequired,
    isDragging: PropTypes.bool.isRequired,
    colorClass: PropTypes.string.isRequired,
};

export default FillInBlanksQuiz;