import {useState} from 'react'
import PropTypes from "prop-types";

const ProfileImage = ({ src, size, type }) => {
    const [loaded, setLoaded] = useState(false);
    const photoURL = src || 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp';

    const sizeClasses = {
        8: "w-8",
        10: "w-10",
        12: "w-12",
        16: "w-16",
        20: "w-20",
        24: "w-24",
        32: "w-32",
        36: "w-36",
        40: "w-40",
        48: "w-48"
    };

    const sizeClass = sizeClasses[size] || "w-12";

    return (
        <div className="avatar">
            {type === "circle" ? (
                <div className={`${sizeClass} rounded-full`}>
                    {!loaded && <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" alt="Loading" />}
                    <img
                        src={photoURL}
                        alt="Avatar"
                        onLoad={() => setLoaded(true)}
                    />
                </div>
            ) : (
                <div className={`mask mask-squircle ${sizeClass}`}>
                    {!loaded && <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" alt="Loading" />}
                    <img
                        src={photoURL}
                        alt="Avatar"
                        onLoad={() => setLoaded(true)}
                    />
                </div>
            )}

        </div>
    )
}

ProfileImage.propTypes = {
    src: PropTypes.string,
    size: PropTypes.number,
    type: PropTypes.string,
}
export default ProfileImage
