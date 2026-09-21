import Button from '@renderer/components/buttons';
import { globalNavigate, openUrlFolder, reloadWebsite } from './functions';
import { For, Show } from 'solid-js';

// /* IFDEF PROD */
// import logger from './logger';
// /* ENDIF */

function parseStack(stack?: string): { raw: string; functionName?: string; file?: string; line?: string; column?: string; }[] {
    if (!stack) return [];

    return stack
        .split("\n")
        .slice(1)
        .map((line) => {
            const match = line.match(
                /at (.*?) \((.*):(\d+):(\d+)\)/
            );

            if (!match) {
                return { raw: line.trim() };
            }

            return {
                raw: line.trim(),
                functionName: match[1],
                file: match[2],
                line: match[3],
                column: match[4],
            };
        });
}

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

                <Show when={error.stack}>
                    <ul>
                        <For each={parseStack(error.stack)}>
                            {(frame) => (
                                <li>
                                    {frame.functionName ? (
                                        <>
                                            <strong>{frame.functionName}</strong>
                                            {" — "}
                                            {frame.file}:{frame.line}:{frame.column}
                                        </>
                                    ) : (
                                        frame.raw
                                    )}
                                </li>
                            )}
                        </For>
                    </ul>
                </Show>
            </div>
        </div>
    )
}

export default LocalErrorBoundary;
