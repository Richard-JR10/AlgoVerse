import 'react'
import PropTypes from "prop-types";
import ExampleEditData from "./exampleEditData.jsx";

const ExampleTable = ({ exampleInfo, onDelete, onCheckboxChange, selectedIds, onSelectAll, onEditData }) => {
    const allSelected = exampleInfo.length > 0 && exampleInfo.every((info) => selectedIds.includes(info.id));

    return (
        <div className="overflow-x-auto">
            <table className="table flex">
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
                    <th>Description</th>
                    <th>Examples</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {exampleInfo.map((content) => (
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
                            <span className="badge badge-accent badge-sm">{content.category}</span>
                        </td>
                        <td>
                            <div className="overflow-hidden max-w-200">{content.description}</div>
                        </td>
                        <td>
                            <div>
                                {content.examples && content.examples.length > 0 ? (
                                    <ul>
                                        {content.examples.map((example,index) => {
                                            const badgeColors = [
                                                "badge-primary",
                                                "badge-secondary",
                                                "badge-accent",
                                                "badge-info",
                                                "badge-success",
                                                "badge-warning",
                                                "badge-error"
                                            ];
                                            const colorClass = badgeColors[index % badgeColors.length];
                                            return (
                                                <li key={index}>
                                                    <strong className={`badge h-full ${colorClass} rounded-full mb-1`}>{example.title}</strong>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                ):(
                                    'No examples found.'
                                )}
                            </div>
                        </td>
                        <td className="flex flex-row">
                            <button className="btn btn-error mr-2" onClick={()=>onDelete(content.id)}>
                                Delete
                            </button>
                            <ExampleEditData content={content} onEditData={onEditData}/>
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

ExampleTable.propTypes = {
    exampleInfo: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            category: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
            examples: PropTypes.arrayOf(
                PropTypes.shape({
                    title: PropTypes.string.isRequired,
                    description: PropTypes.string.isRequired,
                    url: PropTypes.string.isRequired,
                })
            ).isRequired,
        })
    ).isRequired,
    onDelete: PropTypes.func.isRequired,
    onSelectAll: PropTypes.func.isRequired,
    onCheckboxChange: PropTypes.func.isRequired,
    selectedIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    onEditData: PropTypes.func.isRequired,
};
export default ExampleTable
