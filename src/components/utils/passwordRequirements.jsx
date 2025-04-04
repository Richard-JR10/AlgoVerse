import React from 'react';
import PropTypes from "prop-types";

const PasswordRequirements = ({ passwordError }) => {
    const handleCondition = (param) => {
        if (param) {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" height="20" width="17.5" viewBox="0 0 448 512"><path fill="#ffffff" d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
            );
        } else {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" height="20" width="15"  viewBox="0 0 384 512">
                    <path fill="#ffffff" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/>
                </svg>
            );
        }
    }

    return (
        <div className="mt-5">
            <div className="flex flex-row text-xs items-center gap-2">{handleCondition(passwordError.minLength)} Minimum 8 characters</div>
            <div className="flex flex-row text-xs items-center gap-2">{handleCondition(passwordError.hasNumber)} Contains at least 1 number (0-9)</div>
            <div className="flex flex-row text-xs items-center gap-2">{handleCondition(passwordError.hasSpecialChar)} Contains at least 1 special character (!@#$%^&*_-)</div>
            <div className="flex flex-row text-xs items-center gap-2">{handleCondition(passwordError.hasUppercase)} Contains at least 1 uppercase letter (A-Z)</div>
            <div className="flex flex-row text-xs items-center gap-2">{handleCondition(passwordError.hasLowercase)} Contains at least 1 lowercase letter (a-z)</div>
        </div>
    )
}

PasswordRequirements.propTypes = {
    passwordError: PropTypes.object.isRequired,
}

export default PasswordRequirements
