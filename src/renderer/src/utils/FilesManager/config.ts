import { SettingsConfig } from "../types";
import { setConfig } from "../stores/config";
import config from "../../../../../resources/config.json"

export async function saveConfig(content: SettingsConfig): Promise<boolean> {
    try {
        setConfig(content)
        /* IFDEF DEBUG|PROD */
        return await window.api.saveConfig(content)
        /* ENDIF */

        /* IFDEF WEB */
        localStorage.setItem("config", JSON.stringify(content))
        /* ENDIF */
        return true
    } catch (Error) {
        console.error(`${Error} in saveConfig`);
        return false
    }
}

/* IFDEF WEB */
export const defaultConfigWeb: SettingsConfig = config as SettingsConfig;
/* ENDIF */