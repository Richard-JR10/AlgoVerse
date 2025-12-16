import FillInBlanksQuiz from "./challenges/FIllInTheBlanksQuiz.jsx";
import SortingArrangement from "./challenges/SortingArrangement/SortingArrangement.jsx";
import MultipleChoices from "./challenges/MultipleChoices.jsx";
import {useContext} from "react";
import {ChallengeContext} from "./challenges/ChallengeContext.jsx";

const ArrowButton = ({id, difficulty, type, question}) => {
    const pointsMultiplier = difficulty === "Hard" ? 3 : difficulty === "Medium" ? 2 : 1;

    return (
        <div>
            <button className="btn btn-sm btn-ghost" onClick={()=>document.getElementById(id).showModal()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="24" viewBox="0 0 12 24" className="dark:fill-accent light:fill-dark">
                    <path fillRule="evenodd" d="M10.157 12.711L4.5 18.368l-1.414-1.414l4.95-4.95l-4.95-4.95L4.5 5.64l5.657 5.657a1 1 0 0 1 0 1.414" />
                </svg>
            </button>
            <dialog id={id} className="modal">
                <div className="modal-box w-full max-w-none h-full max-h-none rounded-none">
                    <form method="dialog">
                        {/* if there is a button in form, it will close the modal */}
                        <button className="btn btn-lg btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    {type === 3 && <FillInBlanksQuiz id={id} questions={question} pointsMultiplier={pointsMultiplier} />}
                    {type === 2 && <SortingArrangement id={id} questions={question} pointsMultiplier={pointsMultiplier} />}
                    {type === 1 && <MultipleChoices id={id} questions={question} pointsMultiplier={pointsMultiplier} />}
                </div>
            </dialog>
        </div>
    )
}

// Type 3 = fill in the blanks
// Type 2 = sorting bars arrangement
// Type 1 = Multiple Choices

const ChallengeTable = ({ challenges }) => {
    const { solvedChallenges } = useContext(ChallengeContext);

    return (
        <div className="overflow-x-auto">
            <table className="table">
                {/* head */}
                <thead>
                <tr>
                    <th className="w-0"></th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Difficulty</th>
                    <th className="w-0"></th>
                </tr>
                </thead>
                <tbody>
                    {challenges.map((question) => (
                        <tr key={question.id}>
                            <td>
                                {solvedChallenges.includes(question.id) && (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 text-green-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                )}
                            </td>
                            <td>{question.title}</td>
                            <td>{question.category}</td>
                            <td>
                                <span className={`badge 
                                ${question.difficulty === 'Easy' ? 
                                    'badge-success' 
                                    : question.difficulty === 'Medium' ? 'badge-warning' : 'badge-error'}
                                 font-semibold`}>
                                    {question.difficulty}
                                </span>
                            </td>
                            <td className="text-success font-bold">
                                +{question.difficulty === "Hard" ? 3 : question.difficulty === "Medium" ? 2 : 1}pts
                            </td>
                            <td>
                                <ArrowButton id={question.id} difficulty={question.difficulty} type={question.type} question={question.questions} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
export default ChallengeTable