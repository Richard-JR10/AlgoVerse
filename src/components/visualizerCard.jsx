import React from 'react'
import {useNavigate} from "react-router-dom";

const VisualizerCard = ({ imgUrl, title, desc, btnUrl }) => {
    const navigate = useNavigate();

    return (
            <div className="card card-compact bg-base-100 w-96 shadow-xl">
                <figure>
                    <img
                        className="max-h-72"
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
export default VisualizerCard
