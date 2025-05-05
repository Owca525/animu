import "./settings.css"

function settings() {

    return (
        <main>
            <div className="settings-setting-container">
                Test
                <input className="checkbox" type="checkbox"></input>
            </div>

            <br></br>

            <div className="settings-setting-container">
                Test
                <div className="input-container">
                    <input className="input-field" type="text"></input><div className="input-type">%</div>
                </div>
            </div>
        </main>
    )
}

export default settings