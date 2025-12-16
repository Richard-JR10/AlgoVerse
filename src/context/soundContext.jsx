import { createContext, useContext, useState, useEffect } from 'react';

const SoundContext = createContext();

export function SoundProvider({ children }) {
    const [soundEnabled, setSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('soundEnabled');
        return saved !== null ? JSON.parse(saved) : true;
    })

    const toggleSound = () => {
        setSoundEnabled((prev) => {
            const newValue = !prev;
            localStorage.setItem('soundEnabled', JSON.stringify(newValue));
            return newValue;
        });
    };

    return (
        <SoundContext.Provider value={{ soundEnabled, toggleSound }}>
            {children}
        </SoundContext.Provider>
    );
}

export const useSound = () => useContext(SoundContext);