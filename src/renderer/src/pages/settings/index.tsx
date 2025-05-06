import CheckBox from "./components/checkBox"
import SettingsInput from "./components/settingsInput"
import "./settings.css"

function settings() {

    return (
        <main>
            <div className="settings-setting-container">
                Test
                <CheckBox />
            </div>

            <br></br>

            <div className="settings-setting-container">
                Test
                <SettingsInput iconChar="s" />
            </div>
        </main>
    )
}

export default settings