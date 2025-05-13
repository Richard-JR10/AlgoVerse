import FillInBlanksQuiz from "./challenges/FillInTheBlanksQuiz/FIllInTheBlanksQuiz.jsx";
import SortingArrangement from "./challenges/SortingArrangement/SortingArrangement.jsx";
import MultipleChoices from "./challenges/MultipleChoices.jsx";

const ArrowButton = ({question}) => {
    const {id, type} = question;
    return (
        <div>
            <button className="btn btn-sm btn-ghost" onClick={()=>document.getElementById(id).showModal()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="24" viewBox="0 0 12 24">
                    <path fill="#e6d8d8" fillRule="evenodd" d="M10.157 12.711L4.5 18.368l-1.414-1.414l4.95-4.95l-4.95-4.95L4.5 5.64l5.657 5.657a1 1 0 0 1 0 1.414" />
                </svg>
            </button>
            <dialog id={id} className="modal">
                <div className="modal-box w-full max-w-none h-full max-h-none rounded-none">
                    <form method="dialog">
                        {/* if there is a button in form, it will close the modal */}
                        <button className="btn btn-lg btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    {type === 3 && <FillInBlanksQuiz/>}
                    {type === 2 && <SortingArrangement/>}
                    {type === 1 && <MultipleChoices/>}
                </div>
            </dialog>
        </div>
    )
}

const questions = [
    {
        id: '4LCF7qzdJu8VT8wZECf1',
        title: 'fill in the blanks',
        text: 'The capital of ____ is ____.',
        correctAnswers: ['France', 'Paris'],
        choices: ['France', 'Paris', 'Germany', 'Berlin', 'Spain', 'Madrid'],
        explanation: 'France is a country in Europe, and Paris is its capital city, known for landmarks like te Eiffel Tower.',
        difficulty: 'Hard',
        type: 3
    },
    {
        id: '5LCF7qwsJx9VT8wZECf1',
        title: 'fill in the blanks 2',
        text: 'The capital of ____ is ____.',
        correctAnswers: ['France', 'Paris'],
        choices: ['France', 'Paris', 'Germany', 'Berlin', 'Spain', 'Madrid'],
        explanation: 'France is a country in Europe, and Paris is its capital city, known for landmarks like te Eiffel Tower.',
        difficulty: 'Easy',
        type: 2
    },
    {
        id: '5LCF7qwsJx9VT8wZECf21',
        title: 'fill in the blanks 2',
        text: 'The capital of ____ is ____.',
        correctAnswers: ['France', 'Paris'],
        choices: ['France', 'Paris', 'Germany', 'Berlin', 'Spain', 'Madrid'],
        explanation: 'France is a country in Europe, and Paris is its capital city, known for landmarks like te Eiffel Tower.',
        difficulty: 'Med.',
        type: 1
    }
];

const ChallengeTable = () => {
    // Type 3 = fill in the blanks
    // Type 2 = sorting bars arrangement
    // Type 1 = Multiple Choices
    return (
        <div className="overflow-x-auto">
            <table className="table">
                {/* head */}
                <thead>
                <tr>
                    <th className="w-0"></th>
                    <th>Name</th>
                    <th>Difficulty</th>
                    <th className="w-0"></th>
                </tr>
                </thead>
                <tbody>
                    {questions.map((question) => (
                        <tr key={question.id}>
                            <td>
                                {/*<div aria-label="status" className="status status-accent status-lg"></div>*/}
                            </td>
                            <td>{question.title}</td>
                            <td>
                                <span className={`badge 
                                ${question.difficulty === 'Easy' ? 
                                    'badge-success' 
                                    : question.difficulty === 'Med.' ? 'badge-warning' : 'badge-error'}
                                 font-semibold`}>
                                    {question.difficulty}
                                </span>
                            </td>
                            <td>
                                <ArrowButton question={question} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
export default ChallengeTable
