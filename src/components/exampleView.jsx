import 'react'
import PropTypes from "prop-types";

const ExampleView = ({ cardId, examples}) => {

    return (
        <div>
            <button className="btn btn-primary" onClick={()=>document.getElementById(cardId).showModal()}>View</button>
            <dialog id={cardId} className="modal">
                <div className="modal-box w-11/12 max-w-3xl">
                    <div className="flex justify-end">
                        <form method="dialog">
                            {/* if there is a button in form, it will close the modal */}
                            <button className="btn btn-primary">Close</button>
                        </form>
                    </div>
                    {examples.map(example => {
                        // Convert YouTube URL to embed format if needed
                        const getEmbedUrl = (url) => {
                            if (!url) return "";
                            // If it's already an embed URL, return as is
                            if (url.includes('/embed/')) return url;

                            // Handle youtube.com/watch?v= format
                            const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?]*)/);
                            if (videoIdMatch && videoIdMatch[1]) {
                                return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
                            }

                            // Return original if we can't parse it
                            return url;
                        };

                        const embedUrl = getEmbedUrl(example.url);
                        console.log("Original URL:", example.url);
                        console.log("Embed URL:", embedUrl);

                        return (
                            <div key={example.id}>
                                <h1 className="text-xl font-semibold mb-2">{example.title}</h1>
                                <iframe
                                    className="mb-2 w-full"
                                    width="420"
                                    height="315"
                                    src={embedUrl}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                                <p className="text-sm">{example.description}</p>
                            </div>
                        );
                    })}
                </div>
            </dialog>
        </div>
    )
}

ExampleView.propTypes = {
    cardId: PropTypes.string.isRequired,
    examples: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
            url: PropTypes.string.isRequired,
        })
    ).isRequired,
}
export default ExampleView
