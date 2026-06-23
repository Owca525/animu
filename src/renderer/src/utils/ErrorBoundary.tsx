import Button from '@renderer/components/buttons';
import { globalNavigate, openUrlFolder, reloadWebsite } from './functions';

// /* IFDEF PROD */
// import logger from './logger';
// /* ENDIF */

function LocalErrorBoundary(error: any) {
    console.error(error)

    // /* IFDEF PROD */
    // logger.saveLogs()
    // /* ENDIF */

    function createIssue() {
        // https://github.com/{owner}/{repo}/issues/new?title={title}&body={data}&labels={label}
        let title = error.message
        let body = error.stack
        let url = `https://github.com/Owca525/animu/issues/new?title=${title}&body=${body}&labels=bug`
        openUrlFolder(url)
    }

    return (
        <div class='main-error-container'>
            <div class="main-error-text">{"Critical Error has occured, do you want to go home?"}</div>
            <div class="main-error-button-container">
                <Button content={"Go Back Home"} ButtonClass='error-button' onClick={() => { globalNavigate(""); window.BrowserWindow.reload() }} />
                <Button content={"Send Report To Github"} ButtonClass='error-button' onClick={() => createIssue()} />
                {/* IFDEF PROD|DEBUG */}
                <Button content={"Leave Animu"} ButtonClass='error-button' onClick={() => window.api ? window.BrowserWindow.exit() : reloadWebsite()} />
                {/* ENDIF */}
            </div>
            <div class="main-error-show">
                {`Error Message: ${error.toString()}`}
            </div>
        </div>
    )
}

export default LocalErrorBoundary;
