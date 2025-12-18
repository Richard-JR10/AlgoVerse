import { useState } from 'react';
import PropTypes from 'prop-types';

const ChallengesAddData = ({ onAddData }) => {
    const [challengeType, setChallengeType] = useState(null);
    const [category, setCategory] = useState('Sorting');
    const [difficulty, setDifficulty] = useState('Easy');
    const [title, setTitle] = useState('');
    const [instruction, setInstruction] = useState(''); // For type 4 only
    const [questionEntries, setQuestionEntries] = useState([
        {
            question: '',
            answer: '',
            choices: ['', '', '', ''],
            algorithm: '',
            initialArray: '',
            expectedArray: '',
            stepDescription: '',
            explanation: '',
            text: '',
            correctAnswers: ['', ''],
            left: '',
            right: '',
        },
    ]);

    const handleTypeChange = (e) => {
        const typeMap = {
            'Multiple Choices': 1,
            'Sorting Arrangement': 2,
            'Fill In The Blanks': 3,
            'Matching Type': 4,
        };
        setChallengeType(typeMap[e.target.value]);
        setInstruction(''); // Reset instruction when type changes
        // Reset question entries when type changes
        setQuestionEntries([
            {
                question: '',
                answer: '',
                choices: ['', '', '', ''],
                algorithm: '',
                initialArray: '',
                expectedArray: '',
                stepDescription: '',
                explanation: '',
                text: '',
                correctAnswers: ['', ''],
                left: '',
                right: '',
            },
        ]);
    };

    const handleDifficultyChange = (e) => {
        setDifficulty(e.target.value);
    };

    const handleCategoryChange = (e) => {
        setCategory(e.target.value);
    }

    const handleTitleChange = (e) => {
        setTitle(e.target.value);
    };

    const handleInstructionChange = (e) => {
        setInstruction(e.target.value);
    };

    const handleInputChange = (index, e) => {
        const { name, value } = e.target;
        const updatedEntries = [...questionEntries];
        updatedEntries[index] = { ...updatedEntries[index], [name]: value };

        if (challengeType === 3 && name === 'text') {
            const blankCount = countBlanks(value);
            const currentAnswers = updatedEntries[index].correctAnswers || [];
            const newAnswers = Array(blankCount).fill('');
            for (let i = 0; i < Math.min(blankCount, currentAnswers.length); i++) {
                newAnswers[i] = currentAnswers[i] || '';
            }
            updatedEntries[index].correctAnswers = newAnswers;
        }

        setQuestionEntries(updatedEntries);
    };

    const handleArrayChange = (index, e, field) => {
        const value = e.target.value.split(',').map((item) => item.trim());
        const updatedEntries = [...questionEntries];
        updatedEntries[index] = { ...updatedEntries[index], [field]: value };
        setQuestionEntries(updatedEntries);
    };

    const handleChoicesChange = (index, choiceIndex, value) => {
        const updatedEntries = [...questionEntries];
        const updatedChoices = [...updatedEntries[index].choices];
        updatedChoices[choiceIndex] = value;
        updatedEntries[index] = { ...updatedEntries[index], choices: updatedChoices };
        setQuestionEntries(updatedEntries);
    };

    const handleCorrectAnswersChange = (index, answerIndex, value) => {
        const updatedEntries = [...questionEntries];
        const updatedAnswers = [...updatedEntries[index].correctAnswers];
        updatedAnswers[answerIndex] = value;
        updatedEntries[index] = { ...updatedEntries[index], correctAnswers: updatedAnswers };
        setQuestionEntries(updatedEntries);
    };

    const handleAddQuestion = () => {
        setQuestionEntries([
            ...questionEntries,
            {
                question: '',
                answer: '',
                choices: ['', '', '', ''],
                algorithm: '',
                initialArray: '',
                expectedArray: '',
                stepDescription: '',
                explanation: '',
                text: '',
                correctAnswers: ['', ''],
                left: '',
                right: '',
            },
        ]);
    };

    const handleRemoveQuestion = (index) => {
        setQuestionEntries(questionEntries.filter((_, i) => i !== index));
    };

    const handleClose = () => {
        setTimeout(() => {
            setDifficulty('Easy');
            setCategory('Sorting');
            setTitle('');
            setInstruction('');
            setQuestionEntries([
                {
                    question: '',
                    answer: '',
                    choices: ['', '', '', ''],
                    algorithm: '',
                    initialArray: '',
                    expectedArray: '',
                    stepDescription: '',
                    explanation: '',
                    text: '',
                    correctAnswers: ['', ''],
                    left: '',
                    right: '',
                },
            ]);
        }, 200);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const questions = questionEntries.map((entry) => {
            let result = {};
            if (challengeType === 1) {
                result = {
                    question: entry.question,
                    answer: entry.answer,
                    choices: entry.choices,
                };
            } else if (challengeType === 2) {
                result = {
                    algorithm: entry.algorithm,
                    initialArray: entry.initialArray,
                    expectedArray: entry.expectedArray,
                    stepDescription: entry.stepDescription,
                    explanation: entry.explanation,
                };
            } else if (challengeType === 3) {
                result = {
                    text: entry.text,
                    correctAnswers: entry.correctAnswers,
                    choices: entry.choices,
                    explanation: entry.explanation,
                };
            } else if (challengeType === 4) {
                result = {
                    left: entry.left,
                    right: entry.right,
                };
            }
            return result;
        });

        // Build data object, only include instruction for type 4
        const dataToSubmit = {
            title,
            category,
            questions,
            type: challengeType,
            difficulty,
            ...(challengeType === 4 && { instruction }) // Only add instruction for type 4
        };

        onAddData(dataToSubmit);
        document.getElementById('my_modal_3').close();
        handleClose();
    };

    const preventEnterKey = (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
        }
    };

    const countBlanks = (text) => {
        const matches = text.match(/____/g);
        return matches ? matches.length : 0;
    };

    return (
        <div>
            <div className="join">
                <select defaultValue="Pick a Type" className="select join-item" onChange={handleTypeChange}>
                    <option disabled>
                        Pick a Type
                    </option>
                    <option>Multiple Choices</option>
                    <option>Sorting Arrangement</option>
                    <option>Fill In The Blanks</option>
                    <option>Matching Type</option>
                </select>
                <button
                    className="btn btn-primary join-item gap-2"
                    onClick={() => document.getElementById('my_modal_3').showModal()}
                    disabled={!challengeType}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="currentColor"
                            d="M18 10h-4V6a2 2 0 0 0-4 0l.071 4H6a2 2 0 0 0 0 4l4.071-.071L10 18a2 2 0 0 0 4 0v-4.071L18 14a2 2 0 0 0 0-4"
                        />
                    </svg>
                    Add Data
                </button>
            </div>
            <dialog id="my_modal_3" className="modal">
                <div className="modal-box max-h-[80vh] overflow-y-auto hide-scrollbar">
                    <form method="dialog">
                        <button
                            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                            onClick={handleClose}
                            onKeyDown={preventEnterKey}
                        >
                            ✕
                        </button>
                    </form>
                    <form onSubmit={handleSubmit}>
                        <h3 className="font-bold text-lg">Add Challenge</h3>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Title</legend>
                            <input
                                required
                                value={title}
                                type="text"
                                className="input w-full"
                                placeholder="Enter challenge title"
                                onChange={handleTitleChange}
                                onKeyDown={preventEnterKey}
                            />
                            {challengeType === 4 && (
                                <>
                                    <legend className="fieldset-legend">Instruction</legend>
                                    <input
                                        required
                                        value={instruction}
                                        type="text"
                                        className="input w-full"
                                        placeholder="Enter matching instructions (e.g., Match algorithms with their time complexities)"
                                        onChange={handleInstructionChange}
                                        onKeyDown={preventEnterKey}
                                    />
                                </>
                            )}
                            <legend className="fieldset-legend">Difficulty</legend>
                            <select
                                value={difficulty}
                                className="select w-full"
                                onChange={handleDifficultyChange}
                            >
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                            </select>
                            <legend className="fieldset-legend">Category</legend>
                            <select
                                value={category}
                                className="select w-full"
                                onChange={handleCategoryChange}
                            >
                                <option>Sorting</option>
                                <option>Search</option>
                                <option>Graph Traversal</option>
                                <option>Recursion</option>
                            </select>
                            {questionEntries.map((entry, index) => (
                                <div key={index}>
                                    <div className="flex flex-row justify-between items-center mt-2">
                                        <legend className="fieldset-legend pt-0">
                                            {challengeType === 4 ? `Pair ${index + 1}` : `Question ${index + 1}`}
                                        </legend>
                                        {index === 0 ? (
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-square"
                                                onClick={handleAddQuestion}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        fill="currentColor"
                                                        d="M18 10h-4V6a2 2 0 0 0-4 0l.071 4H6a2 2 0 0 0 0 4l4.071-.071L10 18a2 2 0 0 0 4 0v-4.071L18 14a2 2 0 0 0 0-4"
                                                    />
                                                </svg>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn btn-error btn-square"
                                                onClick={() => handleRemoveQuestion(index)}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="24px"
                                                    height="24px"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
                                                    />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    {challengeType === 1 && (
                                        <>
                                            <legend className="fieldset-legend">Question</legend>
                                            <input
                                                required
                                                name="question"
                                                value={entry.question}
                                                type="text"
                                                className="input w-full"
                                                placeholder="Enter question"
                                                onChange={(e) => handleInputChange(index, e)}
                                                onKeyDown={preventEnterKey}
                                            />
                                            <legend className="fieldset-legend">Answer</legend>
                                            <input
                                                required
                                                name="answer"
                                                value={entry.answer}
                                                type="text"
                                                className="input w-full"
                                                placeholder="Enter correct answer (e.g., 'b')"
                                                onChange={(e) => handleInputChange(index, e)}
                                                onKeyDown={preventEnterKey}
                                            />
                                            <legend className="fieldset-legend">Choices</legend>
                                            {entry.choices.map((choice, choiceIndex) => (
                                                <input
                                                    required
                                                    key={choiceIndex}
                                                    type="text"
                                                    className="input w-full mt-1.5"
                                                    placeholder={`Choice ${choiceIndex + 1} (e.g., 'a) Option text')`}
                                                    value={choice}
                                                    onChange={(e) => handleChoicesChange(index, choiceIndex, e.target.value)}
                                                    onKeyDown={preventEnterKey}
                                                />
                                            ))}
                                        </>
                                    )}
                                    {challengeType === 2 && (
                                        <>
                                            <legend className="fieldset-legend">Algorithm</legend>
                                            <input
                                                required
                                                name="algorithm"
                                                value={entry.algorithm}
                                                type="text"
                                                className="input w-full"
                                                placeholder="Enter algorithm (e.g., ALGORITHMS.BUBBLE)"
                                                onChange={(e) => handleInputChange(index, e)}
                                                onKeyDown={preventEnterKey}
                                            />
                                            <legend className="fieldset-legend">Initial Array</legend>
                                            <input
                                                required
                                                name="initialArray"
                                                value={entry.initialArray}
                                                type="text"
                                                className="input w-full"
                                                placeholder="Enter initial array (e.g., 7,3,9,2,5)"
                                                onChange={(e) => handleArrayChange(index, e, 'initialArray')}
                                                onKeyDown={preventEnterKey}
                                            />
                                            <legend className="fieldset-legend">Expected Array</legend>
                                            <input
                                                required
                                                name="expectedArray"
                                                value={entry.expectedArray}
                                                type="text"
                                                className="input w-full"
                                                placeholder="Enter expected array (e.g., 3,7,2,5,9)"
                                                onChange={(e) => handleArrayChange(index, e, 'expectedArray')}
                                                onKeyDown={preventEnterKey}
                                            />
                                            <legend className="fieldset-legend">Step Description</legend>
                                            <input
                                                required
                                                name="stepDescription"
                                                value={entry.stepDescription}
                                                type="text"
                                                className="input w-full"
                                                placeholder="Enter step description"
                                                onChange={(e) => handleInputChange(index, e)}
                                                onKeyDown={preventEnterKey}
                                            />
                                            <legend className="fieldset-legend">Explanation</legend>
                                            <textarea
                                                name="explanation"
                                                value={entry.explanation}
                                                className="textarea resize-none w-full"
                                                placeholder="Enter explanation"
                                                onChange={(e) => handleInputChange(index, e)}
                                            ></textarea>
                                        </>
                                    )}
                                    {challengeType === 3 && (
                                        <>
                                            <legend className="fieldset-legend">Text</legend>
                                            <input
                                                required
                                                name="text"
                                                value={entry.text}
                                                type="text"
                                                className="input w-full"
                                                placeholder="Enter text with blanks (e.g., The capital of ____ is ____.)"
                                                onChange={(e) => handleInputChange(index, e)}
                                                onKeyDown={preventEnterKey}
                                            />
                                            <legend className="fieldset-legend">Correct Answers</legend>
                                            {entry.correctAnswers.map((answer, answerIndex) => (
                                                <input
                                                    required
                                                    key={answerIndex}
                                                    type="text"
                                                    className="input w-full mt-1.5"
                                                    placeholder={`Correct Answer ${answerIndex + 1}`}
                                                    value={answer}
                                                    onChange={(e) => handleCorrectAnswersChange(index, answerIndex, e.target.value)}
                                                    onKeyDown={preventEnterKey}
                                                />
                                            ))}
                                            <legend className="fieldset-legend">Choices</legend>
                                            {entry.choices.map((choice, choiceIndex) => (
                                                <input
                                                    required
                                                    key={choiceIndex}
                                                    type="text"
                                                    className="input w-full mt-1.5"
                                                    placeholder={`Choice ${choiceIndex + 1}`}
                                                    value={choice}
                                                    onChange={(e) => handleChoicesChange(index, choiceIndex, e.target.value)}
                                                    onKeyDown={preventEnterKey}
                                                />
                                            ))}
                                            <legend className="fieldset-legend">Explanation</legend>
                                            <textarea
                                                name="explanation"
                                                value={entry.explanation}
                                                className="textarea resize-none w-full"
                                                placeholder="Enter explanation"
                                                onChange={(e) => handleInputChange(index, e)}
                                            ></textarea>
                                        </>
                                    )}
                                    {challengeType === 4 && (
                                        <>
                                            <legend className="fieldset-legend">Left Item</legend>
                                            <input
                                                required
                                                name="left"
                                                value={entry.left}
                                                type="text"
                                                className="input w-full"
                                                placeholder="(e.g., Binary Search)"
                                                onChange={(e) => handleInputChange(index, e)}
                                                onKeyDown={preventEnterKey}
                                            />
                                            <legend className="fieldset-legend">Right Item (Match)</legend>
                                            <input
                                                required
                                                name="right"
                                                value={entry.right}
                                                type="text"
                                                className="input w-full"
                                                placeholder="(e.g., O(log n) - Divides search space)"
                                                onChange={(e) => handleInputChange(index, e)}
                                                onKeyDown={preventEnterKey}
                                            />
                                        </>
                                    )}
                                </div>
                            ))}
                        </fieldset>
                        <button type="submit" className="btn btn-success mt-2">
                            Submit
                        </button>
                    </form>
                </div>
            </dialog>
        </div>
    );
};

ChallengesAddData.propTypes = {
    onAddData: PropTypes.func.isRequired,
};

export default ChallengesAddData;