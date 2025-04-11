import React from 'react'
import PropTypes from "prop-types";
import ProfileImage from "./utils/ProfileImage.jsx";

const UsersTable = ({ usersInfo, onDelete, onDisable, onEnable, onCheckboxChange, selectedUids, onSelectAll, onSetAdmin, onRemoveAdmin }) => {
    const allSelected = usersInfo.length > 0 && usersInfo.every((user) => selectedUids.includes(user.uid));

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
                    <th>Name</th>
                    <th>Role</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                    {usersInfo.map((user) => (
                        <tr key={user.id}>
                            <th>
                                <label>
                                    <input type="checkbox"
                                           className="checkbox"
                                           checked={selectedUids.includes(user.uid)}
                                           onChange={() => onCheckboxChange(user.uid)}
                                    />
                                </label>
                            </th>
                            <td>
                                <div className="flex items-center gap-3">
                                    <ProfileImage src={user.photoURL} size="12" type="square"/>
                                    <div>
                                        <div className="font-bold">{user.displayName}</div>
                                        <div className="text-sm opacity-50">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                {user.admin ? (
                                    <span className="badge badge-accent badge-sm">Admin</span>
                                ):(
                                    <span className="badge badge-primary badge-sm">User</span>
                                )}

                            </td>
                            <td>
                                <button className="btn btn-primary mr-2" onClick={() => onDelete(user.uid)}>
                                    Delete
                                </button>
                                {user.disabled ? (
                                    <button className="btn btn-success mr-2" onClick={() => onEnable(user.uid)}>
                                        Enable
                                    </button>
                                ):(
                                    <button className="btn btn-error mr-2" onClick={() => onDisable(user.uid)}>
                                        Disable
                                    </button>
                                )}
                                {user.admin ? (
                                    <button className="btn btn-outline btn-warning" onClick={() => onRemoveAdmin(user.uid)}>
                                        Remove Admin
                                    </button>
                                ):(
                                    <button className="btn btn-outline btn-warning" onClick={() => onSetAdmin(user.uid)}>
                                        Set Admin
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

UsersTable.propTypes = {
    usersInfo: PropTypes.arrayOf(
        PropTypes.shape({
            uid: PropTypes.string.isRequired,
            displayName: PropTypes.string,
            email: PropTypes.string,
            photoURL: PropTypes.string,
            disabled: PropTypes.bool,
            admin: PropTypes.bool, // Optional, if you track admin status
        })
    ).isRequired,
    onDelete: PropTypes.func.isRequired,
    onDisable: PropTypes.func.isRequired,
    onEnable: PropTypes.func.isRequired,
    onSelectAll: PropTypes.func.isRequired,
    onSetAdmin: PropTypes.func.isRequired,
    onRemoveAdmin: PropTypes.func.isRequired,
    onCheckboxChange: PropTypes.func.isRequired,
    selectedUids: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default UsersTable
