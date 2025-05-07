import { useRef, useState } from "react";
import "./css/settingsInput.css"

interface settingsInputProsps {
    type?: "number" | "text",
    iconChar?: string
    onKeyDown?: (text: string) => void
    startValue?: string
}

const SettingsInput: React.FC<settingsInputProsps> = ({ type = "text", iconChar = "", onKeyDown, startValue }) => {
    const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null)

    function handleData(event) {
        if (!onKeyDown) return
        if (debounceTimeout) clearTimeout(debounceTimeout);
        if (event.code == "Enter") {
            onKeyDown(event.currentTarget.value)
            return
        }

        const newTimeout = setTimeout(() => {
            if (inputRef.current) onKeyDown(inputRef.current.value)
        }, 300);

        setDebounceTimeout(newTimeout);
    }

    return (
        <div className="settings-input-container">
            <input className="settings-input-field" type={type} value={startValue} onKeyDown={handleData} /><div className="settings-input-type">{iconChar}</div>
        </div>
    )
}

export default SettingsInput
