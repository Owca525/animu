import { JSX } from "solid-js";
import { SheepShortcut } from "../hooks/useKeyPress";
import DebuggerSheep, { SheepWindowManager, windowManagerConfig } from "@renderer/WebComponents/DebugWindow";
import { getGlobalCache, setIncognitoMode } from "../stores/global";
import { getConfig } from "../stores/config";
import { ExtractVideo, globalNavigate } from "../functions";
import { removeToast, toast } from "./ToastNotification";

export default function DebugContext(props: { children: JSX.Element }) {
    let active = false

    let instanceDebugger: DebuggerSheep | undefined

    let windowContexts = new Map<string, SheepWindowManager>()

    function createWindow(config: windowManagerConfig) {
        if (!instanceDebugger) return

        const window = instanceDebugger.createWindow(config)

        windowContexts.set(config.title!, window)
        return window
    }

    function createMainWindow() {
        const MainWindow = createWindow({ title: "Main Window" })

        const globalWindow = MainWindow!.CheckBox("Global Cache Window", (val) => {
            if (val) {
                const window = createWindow({ title: "Global Cache Viewer", onExit: () => globalWindow.element!.checked = false })
                window?.ObjectTree(getGlobalCache())
            } else {
                instanceDebugger!.DestroyWindow(windowContexts.get("Global Cache Viewer")!.windowID)
            }
        })

        const configWindow = MainWindow!.CheckBox("Config Window", (val) => {
            if (val) {
                const window = createWindow({ title: "Config Viewer", onExit: () => configWindow.element!.checked = false })
                window?.ObjectTree(getConfig())
            } else {
                instanceDebugger!.DestroyWindow(windowContexts.get("Config Viewer")!.windowID)
            }
        })

        const informationCache = MainWindow!.CheckBox("Information Cache Window", (val) => {
            if (val) {
                const window = createWindow({ title: "Information Cache", onExit: () => informationCache.element!.checked = false })
                try {
                    window?.ObjectTree(JSON.parse(localStorage.getItem("informationCache") as string))
                } catch (error) {
                    window?.Text("Cache Dosen't Exist")
                }
            } else {
                instanceDebugger!.DestroyWindow(windowContexts.get("Information Cache")!.windowID)
            }
        })

        const ExtractorVideoPlayer = MainWindow!.CheckBox("Extractor Video Player", (val) => {
            if (val) {
                const MainWindow = createWindow({ title: "Extractor Video Player", onExit: () => ExtractorVideoPlayer.element!.checked = false })
                if (!MainWindow) return

                const horizontal = MainWindow.CreateHorizontalMenu()

                const input = MainWindow.Input(undefined, "input", horizontal)
                MainWindow.Button("Extract Video", async (): Promise<any> => {
                    // TODO: FIX THIS

                    try {
                        const id = toast("Fetching", { type: "loading", timer: false })
                        const extracted = await ExtractVideo(input.element!["value"])
                        removeToast(id)
                        if (extracted.length <= 0) return toast("Failed Extract", { type: "error" })

                        localStorage.setItem("playerCache", JSON.stringify({
                            data: {
                                title: {
                                    native: extracted[0]["embedTitle"],
                                    romaji: extracted[0]["embedTitle"]
                                },
                                id: crypto.randomUUID(),
                                player_ID: crypto.randomUUID()
                            },
                            save: {
                                last_Time: 0,
                                type: "sub",
                                pluginName: "Animu_Player_Overwriter_Mode",
                                episode: "1"
                            },
                            episodelist: ["1"],
                        }));

                        (window as any).playerOverWriteContent = extracted

                        globalNavigate("/player")

                        setIncognitoMode(true)
                    } catch (error) {

                    }

                }, horizontal)

            } else {
                instanceDebugger!.DestroyWindow(windowContexts.get("Extractor Video Player")!.windowID)
            }
        })

        MainWindow!.CheckBox("Turn i18n Debug", (val) => {
            (window as any).i18nDebug = val
        })
    }

    SheepShortcut(["F1"], () => {
        if (!getConfig().Developer.DeveloperMode) return

        if (!instanceDebugger) {
            instanceDebugger = new DebuggerSheep
            createMainWindow()
        }

        if (!active) {
            windowContexts.forEach((w) => {
                w.windowRef!.style.display = "none"
            })
        } else {
            windowContexts.forEach((w) => {
                w.windowRef!.style.display = ""
            })
        }

        active = !active
    })

    return props.children;
}
