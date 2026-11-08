import { toast, updateToast } from "./context/ToastNotification";
import { t } from "./i18n";

export interface DownloaderOptions {
    header?: { [key: string]: string }
    startMessage?: string,
    downloadMessage?: string,
    successMessage?: string
    notost?: boolean
}

class DownloadManagerInstance {

    download = async (url: string, options: DownloaderOptions = {}) => {
        let ToastID: string | undefined = undefined

        if (!options["notost"]) toast(t(options["startMessage"] ?? "download.start"), { type: "loading", "noTimer": true, dontHide: true, progress: 0 })

        const filename = `${new URL(url).pathname}`.replace("/", "")

        const response = await fetch(url);

        if (!response.ok) return undefined

        const reader = response.body!.getReader();

        const total = Number(response.headers.get("Content-Length"));

        let received = 0;
        let chunks: string = "";

        if (ToastID) updateToast(ToastID, t(options["downloadMessage"] ?? "download.download", { filename: filename, progress: (received / 1024 / 1024).toFixed(2), total: (total / 1024 / 1024).toFixed(2) }))

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            if (value) chunks += new TextDecoder().decode(value)
            received += value.length;

            const progress = Math.round((received / total) * 100);
            if (ToastID) updateToast(ToastID, t(options["downloadMessage"] ?? "download.download", { filename: filename, progress: (received / 1024 / 1024).toFixed(2), total: (total / 1024 / 1024).toFixed(2) }), { progress: progress })
        }

        if (ToastID) updateToast(ToastID, t(options["successMessage"] ?? "download.success", { filename: filename, total: (total / 1024 / 1024).toFixed(2) }), { type: "success", noTimer: false, dontHide: false })

        return chunks
    }

    downloadm3u8 = async () => {

    }
}

const DownloadManager = new DownloadManagerInstance()

window["DownloadManager"] = DownloadManager

export default DownloadManager