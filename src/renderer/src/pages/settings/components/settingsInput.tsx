import "./css/settingsInput.css"

interface settingsInputProsps {
    type?: "number" | "text",
    iconChar?: string
    onKeyDown?: (text: string) => void
    startValue?: string
}

const SettingsInput: React.FC<settingsInputProsps> = ({ type = "text", iconChar = "", onKeyDown, startValue }) => {
    function handleData(event) {
        if (!onKeyDown) return
        onKeyDown(event.target.value)
    }

    return (
        <div className="settings-input-container">
            <input className="settings-input-field" type={type} value={startValue} onChange={handleData} /><div className="settings-input-type">{iconChar}</div>
        </div>
    )
}

export default SettingsInput
