import { app, ipcMain } from "electron"
import fs from 'fs';
import ini from 'ini';
import path from 'path';
import { animuPlugins, newConfigPath, pluginsConfigPath } from ".";
import { pluginRepoExpanded } from "./types";
import { advanceRequest } from "./request";
import { sha256FromString } from "./utils";

function getPluginConfig(name: string, config: { [key: string]: any }) {
    if (!fs.existsSync(path.join(pluginsConfigPath, `${name}.ini`))) return generetaPluginConfig(name, config)
    return ini.parse(fs.readFileSync(path.join(pluginsConfigPath, `${name}.ini`), "utf-8"))
}

function generetaPluginConfig(name: string, config: { [key: string]: any }) {
    fs.writeFileSync(path.join(pluginsConfigPath, `${name}.ini`), ini.stringify(config), "utf-8")
    return config
}

function savePluginConfig(name: string, config: { [key: string]: any }) {
    fs.writeFileSync(path.join(pluginsConfigPath, `${name}.ini`), ini.stringify(config), "utf-8")
}

function extractPlugin(folderPlugins: string, type: "official" | "user") {
    if (!fs.existsSync(folderPlugins)) return []
    const folder = fs.readdirSync(folderPlugins)

    let files = folder.filter((item) => {
        return fs.statSync(path.join(folderPlugins, item)).isFile()
    })

    files = files.filter((ele) => ele.endsWith(".js"))
    if (files.length <= 0) return []

    return files.map((item) => {
        const content = fs.readFileSync(path.join(folderPlugins, item), "utf-8")
        const isPlayer = content.includes("extractPlayerData")
        return { file: item, content: content, type, sha256: sha256FromString(content), pluginType: isPlayer ? "player" : "information" }
    })
}

ipcMain.handle('plugins:list', (_event) => {
    const user = extractPlugin(path.join(newConfigPath, "plugins"), "user")
    const official = extractPlugin(path.join(app.getPath("userData"), "animuPlugins"), "official")
    return [...user, ...official]
})

ipcMain.handle("plugins:install", async (_, plugin: pluginRepoExpanded) => {
    const resp = await advanceRequest(`${plugin.repoURL}${plugin.file}`)
    if (!resp.success || !resp.text) return
    fs.writeFileSync(path.join(animuPlugins, path.basename(plugin.file)), resp.text, "utf-8")
})

ipcMain.handle("plugins:getConfig", (_, name: string, config: { [key: string]: any }) => getPluginConfig(name, config))
ipcMain.handle("plugins:saveConfig", (_, name: string, config: { [key: string]: any }) => savePluginConfig(name, config))