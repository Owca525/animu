import Button from '@renderer/components/buttons';
import { globalNavigate, openUrlFolder, reloadWebsite } from './functions';
import { useI18n } from './i18n';
import { Show } from 'solid-js';

// /* IFDEF PROD */
// import logger from './logger';
// /* ENDIF */

function LocalErrorBoundary(error: any) {
    console.error(error)

    // /* IFDEF PROD */
    // logger.saveLogs()
    // /* ENDIF */

    const { t } = useI18n()

    function createIssue() {
        // https://github.com/{owner}/{repo}/issues/new?title={title}&body={data}&labels={label}
        let title = error.message
        let body = error.stack
        let url = `https://github.com/Owca525/animu/issues/new?title=${title}&body=${body}&labels=bug`
        openUrlFolder(url)
    }

    return (
        <div class='main-error-container'>
            <div class="main-error-text">{t("globalError")}</div>
            <div class="main-error-button-container">
                <Button content={t("errorboundary.gotohome")} ButtonClass='error-button' onClick={() => {globalNavigate(""); window.BrowserWindow.reload()}} />
                <Button content={t("errorboundary.github")} ButtonClass='error-button' onClick={() => createIssue()} />
                <Show when={window.api}>
                    <Button content={t("errorboundary.leaveanimu")} ButtonClass='error-button' onClick={() => window.api ? reloadWebsite() : ""} />
                </Show>
            </div>
            <div class="main-error-show">
                {t("errorboundary.errormessage", { error: error.toString() })}
            </div>
        </div>
    )
}

export default LocalErrorBoundary;
