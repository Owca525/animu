const communication = `
self.onmessage = (event) => {
    const { fn, data } = event.data;

    try {
        const execute = new Function(
            "data",
            \`"use strict"; return (\${fn})(data);\`
        );

        const result = execute(data);

        self.postMessage({
            success: true,
            data: result
        });
    } catch (error) {
        self.postMessage({
            success: false,
            error: String(error)
        });
    }
};`

export function Run_hls_manifest_script(fn: string, data: { [key: string]: any }): Promise<any> {
    const blobCode = new Blob([communication], { type: "text/javascript" });
    const function_blob = URL.createObjectURL(blobCode);

    const worker = new Worker(function_blob);

    // /* IFDEF DEBUG */
    // console.warn("Worker/Run_hls_manifest_script", fn, data)
    // /* ENDIF */

    return new Promise((resolve, reject) => {
        const handler = (event) => {
            worker.removeEventListener("message", handler);
            // /* IFDEF DEBUG */
            // console.warn("Worker/Run_hls_manifest_script event", event)
            // /* ENDIF */
            if (event.data.success) {
                resolve(event.data.data);
                worker.terminate()
            } else {
                reject(new Error(event.data));
                worker.terminate()
            }
        };

        worker.onmessage = handler;
        worker.onerror = (ev) => {
            console.error("Run_hls_manifest_script error", ev)
            worker.terminate()
            reject(new Error(`${ev}`));
        }
        worker.onmessageerror = (ev) => {
            console.error("Run_hls_manifest_script onmessageerror", ev)
            worker.terminate()
            reject(new Error(`${ev}`));
        }

        worker.postMessage({
            fn: fn,
            data
        });
    });
}