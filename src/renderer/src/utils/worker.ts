const communication = `
self.onmessage = (event) => {
    const { fn, data } = event.data;

    try {
        const execute = new Function(
            "data",
            \`return (\${fn})(data);\`
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

export class SheepWorkerInstance {
    private worker: Worker | undefined

    constructor() {
        const blobCode = new Blob([communication], { type: "text/javascript" });
        const function_blob = URL.createObjectURL(blobCode);

        this.worker = new Worker(function_blob)
    }

    function = async (code: string, data: { [key: string]: any }) => {
        return new Promise((resolve, reject) => {
            if (!this.worker) return reject(new Error("worker/SheepWorkerInstance Worker Dosen't exist"))

            const error = (event) => {
                reject(new Error(event));
            };

            const handler = (event) => {
                this.worker!.removeEventListener("message", handler)
                this.worker!.removeEventListener("messageerror", error)
                this.worker!.removeEventListener("error", error)

                // /* IFDEF DEBUG */
                // console.warn("Worker/SheepWorkerInstance event", event)
                // /* ENDIF */

                if (event["data"]["success"]) {
                    resolve(event.data.data);
                }

                reject(new Error(event.data));
            };

            this.worker.addEventListener("message", handler)
            this.worker.addEventListener("messageerror", error)
            this.worker.addEventListener("error", error)

            this.worker.postMessage({
                fn: code,
                data
            });
        })
    }

    unsafe_function = (code: string, data: { [key: string]: any }) => {
        try {
            const execute = new Function(
                "data",
                `return (${code})(data);`
            );

            return execute(data)
        } catch (error) {
            console.error("SheepWorkerInstance/unsafe_function", error)
            return undefined
        }
    }

    dispose = () => {
        this.worker?.terminate()
    }
}
