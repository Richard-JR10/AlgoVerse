import  { useState } from 'react';

const MultipleChoices = () => {
    const questions = [
        {
            question: 'What is the main idea behind Bubble Sort?',
            answer: 'b',
            choices: [
                'a) Divide the list into two halves and sort them separately',
                'b) Repeatedly swap adjacent elements if they are in the wrong order',
                'c) Select the smallest element and place it at the start',
                'd) Randomly shuffle elements until sorted',
            ],
        },
        {
            question: 'How many passes does Bubble Sort make in a list of 5 elements (worst case)?',
            answer: 'b',
            choices: ['a) 3', 'b) 4', 'c) 5', 'd) 6'],
        },
        {
            question: 'What happens in each pass of Bubble Sort?',
            answer: 'a',
            choices: [
                'a) The largest unsorted element moves to its correct position',
                'b) The smallest element is selected and swapped',
                'c) The entire list is reversed',
                'd) The list is split into smaller parts',
            ],
        },
        {
            question: 'What is the time complexity of Bubble Sort in the worst case?',
            answer: 'c',
            choices: ['a) O(n)', 'b) O(n log n)', 'c) O(n²)', 'd) O(log n)'],
        },
        {
            question: 'When is Bubble Sort most efficient?',
            answer: 'b',
            choices: [
                'a) When the list is very large',
                'b) When the list is already sorted',
                'c) When the list is randomly ordered',
                'd) When the list is sorted in reverse',
            ],
        },
    ];

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState(Array(questions.length).fill(null));
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { question, choices, answer } = questions[currentQuestionIndex];

    const handleAnswerSelect = (choice) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = choice;
        setAnswers(newAnswers);
    };

    const handleNextQuestion = () => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
    };

    const handleSubmit = () => {
        setIsSubmitted(true);
    };

    const calculateScore = () => {
        return answers.reduce((score, answer, index) => {
            if (!answer) return score;
            const choiceLetter = answer.split(')')[0];
            return choiceLetter === questions[index].answer ? score + 1 : score;
        }, 0);
    };

    if (isSubmitted) {
        const score = calculateScore();
        return (
            <div className="flex flex-col items-center min-h-screen">
                <div className="text-lg font-medium mt-20 mb-10">Quiz Results</div>
                <div className="flex flex-col items-start min-h-screen w-full max-w-md">
                    <div className="text-lg mb-4">
                        You scored {score} out of {questions.length}!
                    </div>
                    {questions.map((q, index) => (
                        <div key={index} className="mb-4">
                            <div className="font-medium">{q.question}</div>
                            <div>
                                Your answer: {answers[index] || 'Not answered'}
                                {answers[index] && (
                                    <span
                                        className={
                                            answers[index].split(')')[0] === q.answer
                                                ? 'text-green-500'
                                                : 'text-red-500'
                                        }
                                    >
                    {' '}
                                        ({answers[index].split(')')[0] === q.answer ? 'Correct' : 'Incorrect'})
                  </span>
                                )}
                            </div>
                            {!answers[index] || answers[index].split(')')[0] !== q.answer ? (
                                <div>Correct answer: {q.choices.find(c => c.startsWith(q.answer))}</div>
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center ">
            <div className="text-lg font-medium mt-20 mb-10">{question}</div>
            <div className="flex flex-col items-start">
                {choices.map((choice, index) => (
                    <input
                        key={index}
                        className="btn w-full justify-start items-center"
                        type="radio"
                        name="choices"
                        aria-label={choice}
                        value={choice}
                        checked={answers[currentQuestionIndex] === choice}
                        onChange={() => handleAnswerSelect(choice)}
                    />
                ))}
                {currentQuestionIndex < questions.length - 1 ? (
                    <button
                        className="btn btn-primary w-full mt-2"
                        onClick={handleNextQuestion}
                        disabled={!answers[currentQuestionIndex]}
                    >
                        Next
                    </button>
                ) : (
                    <button
                        className="btn btn-primary w-full mt-2"
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