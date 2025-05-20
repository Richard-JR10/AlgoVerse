import React, { useState } from 'react';
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

// Sample questions data with multiple blanks
const questions = [
    {
        id: '4LCF7qzdJu8VT8wZECf1',
        text: 'The capital of ____ is ____.',
        correctAnswers: ['France', 'Paris'],
        choices: ['France', 'Paris', 'Germany', 'Berlin', 'Spain', 'Madrid'],
        explanation: 'France is a country in Europe, and Paris is its capital city, known for landmarks like te Eiffel Tower.',
    },
    {
        id: '4LCF7qzdJu8VT8wZEss8',
        text: 'The largest planet is ____, and the smallest is ____.',
        correctAnswers: ['Jupiter', 'Mercury'],
        choices: ['Jupiter', 'Mercury', 'Mars', 'Venus', 'Earth'],
        explanation: 'Jupiter is the largest planet in our solar system with a diameter of about 139,820 km, while Mercury is the smallest with a diameter of about 4,880 km.',
    },
];

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
            className={`px-4 py-2 rounded-lg shadow cursor-grab bg-gray-600
                ${isDragging ? 'opacity-50' : 'opacity-100'}`
            }
        >
            {value}
        </div>
    );
};

// Item component for DragOverlay (styled like SortingArrangement.jsx)
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
    const { setNodeRef, isOver } = useDroppable({
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
                    className={`px-2 py-1.5 rounded-lg bg-gray-600`}
                >
                    {filledAnswer}
                </div>
            )}
        </div>
    );
};

