import 'react'
import PropTypes from "prop-types";
import {useState} from "react";

const LibraryEditData = ({content, onEditData}) => {
    const {id, title, category, description, codeData } = content;

    const [codeEntries, setCodeEntries] = useState(codeData);

    const [libraryData, setLibraryData] = useState({
        title: title,
        category: category,
        description: description,
        codeData: [codeEntries],
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLibraryData((prev) => ({ ...prev, [name]: value }));
    }

    const handleCodeChange = (index, field, value) => {
        const updatedEntries = [...codeEntries];
        updatedEntries[index] = { ...updatedEntries[index], [field]: value };
        setCodeEntries(updatedEntries);
    };

    // Function to add a new code entry
    const handleAddCode = () => {
        setCodeEntries([...codeEntries, { language: '', code: '' }]);
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        onEditData(id,{
            title: libraryData.title,
            category: libraryData.category,
            description: libraryData.description,
            codeData: codeEntries,
        });
        document.getElementById(id).close();
    }

    const handleRemoveCode = (index) => {
        setCodeEntries(codeEntries.filter((_, i) => i !== index));
    };

    const preventEnterKey = (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
        }
    };

    return (
        <div>
            <button className="btn btn-primary" onClick={()=>document.getElementById(id).showModal()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
                    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 21h16M5.666 13.187A2.28 2.28 0 0 0 5 14.797V18h3.223c.604 0 1.183-.24 1.61-.668l9.5-9.505a2.28 2.28 0 0 0 0-3.22l-.938-.94a2.277 2.277 0 0 0-3.222.001z" />
                </svg>
                Edit
            </button>
            <dialog id={id} className="modal">
                <div className="modal-box max-h-[80vh] overflow-y-auto hide-scrollbar">
                    <form method="dialog">
                        {/* if there is a button in form, it will close the modal */}
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onKeyDown={preventEnterKey}>
                            ✕
                        </button>
                    </form>
                    <form
                        onSubmit={handleSubmit}
                    >
                        <h3 className="font-bold text-lg">Edit Data</h3>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Title</legend>
                            <input name="title" value={libraryData.title} type="text" className="input w-full" placeholder="Type here" onChange={handleInputChange} onKeyDown={preventEnterKey}/>
                            <legend className="fieldset-legend">Category</legend>
                            <input name="category" value={libraryData.category} type="text" className="input w-full" placeholder="Type here" onChange={handleInputChange} onKeyDown={preventEnterKey}/>
                            <legend className="fieldset-legend">Description</legend>
                            <textarea name="description" value={libraryData.description} className="textarea resize-none w-full" placeholder="Type here" onChange={handleInputChange}></textarea>
                            <div className="flex flex-row justify-between">
                                <legend className="fieldset-legend">Code</legend>
                                <button type="button" className="btn btn-primary btn-square" onClick={handleAddCode}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M18 10h-4V6a2 2 0 0 0-4 0l.071 4H6a2 2 0 0 0 0 4l4.071-.071L10 18a2 2 0 0 0 4 0v-4.071L18 14a2 2 0 0 0 0-4"/></svg>
                                </button>
                            </div>
                            {codeEntries.map((item, i) => (
                                <div key={i} className="mt-2">
                                    <div className="flex flex-row justify-between items-center mb-2">
                                        <legend className="fieldset-legend pt-0">Programming language</legend>
                                        {i >= 1 && (
                                            <button type="button" className="btn btn-error btn-square" onClick={() => handleRemoveCode(i)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        placeholder="Language Name"
                                        value={item.language}
                                        title="Required"
                                        onKeyDown={preventEnterKey}
                                        onChange={(e) => handleCodeChange(i, 'language', e.target.value)}
                                    />
                                    <p className="validator-hint">Required</p>
                                    <textarea
                                        className="textarea resize-none mt-1.5 w-full"
                                        placeholder="Code"
                                        value={item.code}
                                        title="Required"
                                        onChange={(e) => handleCodeChange(i, 'code', e.target.value)}
                                    ></textarea>
                                </div>
                            ))}
                        </fieldset>
                        <button type="submit" className="btn btn-success mt-2">Update</button>
                    </form>
                </div>
            </dialog>
        </div>
    )
}

LibraryEditData.propTypes = {
    content: PropTypes.shape({
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
    }).isRequired,
    onEditData: PropTypes.func.isRequired,
}
export default LibraryEditData
