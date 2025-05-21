import { useState, useEffect, useContext } from "react";
import { useAuth } from "../../Auth/AuthContext.jsx";
import axios from "axios";
import { ErrorContext } from "../../context/errorContext.jsx";
import PropTypes from "prop-types";
import { ChallengeContext } from "./ChallengeContext.jsx";

const MultipleChoices = ({ id, questions, pointsMultiplier }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState(Array(questions.length).fill(null));
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isRetaking, setIsRetaking] = useState(false);
    const [storedAnswers, setStoredAnswers] = useState(null);
    const [storedScore, setStoredScore] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const { question, choices } = questions[currentQuestionIndex];
    const { setError } = useContext(ErrorContext);
    const { auth } = useAuth();
    const { addSolvedChallenge, addPoints } = useContext(ChallengeContext);
    const baseURL = "https://algoverse-backend-nodejs.onrender.com";

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
                        setStoredAnswers(response.data.challengeAttempts?.[id]?.answers || []);
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

    const handleAnswerSelect = (choice) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = choice;
        setAnswers(newAnswers);
    };

    const handleNextQuestion = () => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleCompleteChallenge = async (totalPoints, answers, score) => {
        if (!auth.currentUser) {
            setError("You must be logged in to complete a challenge.");
            return;
        }
        try {
            const token = await auth.currentUser.getIdToken();
            await axios.post(
                `${baseURL}/api/completeChallenge`,
                { challengeId: id, points: totalPoints, answers, score },
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

    const handleRecordRetry = async (answers, score) => {
        if (!auth.currentUser) {
            setError("You must be logged in to retry a challenge.");
            return;
        }
        try {
            const token = await auth.currentUser.getIdToken();
            await axios.post(
                `${baseURL}/api/recordRetry`,
                { challengeId: id, answers, score },
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

    const handleReset = () => {
        setIsSubmitted(false);
        setAnswers(Array(questions.length).fill(null));
        setCurrentQuestionIndex(0);
        setIsRetaking(true);
    };

    const calculateScore = () => {
        return answers.reduce((score, answer, index) => {
            if (!answer) return score;
            const choiceLetter = answer.split(")")[0];
            return choiceLetter === questions[index].answer ? score + 1 : score;
        }, 0);
    };

    if (loading) {
        return <p className="text-center">Loading...</p>;
    }

    if (isSubmitted || (isCompleted && !isRetaking && !isSubmitted)) {
        const displayAnswers = isSubmitted ? answers : storedAnswers || answers;
        const displayScore = isSubmitted ? calculateScore() : storedScore !== null ? storedScore : calculateScore();
        return (
            <div className="flex flex-col items-center">
                <div className="text-lg font-medium mt-20 mb-10">
                    {isCompleted && !isSubmitted ? "Challenge Already Completed" : "Quiz Results"}
                </div>
                <div className="flex flex-col items-start w-full max-w-md">
                    <div className="text-lg mb-4">
                        You scored {displayScore} out of {questions.length}!
                    </div>
                    {questions.map((q, index) => (
                        <div key={index} className="mb-4">
                            <div className="font-medium">{q.question}</div>
                            <div>
                                Your answer: {displayAnswers[index] || "Not answered"}
                                {displayAnswers[index] && (
                                    <span
                                        className={
                                            displayAnswers[index].split(")")[0] === q.answer
                                                ? "text-green-500"
                                                : "text-red-500"
                                        }
                                    >
                                        {" "}
                                        ({displayAnswers[index].split(")")[0] === q.answer ? "Correct" : "Incorrect"})
                                    </span>
                                )}
                            </div>
                            {!displayAnswers[index] || displayAnswers[index].split(")")[0] !== q.answer ? (
                                <div>Correct answer: {q.choices.find((c) => c.startsWith(q.answer))}</div>
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

    return (
        <div className="flex flex-col items-center">
            <div className="text-lg font-medium mt-20 mb-10">{question}</div>
            <div className="flex flex-col items-start gap-1">
                {choices.map((choice, index) => (
                    <input
                        key={index}
                        className="btn w-full h-fit p-3 justify-start items-center"
                        type="radio"
                        name="choices"
                        aria-label={choice}
                        value={choice}
                        checked={answers[currentQuestionIndex] === choice}
                        onChange={() => handleAnswerSelect(choice)}
                    />
                ))}
                <button
                    className="btn bg-gray-600 w-full mt-2"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                >
                    Previous
                </button>
                {currentQuestionIndex < questions.length - 1 ? (
                    <button
                        className="btn bg-gray-600 w-full mt-2"
                        onClick={handleNextQuestion}
                        disabled={!answers[currentQuestionIndex]}
                    >
                        Next
                    </button>
                ) : (
                    <button
                        className="btn btn-success w-full mt-2"
                        onClick={handleSubmit}
                        disabled={!answers[currentQuestionIndex]}
                    >
                        Submit
                    </button>
                )}
            </div>
        </div>
    );
};

export default MultipleChoices;

MultipleChoices.propTypes = {
    id: PropTypes.string.isRequired,
    questions: PropTypes.arrayOf(
        PropTypes.shape({
            question: PropTypes.string.isRequired,
            choices: PropTypes.arrayOf(PropTypes.string).isRequired,
            answer: PropTypes.string.isRequired,
        })
    ).isRequired,
    pointsMultiplier: PropTypes.number.isRequired,
};