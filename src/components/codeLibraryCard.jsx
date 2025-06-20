import 'react'
import PropTypes from 'prop-types';
import CodeView from "./codeView.jsx";
import {useState} from "react";

const CodeLibraryCard = ({ cardInfo }) => {
    const { title, category, description, codeData, id } = cardInfo;
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(codeData[0].code)
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className="card bg-base-100 max-w-90 min-h-60 max-h-60 shadow-lg">
            <div className="card-body p-5">
                <div className="flex flex-row w-full justify-between mb-3.75">
                    <h2 className="text-xl font-semibold line-clamp-1">{title}</h2>
                    <div className="badge badge-accent rounded-full text-base-300">{category}</div>
                </div>

                <p className="mb-4 line-clamp-4">{description}</p>
                <div className="flex flex-row justify-between">
                    <CodeView title={title} description={description} codeData={codeData} cardId={id}/>
                    <button className="btn btn-primary" onClick={handleCopy} disabled={copied}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15.24 2h-3.894c-1.764 0-3.162 0-4.255.148c-1.126.152-2.037.472-2.755 1.193c-.719.721-1.038 1.636-1.189 2.766C3 7.205 3 8.608 3 10.379v5.838c0 1.508.92 2.8 2.227 3.342c-.067-.91-.067-2.185-.067-3.247v-5.01c0-1.281 0-2.386.118-3.27c.127-.948.413-1.856 1.147-2.593s1.639-1.024 2.583-1.152c.88-.118 1.98-.118 3.257-.118h3.07c1.276 0 2.374 0 3.255.118A3.6 3.6 0 0 0 15.24 2"/><path fill="currentColor" d="M6.6 11.397c0-2.726 0-4.089.844-4.936c.843-.847 2.2-.847 4.916-.847h2.88c2.715 0 4.073 0 4.917.847S21 8.671 21 11.397v4.82c0 2.726 0 4.089-.843 4.936c-.844.847-2.202.847-4.917.847h-2.88c-2.715 0-4.073 0-4.916-.847c-.844-.847-.844-2.21-.844-4.936z"/></svg>
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>

            </div>
        </div>
    )
}

CodeLibraryCard.propTypes = {
    cardInfo: PropTypes.shape({
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired, // Optional
        codeData: PropTypes.object.isRequired,
        id: PropTypes.string.isRequired,
    }).isRequired,
};

export default CodeLibraryCard
