import React from 'react'
import PropTypes from "prop-types";
import LibraryEditData from "./libraryEditData.jsx";

const LibraryTable = ({ libraryInfo, onDelete, onCheckboxChange, selectedIds, onSelectAll, onEditData }) => {
    const allSelected = libraryInfo.length > 0 && libraryInfo.every((info) => selectedIds.includes(info.id));

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
                    <th>Description</th>
                    <th>Code</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {libraryInfo.map((content) => (
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
                                {content.codeData && content.codeData.length > 0 ? (
                                    <ul>
                                        {content.codeData.map((code, index) => {
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
                                                    <strong className={`badge ${colorClass} rounded-full mb-1`}>{code.language}</strong>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                ) : (
                                    'No code available'
                                )}
                            </div>
                        </td>
                        <td className="flex flex-row">
                            <button className="btn btn-error mr-2" onClick={() => onDelete(content.id)}>
                                Delete
                            </button>
                            <LibraryEditData content={content} onEditData={onEditData} />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}

LibraryTable.propTypes = {
    libraryInfo: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            category: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
            codeData: PropTypes.arrayOf(
                PropTypes.shape({
                    language: PropTypes.string.isRequired,
                    code: PropTypes.string.isRequired,
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

export default LibraryTable
