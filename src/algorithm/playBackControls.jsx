import 'react';
import {useState} from "react";

const PlayBackControls = ({
                              isPaused,
                              onPlayPause,
                              speed,
                              onSpeedChange,
                              NotSorting,
                              currentStepIndex,
                              stepsLength
}) => {
    const [stepIndex, setStepIndex] = useState(0);

    return (
        <div className="navbar bg-base-100 sticky bottom-0 z-50 px-4 md:px-6 border-t border-base-200 h-fit min-h-[4rem] shadow-sm">
            {/* Speed Control */}
            <div className="navbar-start">
                <div className="flex items-center gap-2 w-fit">
                    <span className="text-xs font-semibold hidden sm:block">SPEED:</span>
                    <input
                        type="range"
                        value={speed}
                        min={50}
                        max={1000}
                        onChange={(e) => onSpeedChange(e.target.value)}
                        className="range range-primary range-xs w-24 md:w-32"
                        aria-label="Playback speed control"
                    />
                    <span className="text-xs text-base-content/70 ">{speed} ms</span>
                </div>
            </div>

            {/* Playback Controls */}
            <div className="navbar-center">
                <div className="flex justify-center items-center gap-1 md:gap-2">
                    {/* Skip Back */}
                    <button
                        className="btn btn-ghost btn-circle btn-sm"
                        aria-label="Skip backward"
                        disabled={NotSorting}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="16"
                            width="16"
                            viewBox="0 0 512 512"
                            className="fill-current"
                        >
                            <path d="M459.5 440.6c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29l0-320c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4L288 214.3l0 41.7 0 41.7L459.5 440.6zM256 352l0-96 0-128 0-32c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4l-192 160C4.2 237.5 0 246.5 0 256s4.2 18.5 11.5 24.6l192 160c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29l0-64z" />
                        </svg>
                    </button>

                    {/* Rewind */}
                    <button
                        className="btn btn-ghost btn-circle btn-sm"
                        aria-label="Rewind"
                        disabled={NotSorting}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="16"
                            width="10"
                            viewBox="0 0 320 512"
                            className="fill-current"
                        >
                            <path d="M267.5 440.6c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29l0-320c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4l-192 160L64 241 64 96c0-17.7-14.3-32-32-32S0 78.3 0 96L0 416c0 17.7 14.3 32 32 32s32-14.3 32-32l0-145 11.5 9.6 192 160z" />
                        </svg>
                    </button>

                    {/* Play/Pause */}
                    <button
                        className="btn btn-primary btn-circle btn-md"
                        onClick={onPlayPause}
                        disabled={NotSorting}
                    >
                        {!isPaused ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="20"
                                width="12.5"
                                viewBox="0 0 320 512"
                                className="fill-current"
                            >
                                <path d="M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z" />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="20"
                                width="12.5"
                                viewBox="0 0 384 512"
                                className="fill-current"
                            >
                                <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
                            </svg>
                        )}
                    </button>

                    {/* Fast Forward */}
                    <button
                        className="btn btn-ghost btn-circle btn-sm"
                        aria-label="Fast forward"
                        disabled={NotSorting}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="16"
                            width="10"
                            viewBox="0 0 320 512"
                            className="fill-current"
                        >
                            <path d="M52.5 440.6c-9.5 7.9-22.8 9.7-34.1 4.4S0 428.4 0 416L0 96C0 83.6 7.2 72.3 18.4 67s24.5-3.6 34.1 4.4l192 160L256 241l0-145c0-17.7 14.3-32 32-32s32 14.3 32 32l0 320c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-145-11.5 9.6-192 160z" />
                        </svg>
                    </button>

                    {/* Skip Forward */}
                    <button
                        className="btn btn-ghost btn-circle btn-sm"
                        aria-label="Skip forward"
                        disabled={NotSorting}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="16"
                            width="16"
                            viewBox="0 0 512 512"
                            className="fill-current"
                        >
                            <path d="M52.5 440.6c-9.5 7.9-22.8 9.7-34.1 4.4S0 428.4 0 416L0 96C0 83.6 7.2 72.3 18.4 67s24.5-3.6 34.1 4.4L224 214.3l0 41.7 0 41.7L52.5 440.6zM256 352l0-96 0-128 0-32c0-12.4 7.2-23.7 18.4-29s24.5-3.6 34.1 4.4l192 160c7.3 6.1 11.5 15.1 11.5 24.6s-4.2 18.5-11.5 24.6l-192 160c-9.5 7.9-22.8 9.7-34.1 4.4s-18.4-16.6-18.4-29l0-64z" />
                        </svg>
                    </button>

                    {/*<input*/}
                    {/*    type="range"*/}
                    {/*    min={0}*/}
                    {/*    max={stepsLength}*/}
                    {/*    value={stepIndex}*/}
                    {/*    onChange={(currentStepIndex) => setStepIndex(currentStepIndex)}*/}
                    {/*    className="range range-primary range-xs w-24 md:w-80"*/}
                    {/*    aria-label="Playback progress"*/}
                    {/*/>*/}
                    <progress className="progress progress-primary w-70" value={currentStepIndex} max={stepsLength-1}></progress>
                </div>
            </div>

            <div className="navbar-end">
            </div>
        </div>
    );
};

export default PlayBackControls;