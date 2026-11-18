import Hls from "hls.js";
import { removeToast, toast, updateToast } from "./context/ToastNotification";
import { t } from "./i18n";
import { player_script_injector, playerData } from "./types";
import { SheepWorkerInstance } from "./worker";
import { createElement, request } from "./functions";

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

    // I know downloader using hls is weird but i need control to modyfie file to support reAnime For example and i checked
    // Ram usage isn't that bad
    downloadm3u8 = async (data: playerData) => {
        // TODO: ADD SUPPORT FOR SUBTITLES OTHER LANGUAGE AUDIO AND CUSTOM FOLDER TO SAVE AND PROGRESS BAR

        let video = createElement("video")
        video.volume = 0
        video.style.display = "none"

        const res = data["resolution"][0]

        let sheepworker;
        let interval;
        let startNum = 0;

        let manifest_script: player_script_injector[] = data!["scripts"] ?? []
        let hls_manifest_parser: string | undefined
        let hls_arraybuffer_parser: string | undefined

        if (manifest_script.length > 0) {
            sheepworker = new SheepWorkerInstance()

            const f1 = manifest_script.find((v) => v["type"] == "hls_manifest")
            if (f1) hls_manifest_parser = f1["code"]

            const f2 = manifest_script.find((v) => v["type"] == "hls_arraybuffer")
            if (f2) hls_arraybuffer_parser = f2["code"]

        }

        class sheepLoader extends Hls.DefaultConfig.loader {
            load(context: any, config: any, callbacks: any) {
                const now = performance.now()
                request(context.url, { method: "GET", headers: res["reqHeader"] }).then(async (data) => {
                    try {
                        let currentData: any = data.text
                        if (data["status"] == 429) hls?.destroy()

                        // /* IFDEF DEBUG */
                        // console.warn("Player/HLS", data, context)
                        // /* ENDIF */

                        if (!data.success) {
                            console.error("Player/HLS", context, data)
                            callbacks.onError({ type: 'network', details: data["statusText"], fatal: true, code: data["status"] }, context)
                            return
                        }

                        if (context.responseType == "arraybuffer") currentData = data.buffer

                        if (hls_manifest_parser && context["responseType"] == "text") {
                            currentData = await sheepworker!.unsafe_function(hls_manifest_parser, data)
                        }

                        if (hls_arraybuffer_parser && context["responseType"] == "arraybuffer") {
                            currentData = await sheepworker!.unsafe_function(hls_arraybuffer_parser, data)
                        }

                        callbacks.onSuccess({ data: currentData, url: context.url }, {
                            loaded: data.buffer.byteLength,
                            total: data.buffer.byteLength,
                            abort: false,
                            retry: config.maxRetry,
                            chunkCount: 0,
                            bwEstimate: 0,
                            loading: { start: now - 10, first: now - 5, end: now },
                            parsing: { start: now, end: now },
                            buffering: { start: now, first: now, end: now }
                        }, context);
                    } catch (error) {
                        console.error("HLS/sheepLoader", error)
                        throw error
                    }
                });
            }
        }

        const hls = new Hls({
            loader: sheepLoader,
            autoStartLoad: true,
            backBufferLength: 0,
            maxBufferLength: 60,
            maxMaxBufferLength: 120,
        });

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
            data.levels.forEach((level, index) => {
                console.log({
                    index,
                    width: level.width,
                    height: level.height,
                    bitrate: level.bitrate
                });

            });

            hls.currentLevel = data.levels.length - 1;
        });

        // hls.on(Hls.Events.LEVEL_LOADED, async (_, data) => {
        //     const fragments = data.details.fragments;

        //     console.log(fragments);
        // });

        // hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
        //     clearInterval(interval)
        //     console.log("Pobrano:", data);

        //     window.api.os.writeFile(`testFragment/${data.frag.sn}.frag`, data["payload"] as any)

        //     interval = setInterval(() => {
        //         try {
        //             console.log(hls["streamController"]["_state"])
        //         } catch (error) {}
        //     }, 200)
        // });

        hls.on(Hls.Events.FRAG_PARSING_INIT_SEGMENT, (_event, data) => {
            console.log("FRAG_PARSING_INIT_SEGMENT", data);
            if (!data["tracks"]) return
            
            for (const [type, track] of Object.entries(data["tracks"])) {
                if (!track!["initSegment"]) continue;

                window.api.os.writeFile(
                    `testFragment/${type}/init.frag`,
                    new Uint8Array(track!["initSegment"]) as any
                );
            }
        });

        hls.on(Hls.Events.BUFFER_APPENDING, (_event, data) => {
            clearInterval(interval)
            // console.log("BUFFER_APPENDING", data);

            window.api.os.writeFile(`testFragment/${data.type}/${data.frag.sn}`, data.data as any)

            startNum += data.frag.duration

            interval = setInterval(() => {
                try {
                    console.log(hls["streamController"]["_state"])
                    if (hls["streamController"]["_state"] == "IDLE") {
                        video.currentTime = video.currentTime + 20
                        console.log(video.currentTime)
                    }

                    if (hls["streamController"]["_state"] == "ENDED") {
                        hls.destroy()
                        video = undefined as any
                        clearInterval(interval)
                    }
                } catch (error) {}
            }, 200)
        });

        hls.attachMedia(video)

        hls.loadSource(res["url"])
    }

    clear = () => {
        if (this.ToastID) removeToast(this.ToastID)
        if (this.controller) this.controller.abort()
    }
}

export default DownloadManagerInstance