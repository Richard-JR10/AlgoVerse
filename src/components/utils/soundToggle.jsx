// src/components/ThemeToggle.jsx
import { useSound } from '../../context/soundContext.jsx';

export default function SoundToggle() {
    const { soundEnabled, toggleSound } = useSound();
    const isChecked = String(soundEnabled) === 'true';

    return (
        <label className="flex flex-row text-base-content mr-4 items-center">
            <div className="p-2 bg-base-200 text-sm font-semibold">Sound:</div>
            <input
                type="checkbox"
                value="synthwave"
                checked={isChecked}
                className="toggle toggle-primary"
                onChange={toggleSound}
            />
        </label>
    );
}