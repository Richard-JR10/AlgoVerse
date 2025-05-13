// SortingArrangement.jsx
import { useState } from 'react';
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
    arrayMove, horizontalListSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem.jsx';
import { Item } from './Item.jsx';

const ALGORITHMS = {
    BUBBLE: 'bubble sort',
    QUICK: 'quick sort',
    MERGE: 'merge sort',
    INSERTION: 'insertion sort',
    SELECTION: 'selection sort'
};

const questions = [
    {
        id: 1,
        algorithm: ALGORITHMS.BUBBLE,
        initialArray: [7, 3, 9, 2, 5],
        expectedArray: [3, 7, 2, 5, 9],
        explanation: 'Bubble sort repeatedly swaps adjacent elements if they are in wrong order. After first pass, the largest element (9) bubbles to the end.',
        stepDescription: 'Show the array after the first complete pass'
    },
    {
        id: 2,
        algorithm: ALGORITHMS.QUICK,
        initialArray: [8, 4, 6, 2, 5],
        expectedArray: [5, 4, 6, 2, 8], // After first partition with pivot=8
        explanation: 'Quick sort selects a pivot and partitions the array. After first partition with pivot=8, elements are rearranged around the pivot.',
        stepDescription: 'Show the array after the first partition (pivot=8)'
    },
    {
        id: 3,
        algorithm: ALGORITHMS.MERGE,
        initialArray: [5, 1, 4, 2, 8],
        expectedArray: [1, 5, 2, 4, 8], // After first merge of pairs
        explanation: 'Merge sort divides the array and merges sorted halves. This shows the array after merging adjacent pairs.',
        stepDescription: 'Show the array after merging adjacent pairs'
    },
    {
        id: 4,
        algorithm: ALGORITHMS.INSERTION,
        initialArray: [6, 3, 8, 1, 5],
        expectedArray: [3, 6, 8, 1, 5], // After first insertion
        explanation: 'Insertion sort builds the final array one item at a time. This shows the array after inserting the second element.',
        stepDescription: 'Show the array after the first insertion step'
    },
    {
        id: 5,
        algorithm: ALGORITHMS.SELECTION,
        initialArray: [7, 2, 9, 4, 1],
        expectedArray: [1, 2, 9, 4, 7], // After first selection and swap
        explanation: 'Selection sort repeatedly finds the minimum element. This shows the array after the first swap with the minimum element.',
        stepDescription: 'Show the array after the first selection and swap'
    }
];


const SortingArrangement = () => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const currentQuestion = questions[currentQuestionIndex];

    // State
    const [items, setItems] = useState([...currentQuestion.initialArray]);
    const [activeId, setActiveId] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

    // Sensors for different input methods
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Drag start handler
    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    // Drag end handler
    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // Check if the current arrangement matches the expected result
    const checkAnswer = () => {
        const correct = JSON.stringify(items) === JSON.stringify(currentQuestion.expectedArray);
        setIsCorrect(correct);
        setShowExplanation(true);
    };

    // Reset the current question
    const resetQuestion = () => {
        setItems([...currentQuestion.initialArray]);
        setIsCorrect(null);
        setShowExplanation(false);
    };

    // Move to next question
    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setItems([...questions[currentQuestionIndex + 1].initialArray]);
            setIsCorrect(null);
            setShowExplanation(false);
        }
    };

    // Move to previous question
    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setItems([...questions[currentQuestionIndex - 1].initialArray]);
            setIsCorrect(null);
            setShowExplanation(false);
        }
    };

    // Get algorithm-specific styling
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

    return (
        <div className="max-w-3xl mx-auto p-6 rounded-xl flex flex-col justify-center">
            <div className="mt-20">
                <div className={`mb-4 p-2 rounded-lg ${getAlgorithmColor().replace('500', '100')} border-l-4 ${getAlgorithmColor()} border-opacity-75`}>
                    <h1 className="text-2xl font-bold text-center text-gray-800">
                        {currentQuestion.algorithm.toUpperCase()} Visualization
                    </h1>
                </div>
                <p className="mb-2 text-center text-neutral-content/80">
                    Question {currentQuestionIndex + 1} of {questions.length}
                </p>
                <p className="mb-6 text-center text-neutral-content/80 font-medium">
                    {currentQuestion.stepDescription}
                </p>

                <div className="mb-8 bg-white p-4 rounded-lg shadow-inner">
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

                {isCorrect !== null && (
                    <div className={`mt-4 p-4 rounded-lg ${
                        isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    } shadow-inner`}>
                        <p className="font-bold text-center text-lg">
                            {isCorrect ? '✅ Correct!' : '❌ Incorrect! Try again.'}
                        </p>
                    </div>
                )}

                {showExplanation && (
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg shadow-inner">
                        <h3 className="font-bold mb-3 text-lg text-gray-800">Explanation:</h3>
                        <p className="mb-3 text-gray-700">{currentQuestion.explanation}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded-md">
                                <p className="font-semibold mb-1">Original array:</p>
                                <div className="flex gap-2">
                                    {currentQuestion.initialArray.map((num, i) => (
                                        <span key={`orig-${i}`} className="font-mono">{num}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-md">
                                <p className="font-semibold mb-1">Expected after first pass:</p>
                                <div className="flex gap-2">
                                    {currentQuestion.expectedArray.map((num, i) => (
                                        <span key={`expected-${i}`} className="font-mono">{num}</span>
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

export default SortingArrangement;