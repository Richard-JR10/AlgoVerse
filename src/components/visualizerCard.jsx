import 'react'
import {useNavigate} from "react-router-dom";
import PropTypes from "prop-types";

const VisualizerCard = ({ imgUrl, title, desc, btnUrl }) => {
    const navigate = useNavigate();

    return (
            <div className="card card-compact bg-base-100 w-80 shadow-xl">
                <figure>
                    <img
                        className="max-h-60 w-full object-cover"
                        src={imgUrl}
                        alt="Image" />
                </figure>
                <div className="card-body">
                    <h2 className="card-title">{title}</h2>
                    <p>{desc}</p>
                    <div className="card-actions justify-end">
                        <button className="btn btn-primary" onClick={() => navigate(btnUrl)}>Start</button>
                    </div>
                </div>
            </div>
    )
}

VisualizerCard.propTypes = {
    imgUrl: PropTypes.string,
    title: PropTypes.string,
    desc: PropTypes.string,
    btnUrl: PropTypes.string,
}


export default VisualizerCard
