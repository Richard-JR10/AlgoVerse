import PropTypes from "prop-types";
import ChallengesEditData from "./challengesEditData.jsx";

const ChallengesAdminTable = ({ challengesInfo, onDelete, onCheckboxChange, selectedIds, onSelectAll, onEditData }) => {
    const allSelected = challengesInfo.length > 0 && challengesInfo.every((info) => selectedIds.includes(info.id));

    return (
        <div className="overflow-x-auto">
            <table className="table flex">
                {/* head */}
                <thead>
                <tr>
                    <th>
                        <label>
                            <input
                                type="checkbox"
                                className="checkbox"
                                checked={allSelected}
                                onChange={(e) => onSelectAll(e.target.checked)}
                            />
                        </label>
                    </th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Difficulty</th>
                    <th>Type</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {challengesInfo.map((content) => (
                    <tr key={content.id}>
                        <th>
                            <label>
                                <input type="checkbox"
                                       className="checkbox"
                                       checked={selectedIds.includes(content.id)}
                                       onChange={() => onCheckboxChange(content.id)}
                                />
                            </label>
                        </th>
                        <td>
                            <div className="font-bold">{content.title}</div>
                        </td>
                        <td>
                            <div className="font-bold">{content.category}</div>
                        </td>
                        <td>
                            <span className={`badge 
                                ${content.difficulty === 'Easy' ?
                                'badge-success'
                                : content.difficulty === 'Medium' ? 'badge-warning' : 'badge-error'}
                                 font-semibold`}>
                                {content.difficulty}
                            </span>
                        </td>
                        <td>
                            <span className="badge badge-accent badge-sm">
                                {content.type === 1 && 'Multiple Choice'}
                                {content.type === 2 && 'Sorting Arrangement'}
                                {content.type === 3 && 'Fill In The Blanks'}
                            </span>
                        </td>
                        <td className="flex flex-row">
                            <button className="btn btn-error mr-2" onClick={() => onDelete(content.id)}>
                                Delete
                            </button>
                            <ChallengesEditData content={content} onEditData={onEditData}/>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}

ChallengesAdminTable.propTypes = {
    challengesInfo: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            category: PropTypes.string.isRequired,
            type: PropTypes.number.isRequired,
        })
    ).isRequired,
    onDelete: PropTypes.func.isRequired,
    onSelectAll: PropTypes.func.isRequired,
    onCheckboxChange: PropTypes.func.isRequired,
    selectedIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    onEditData: PropTypes.func.isRequired,
};

export default ChallengesAdminTable
