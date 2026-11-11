import { removeToast, toast, updateToast } from "./context/ToastNotification";
import { t } from "./i18n";

export interface DownloaderOptions {
    header?: { [key: string]: string }
    startMessage?: string,
    downloadMessage?: string,
    successMessage?: string,
    failedMessage?: string,
    notost?: boolean
}

class DownloadManagerInstance {

    private ToastID: string | undefined = undefined
    private controller: AbortController | undefined = undefined

    download = async (url: string, options: DownloaderOptions = {}) => {

        if (!options["notost"]) this.ToastID = toast(t(options["startMessage"] ?? "download.start"), { type: "loading", "noTimer": true, dontHide: true, progress: 0 })

        this.controller = new AbortController();

        const filename = `${new URL(url).pathname}`.replace("/", "")

        const response = await fetch(url, {
            signal: this.controller.signal
        });

        if (!response.ok) {
            if (this.ToastID) updateToast(this.ToastID, t(options["failedMessage"] ?? "download.failed"), { type: "error", noTimer: false, dontHide: false, duration: 3000 })

            return undefined
        }

        const reader = response.body!.getReader();

        const total = Number(response.headers.get("Content-Length"));

        let received = 0;
        let chunks: string = "";

        if (this.ToastID) updateToast(this.ToastID, t(options["downloadMessage"] ?? "download.download", { filename: filename, progress: (received / 1024 / 1024).toFixed(2), total: (total / 1024 / 1024).toFixed(2) }))

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            if (value) chunks += new TextDecoder().decode(value)
            received += value.length;

            const progress = Math.round((received / total) * 100);
            if (this.ToastID) updateToast(this.ToastID, t(options["downloadMessage"] ?? "download.download", { filename: filename, progress: (received / 1024 / 1024).toFixed(2), total: (total / 1024 / 1024).toFixed(2) }), { progress: progress })
        }

        if (this.ToastID) updateToast(this.ToastID, t(options["successMessage"] ?? "download.success", { filename: filename, total: (total / 1024 / 1024).toFixed(2) }), { type: "success", noTimer: false, dontHide: false, duration: 3000 })

        return chunks
    }

    downloadm3u8 = async () => {

    }

    clear = () => {
        if (this.ToastID) removeToast(this.ToastID)
        if (this.controller) this.controller.abort()
    }
}

export default DownloadManagerInstance