// Main Quiz component
const FillInBlanksQuiz = ({questions}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const currentQuestion = questions[currentQuestionIndex];
    const [quizState, setQuizState] = useState(
        questions.map((q) => ({
            id: q.id,
            filledAnswers: Array(q.correctAnswers.length).fill(null),
            isCorrect: Array(q.correctAnswers.length).fill(null),
            availableChoices: [...q.choices],
        }))
    );
    const [activeId, setActiveId] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

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
            setQuizState((prev) => {
                const newState = [...prev];
                const question = newState[currentQuestionIndex];
                const oldIndex = question.availableChoices.indexOf(activeId);
                const newIndex = question.availableChoices.indexOf(overId);
                if (oldIndex !== -1 && newIndex !== -1) {
                    question.availableChoices = arrayMove(
                        question.availableChoices,
                        oldIndex,
                        newIndex
                    );
                }
                return newState;
            });
        }

        // Handle dropping into a blank
        if (overId.startsWith('blank-')) {
            const { questionId, blankIndex } = over.data.current;
            const answer = activeId;

            setQuizState((prev) => {
                const newState = [...prev];
                const question = newState.find((q) => q.id === questionId);
                if (!question) return prev;

                const newFilledAnswers = [...question.filledAnswers];
                const newIsCorrect = [...question.isCorrect];
                const newAvailableChoices = [...question.availableChoices];

                // If the blank already has an answer, return it to available choices
                const existingAnswer = newFilledAnswers[blankIndex];
                if (existingAnswer && !newAvailableChoices.includes(existingAnswer)) {
                    newAvailableChoices.push(existingAnswer);
                }

                // Place the new answer
                newFilledAnswers[blankIndex] = answer;
                newIsCorrect[blankIndex] =
                    questions.find((ques) => ques.id === questionId).correctAnswers[blankIndex] ===
                    answer;

                // Remove the dropped answer from available choices
                return newState.map((q) =>
                    q.id === questionId
                        ? {
                            ...q,
                            filledAnswers: newFilledAnswers,
                            isCorrect: newIsCorrect,
                            availableChoices: newAvailableChoices.filter((c) => c !== answer),
                        }
                        : q
                );
            });
        }
    };

    // Check answer
    const checkAnswer = () => {
        const state = quizState[currentQuestionIndex];
        if (state.filledAnswers.every((answer) => answer !== null)) {
            setShowExplanation(true);
        }
    };

    // Reset current question
    const resetQuestion = () => {
        setQuizState((prev) =>
            prev.map((q) =>
                q.id === currentQuestion.id
                    ? {
                        ...q,
                        filledAnswers: Array(currentQuestion.correctAnswers.length).fill(null),
                        isCorrect: Array(currentQuestion.correctAnswers.length).fill(null),
                        availableChoices: [...currentQuestion.choices],
                    }
                    : q
            )
        );
        setShowExplanation(false);
    };

    // Navigate to next question
    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setShowExplanation(false);
        }
    };

    // Navigate to previous question
    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setShowExplanation(false);
        }
    };

    // Get question-specific styling with brighter colors
    const getQuestionColor = () => {
        return currentQuestion.id % 2 === 0 ? 'bg-blue-400' : 'bg-green-400';
    };

    // Render question text with multiple blanks
    const renderQuestionText = () => {
        const parts = currentQuestion.text.split('____');
        const state = quizState[currentQuestionIndex];
        return parts.map((part, index) => (
            <React.Fragment key={index}>
                {part}
                {index < parts.length - 1 && (
                    <Blank
                        id={`blank-${currentQuestion.id}-${index}`}
                        questionId={currentQuestion.id}
                        blankIndex={index}
                        filledAnswer={state.filledAnswers[index]}
                    />
                )}
            </React.Fragment>
        ));
    };

    // Check if all blanks are filled correctly
    const allCorrect =
        quizState[currentQuestionIndex].isCorrect.every((correct) => correct === true) &&
        quizState[currentQuestionIndex].filledAnswers.every((answer) => answer !== null);

    return (
        <div className="max-w-3xl mx-auto p-6 rounded-xl flex flex-col justify-center">
            <div className="mt-20">
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
                <p className="mb-2 text-center text-neutral-content/80">
                    Question {currentQuestionIndex + 1} of {questions.length}
                </p>
                <p className="mb-6 text-center text-neutral-content/80 font-medium">
                    Drag the correct answers to fill in the blanks
                </p>

                <div className="mb-8 p-4 rounded-lg shadow-inner">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <p className="text-lg mb-4 text-center flex items-center justify-center">{renderQuestionText()}</p>
                        <SortableContext
                            items={quizState[currentQuestionIndex].availableChoices}
                            strategy={horizontalListSortingStrategy}
                        >
                            <div className="flex gap-4 min-h-20 justify-center items-end">
                                {quizState[currentQuestionIndex].availableChoices.map((choice) => {
                                    const choiceIndex = quizState[currentQuestionIndex].filledAnswers.indexOf(choice);
                                    return (
                                        <SortableItem
                                            key={choice}
                                            id={choice}
                                            value={choice}
                                        />
                                    );
                                })}
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
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <div className="flex gap-4">
                        <button
                            onClick={resetQuestion}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                        >
                            Reset
                        </button>
                        <button
                            onClick={checkAnswer}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Check Answer
                        </button>
                    </div>
                    <button
                        onClick={nextQuestion}
                        disabled={currentQuestionIndex === questions.length - 1}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>

                {showExplanation && (
                    <div
                        className={`mt-4 p-4 rounded-lg ${
                            allCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        } shadow-inner`}
                    >
                        <p className="font-bold text-center text-lg">
                            {allCorrect ? '✅ Correct!' : '❌ Incorrect! Try again.'}
                        </p>
                    </div>
                )}

                {showExplanation && (
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg shadow-inner">
                        <h3 className="font-bold mb-3 text-lg text-gray-800">Explanation:</h3>
                        <p className="mb-3 text-gray-700">{currentQuestion.explanation}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded-md">
                                <p className="font-semibold mb-1">Available Choices:</p>
                                <div className="flex gap-2">
                                    {currentQuestion.choices.map((choice, i) => (
                                        <span key={`choice-${i}`} className="font-mono">
                                            {choice}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-md">
                                <p className="font-semibold mb-1">Correct Answers:</p>
                                <div className="flex gap-2">
                                    {currentQuestion.correctAnswers.map((answer, i) => (
                                        <span key={`answer-${i}`} className="font-mono">
                                            {answer}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FillInBlanksQuiz;