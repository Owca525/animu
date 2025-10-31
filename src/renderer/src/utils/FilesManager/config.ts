import ini from "ini";
import { SettingsConfig } from "../types";
import { setConfig } from "../stores/config";

export async function saveConfig(content: SettingsConfig): Promise<boolean> {
    try {
        const data = ini.stringify(content);
        setConfig(content)
        return await window.api.os.write("config.ini", data)
    } catch (Error) {
        console.error(`${Error} in saveConfig`);
        return false
    }
}
