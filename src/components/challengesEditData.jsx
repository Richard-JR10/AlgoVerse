import { useState } from "react";
import PropTypes from "prop-types";

const ChallengesEditData = ({ content, onEditData }) => {
    const { id, title, category, type, difficulty, questions } = content;

    const [questionEntries, setQuestionEntries] = useState(questions);
    const [challengeData, setChallengeData] = useState({
        title,
        category,
        type,
        difficulty,
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setChallengeData((prev) => ({ ...prev, [name]: value }));
    };

    const handleQuestionChange = (index, field, value) => {
        const updatedEntries = [...questionEntries];
        updatedEntries[index] = { ...updatedEntries[index], [field]: value };
        setQuestionEntries(updatedEntries);
    };

    const handleArrayChange = (index, field, value) => {
        const updatedEntries = [...questionEntries];
        updatedEntries[index] = { ...updatedEntries[index], [field]: value.split(',').map((item) => item.trim()) };
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
        const newQuestion = challengeData.type === 1
            ? { question: '', answer: '', choices: ['', '', '', ''] }
            : challengeData.type === 2
                ? { algorithm: '', initialArray: [], expectedArray: [], stepDescription: '', explanation: '' }
                : { text: '', correctAnswers: ['', ''], choices: ['', '', '', ''], explanation: '' };
        setQuestionEntries([...questionEntries, newQuestion]);
    };

    const handleRemoveQuestion = (index) => {
        setQuestionEntries(questionEntries.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onEditData(id, {
            title: challengeData.title,
            category: challengeData.category,
            type: parseInt(challengeData.type),
            difficulty: challengeData.difficulty,
            questions: questionEntries,
        });
        document.getElementById(id).close();
    };

    const preventEnterKey = (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
        }
    };

    return (
        <div>
            <button className="btn btn-primary" onClick={() => document.getElementById(id).showModal()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
                    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 21h16M5.666 13.187A2.28 2.28 0 0 0 5 14.797V18h3.223c.604 0 1.183-.24 1.61-.668l9.5-9.505a2.28 2.28 0 0 0 0-3.22l-.938-.94a2.277 2.277 0 0 0-3.222.001z" />
                </svg>
                Edit
            </button>
            <dialog id={id} className="modal">
                <div className="modal-box max-h-[80vh] overflow-y-auto hide-scrollbar">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onKeyDown={preventEnterKey}>
                            ✕
                        </button>
                    </form>
                    <form onSubmit={handleSubmit}>
                        <h3 className="font-bold text-lg">Edit Challenge</h3>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Title</legend>
                            <input
                                name="title"
                                value={challengeData.title}
                                type="text"
                                className="input w-full"
                                placeholder="Enter challenge title"
                                onChange={handleInputChange}
                                onKeyDown={preventEnterKey}
                            />
                            <legend className="fieldset-legend">Category</legend>
                            <select
                                name="category"
                                value={challengeData.category}
                                className="select w-full"
                                onChange={handleInputChange}
                            >
                                <option>Sorting</option>
                                <option>Search</option>
                                <option>Graph Traversal</option>
                                <option>Recursion</option>
                            </select>
                            <legend className="fieldset-legend">Difficulty</legend>
                            <select
                                name="difficulty"
                                value={challengeData.difficulty}
                                className="select w-full"
                                onChange={handleInputChange}
                            >
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                            </select>
                            <div className="flex flex-row justify-between">
                                <legend className="fieldset-legend">Questions</legend>
                                <button type="button" className="btn btn-primary btn-square" onClick={handleAddQuestion}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M18 10h-4V6a2 2 0 0 0-4 0l.071 4H6a2 2 0 0 0 0 4l4.071-.071L10 18a2 2 0 0 0 4 0v-4.071L18 14a2 2 0 0 0 0-4"/>
                                    </svg>
                                </button>
                            </div>
                            {questionEntries.map((item, i) => (
                                <div key={i} className="mt-2">
                                    <div className="flex flex-row justify-between items-center mb-2">
                                        <legend className="fieldset-legend pt-0">Question {i + 1}</legend>
                                        {i >= 1 && (
                                            <button type="button" className="btn btn-error btn-square" onClick={() => handleRemoveQuestion(i)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
                                                    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    {challengeData.type === 1 && (
                                        <>
                                            <legend className="fieldset-legend">Question</legend>
                                            <input
                                                type="text"
                                                className="input w-full"
                                                placeholder="Enter question"
                                                value={item.question}
                                                onChange={(e) => handleQuestionChange(i, 'question', e.target.value)}
                                                onKeyDown={preventEnterKey}
                                            />
                                            <legend className="fieldset-legend">Answer</legend>
                                            <input
                                                type="text"
                                                className="input w-full"
                                                placeholder="Enter correct answer (e.g., 'b')"
                                                value={item.answer}
                                                onChange={(e) => handleQuestionChange(i, 'answer', e.target.value)}
                                                onKeyDown={preventEnterKey}
                                            />
                                            <legend className="fieldset-legend">Choices</legend>
                                            {item.choices.map((choice, choiceIndex) => (
                                                <input
                                                    key={choiceIndex}
                                                    type="text"
                                                    className="input w-full mt-1.5"
                                                    placeholder={`Choice ${choiceIndex + 1} (e.g., 'a) Option text')`}
                                                    value={choice}
                                                    onChange={(e) => handleChoicesChange(i, choiceIndex, e.target.value)}
                                                    onKeyDown={preventEnterKey}
                                                />
                                            ))}
                                        </>
                                    )}
                                    {challengeData.type === 2 && (
                                        <>
                                            <legend className="fieldset-legend">Algorithm</legend>
                                            <input
                                                type="text"
                                                className="input w-full"
                                                placeholder="Enter algorithm (e.g., ALGORITHMS.BUBBLE)"
                                                value={item.algorithm}
                                                onChange={(e) => handleQuestionChange(i, 'algorithm', e.target.value)}
                                                onKeyDown={preventEnterKey}
                                            />
                                            <legend className="fieldset-legend">Initial Array</legend>
                                            <input
                                                type="text"
                                                className="input w-full"
                                                placeholder="Enter initial array (e.g., 7,3,9,2,5)"
                                                value={item.initialArray.join(',')}
                                                onChange={(e) => handleArrayChange(i, 'initialArray', e.target.value)}
                                                onKeyDown={preventEnterKey}
                                            />
                                            <legend className="fieldset-legend">Expected Array</legend>
                                            <input
                                                type="text"
                                                className="input w-full"
                                                placeholder="Enter expected array (e.g., 3,7,2,5,9)"
                                                value={item.expectedArray.join(',')}
                                                onChange={(e) => handleArrayChange(i, 'expectedArray', e.target.value)}
                                                onKeyDown={preventEnterKey}
                                            />
                                            <legend className="fieldset-legend">Step Description</legend>
                                            <input
                                                type="text"
                                                className="input w-full"
                                                placeholder="Enter step description"
                                                value={item.stepDescription}
                                                onChange={(e) => handleQuestionChange(i, 'stepDescription', e.target.value)}
                                                onKeyDown={preventEnterKey}
                                            />
                                            <legend className="fieldset-legend">Explanation</legend>
                                            <textarea
                                                className="textarea resize-none w-full"
                                                placeholder="Enter explanation"
                                                value={item.explanation}
                                                onChange={(e) => handleQuestionChange(i, 'explanation', e.target.value)}
                                            ></textarea>
                                        </>
                                    )}
                                    {challengeData.type === 3 && (
                                        <>
                                            <legend className="fieldset-legend">Text</legend>
                                            <input
                                                type="text"
                                                className="input w-full"
                                                placeholder="Enter text with blanks (e.g., The capital of ____ is ____.)"
                                                value={item.text}
                                                onChange={(e) => handleQuestionChange(i, 'text', e.target.value)}
                                                onKeyDown={preventEnterKey}
                                            />
                                            <legend className="fieldset-legend">Correct Answers</legend>
                                            {item.correctAnswers.map((answer, answerIndex) => (
                                                <input
                                                    key={answerIndex}
                                                    type="text"
                                                    className="input w-full mt-1.5"
                                                    placeholder={`Correct Answer ${answerIndex + 1}`}
                                                    value={answer}
                                                    onChange={(e) => handleCorrectAnswersChange(i, answerIndex, e.target.value)}
                                                    onKeyDown={preventEnterKey}
                                                />
                                            ))}
                                            <legend className="fieldset-legend">Choices</legend>
                                            {item.choices.map((choice, choiceIndex) => (
                                                <input
                                                    key={choiceIndex}
                                                    type="text"
                                                    className="input w-full mt-1.5"
                                                    placeholder={`Choice ${choiceIndex + 1}`}
                                                    value={choice}
                                                    onChange={(e) => handleChoicesChange(i, choiceIndex, e.target.value)}
                                                    onKeyDown={preventEnterKey}
                                                />
                                            ))}
                                            <legend className="fieldset-legend">Explanation</legend>
                                            <textarea
                                                className="textarea resize-none w-full"
                                                placeholder="Enter explanation"
                                                value={item.explanation}
                                                onChange={(e) => handleQuestionChange(i, 'explanation', e.target.value)}
                                            ></textarea>
                                        </>
                                    )}
                                </div>
                            ))}
                        </fieldset>
                        <button type="submit" className="btn btn-success mt-2">Update</button>
                    </form>
                </div>
            </dialog>
        </div>
    );
};

ChallengesEditData.propTypes = {
    content: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        type: PropTypes.number.isRequired,
        difficulty: PropTypes.string.isRequired,
        questions: PropTypes.arrayOf(PropTypes.object).isRequired,
    }).isRequired,
    onEditData: PropTypes.func.isRequired,
};

export default ChallengesEditData;