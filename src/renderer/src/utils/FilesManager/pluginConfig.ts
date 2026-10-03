// TODO: Add support for the browser

import { PluginConfigFormat } from "../types"

export async function SavePluginConfig(name: string, content: PluginConfigFormat[]) {
    let tmpObject = {}
    content.forEach((v) => {
        tmpObject = {...tmpObject, [v["config_name"]]: v["value"]}
    })

    /* IFDEF DEBUG|PROD */
    try {
        await window.api.plugins.saveConfig(name, JSON.parse(JSON.stringify(tmpObject)))
    } catch (error) {
        console.error("Failed Save plugin config", name, content, tmpObject, error)
    }
    /* ENDIF */
}

export async function GetPluginConfig(name: string): Promise<{ [key: string]: string | number | boolean | Object }> {
    /* IFDEF DEBUG|PROD */
    try {
        return await window.api.plugins.getConfig(name)
    } catch (error) {
        return [] as any
    }
    /* ENDIF */
}