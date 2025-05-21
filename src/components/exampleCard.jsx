import 'react'
import PropTypes from 'prop-types';
import ExampleView from "./exampleView.jsx";

const ExampleCard = ({ cardInfo }) => {
    const { title, category, description, examples, id } = cardInfo;
    return (
        <div className="card bg-base-100 max-w-90 min-h-60 max-h-60 shadow-lg">
            <div className="card-body p-5">
                <div className="flex flex-row w-full justify-between mb-3.75">
                    <h2 className="text-xl font-semibold line-clamp-1">{title}</h2>
                    <div className="badge badge-accent rounded-full text-base-300">{category}</div>
                </div>

                <p className="mb-4 line-clamp-4">{description}</p>
                <div className="flex flex-row justify-end">
                    <ExampleView cardId={id} examples={examples} />
                </div>
            </div>
        </div>
    )
}

ExampleCard.propTypes = {
    cardInfo: PropTypes.shape({
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired, // Optional
        examples: PropTypes.object.isRequired,
        id: PropTypes.string.isRequired,
    }).isRequired,
};

export default ExampleCard
