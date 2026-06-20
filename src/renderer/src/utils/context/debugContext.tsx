import { JSX } from "solid-js";
import { SheepShortcut } from "../hooks/useKeyPress";
import DebuggerSheep, { SheepWindowManager, windowManagerConfig } from "@renderer/WebComponents/DebugWindow";
import { getGlobalCache } from "../stores/global";
import { getConfig } from "../stores/config";

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
