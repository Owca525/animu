import { SettingsConfig } from "../types";
import { getConfig, setConfig } from "../stores/config";
import config from "../../../../../resources/config.json"
import { updateObject } from "../functions";
import { unwrap } from "solid-js/store";

export async function saveConfig(content: SettingsConfig): Promise<boolean> {
    try {
        setConfig(content)
        /* IFDEF DEBUG|PROD */
        return await window.api.saveConfig(unwrap(content))
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

export async function UpdateConfig(path: string, val: string | boolean | number) {
    return await saveConfig(updateObject(path, val, getConfig()))
}

/* IFDEF WEB */
export const defaultConfigWeb: SettingsConfig = config as SettingsConfig;
/* ENDIF */