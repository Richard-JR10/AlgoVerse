import 'react'
import { Highlight, themes } from "prism-react-renderer";
import { downloadFile } from "./utils/downloadButton.jsx";
import {useState} from "react";
import PropTypes from "prop-types";

const CodeView = ({ description, codeData, cardId }) => {
    const [copied, setCopied] = useState(false);

    const [activeButton, setActiveButton] = useState(codeData[0].language);
    const language = activeButton.toLowerCase();
    const handleButtonActive = (id) => {
        setActiveButton(id);
    }

    const code = codeData.find(item => item.language === activeButton)?.code || '';

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code)
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const handleDownload = () => {
        downloadFile({content: code, fileName: activeButton});
    }


    return (
        <div>
            <button className="btn btn-primary" onClick={()=>document.getElementById(cardId).showModal()}>View</button>
            <dialog id={cardId} className="modal">
                <div className="modal-box w-11/12 max-w-3xl">
                    <div className="flex justify-between">
                        <div className="flex gap-2">
                            {codeData.map(item => (
                                <button key={item.language} className={`btn
                                ${
                                    activeButton === item.language ? 'btn-primary btn-active' : ''
                                }`} onClick={() => handleButtonActive(item.language)}>{item.language}</button>
                            ))}
                        </div>
                        <form method="dialog">
                            {/* if there is a button in form, it will close the modal */}
                            <button className="btn btn-primary">Close</button>
                        </form>
                    </div>
                    <div className="flex flex-row justify-between items-center bg-nightOwl rounded-tr-lg rounded-tl-lg px-4 py-2 shadow-lg mt-3">
                        <div className="flex flex-row gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex flex-row gap-1">
                            <button className="rounded-full px-1.5 h-8 hover:cursor-pointer hover:shadow-sm hover:bg-base-200 disabled:cursor-default no-color-change-when-disabled" onClick={handleCopy} disabled={copied}>
                                { copied ? (
                                    <svg className="text-green-500" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="m9.55 15.15l8.475-8.475q.3-.3.7-.3t.7.3t.3.713t-.3.712l-9.175 9.2q-.3.3-.7.3t-.7-.3L4.55 13q-.3-.3-.288-.712t.313-.713t.713-.3t.712.3z" />
                                    </svg>
                                ):(
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M15.24 2h-3.894c-1.764 0-3.162 0-4.255.148c-1.126.152-2.037.472-2.755 1.193c-.719.721-1.038 1.636-1.189 2.766C3 7.205 3 8.608 3 10.379v5.838c0 1.508.92 2.8 2.227 3.342c-.067-.91-.067-2.185-.067-3.247v-5.01c0-1.281 0-2.386.118-3.27c.127-.948.413-1.856 1.147-2.593s1.639-1.024 2.583-1.152c.88-.118 1.98-.118 3.257-.118h3.07c1.276 0 2.374 0 3.255.118A3.6 3.6 0 0 0 15.24 2"/><path fill="currentColor" d="M6.6 11.397c0-2.726 0-4.089.844-4.936c.843-.847 2.2-.847 4.916-.847h2.88c2.715 0 4.073 0 4.917.847S21 8.671 21 11.397v4.82c0 2.726 0 4.089-.843 4.936c-.844.847-2.202.847-4.917.847h-2.88c-2.715 0-4.073 0-4.916-.847c-.844-.847-.844-2.21-.844-4.936z"/></svg>
                                )}
                            </button>
                            <button  className="btn btn-ghost rounded-full px-1.5 h-8" onClick={handleDownload}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                                    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                        <path fill="currentColor" d="M12 4h2v6h2.5l-4.5 4.5M12 4h-2v6h-2.5l4.5 4.5" />
                                        <path d="M6 19h12" />
                                    </g>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <Highlight code={code.trim()} language={language} theme={themes.nightOwl}>
                        {({ className, style, tokens, getLineProps, getTokenProps }) => (
                            <div className="rounded-br-lg rounded-bl-lg leading-relaxed overflow-auto mt-2 shadow-lg hide-scrollbar max-h-122">
                                  <pre className={`${className} p-4`} style={style}>
                                        {tokens.map((line, i) => (
                                                <div
                                                    key={i}
                                                    {...getLineProps({ line })}
                                                    className="flex"
                                                >
                                                    {/* Line Number */}
                                                    <span
                                                        className="inline-block w-8 text-gray-500 text-right pr-4 select-none"
                                                        aria-hidden="true"
                                                    >
                                                    {i + 1}
                                                    </span>
                                                        {/* Code Content */}
                                                        <span className="flex-1">
                                                          {line.map((token, key) => (
                                                              <span key={key} {...getTokenProps({ token })} />
                                                          ))}
                                                    </span>
                                                </div>
                                        ))}
                                  </pre>
                            </div>
                        )}
                    </Highlight>
                    <div className="flex flex-col bg-nightOwl rounded-lg p-4 shadow-lg mt-3">
                        <h1 className="text-lg font-semibold mb-2">Description</h1>
                        <p>
                            {description}
                        </p>
                    </div>
                </div>
            </dialog>
        </div>
    )
}

CodeView.propTypes = {
    description: PropTypes.string.isRequired,
    codeData: PropTypes.object.isRequired,
    cardId: PropTypes.string.isRequired,
}
export default CodeView
