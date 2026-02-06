import Button from '@renderer/components/buttons';
import { openUrlFolder } from './functions';
import { useI18n } from './i18n';

function LocalErrorBoundary(error: any) {
    console.error(error)
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
                <Button content={t("errorboundary.gotohome")} ButtonClass='error-button' onClick={() => {window.location.href = `${window.location.origin}${window.location.pathname}`; window.BrowserWindow.reload()}} />
                <Button content={t("errorboundary.github")} ButtonClass='error-button' onClick={() => createIssue()} />
                <Button content={t("errorboundary.leaveanimu")} ButtonClass='error-button' onClick={() => window.api ? window.BrowserWindow.exit() : ""} />
            </div>
            <div class="main-error-show">
                {t("errorboundary.errormessage", { error: error.toString() })}
            </div>
        </div>
    )
}

export default LocalErrorBoundary;
