import { themeFormatType } from './types';
import { themeConfigPath } from '.';
import fs from 'fs';
import path from 'path';
import { ipcMain } from 'electron';
import { checkConfigFolder } from './utils';
import { ConvertObjectToINI, ParseINI } from './iniParser';

function getThemeConfig(theme: themeFormatType) {
    if (!fs.existsSync(path.join(themeConfigPath, `${theme.themeName}.ini`))) return generateConfigTheme(theme)
    return ParseINI(fs.readFileSync(path.join(themeConfigPath, `${theme.themeName}.ini`), "utf-8"))
}

function generateConfigTheme(theme: themeFormatType) {
    if (!theme.options) return {}

    let generetatedConfig: Record<string, boolean | string> = {}

    for (let index = 0; index < theme.options.length; index++) {
        const element = theme.options[index];

        if (element.css != undefined) {
            generetatedConfig[element.name] = element.default ? element.default : false
        } else if (element.dropDown) {
            generetatedConfig[element.name] = element.dropDown[0].option
        }
    }

    fs.writeFileSync(path.join(themeConfigPath, `${theme.themeName}.ini`), ConvertObjectToINI(generetatedConfig), "utf-8")
    return generetatedConfig
}

function saveThemeConfig(theme: themeFormatType, data: Record<string, boolean | string> | {}): any {
    let content = data
    if (!fs.existsSync(path.join(themeConfigPath, `${theme.themeName}.ini`))) {
        content = { ...generateConfigTheme(theme), ...content }
    } else {
        content = { ...getThemeConfig(theme), ...content }
    }
    fs.writeFileSync(path.join(themeConfigPath, `${theme.themeName}.ini`), ConvertObjectToINI(content), "utf-8")
}

// TODO: Rewrite Loading Theme
export function getThemeList(themePath: string | undefined): themeFormatType[] {
    if (!themePath) return []

    let listFolder = fs.readdirSync(themePath)
    let finallist: themeFormatType[] = []
    for (let index = 0; index < listFolder.length; index++) {
        const element = listFolder[index];
        const folderTheme = path.join(themePath, element)
        if (fs.statSync(folderTheme).isDirectory()) {
            let theme = getMetadataTheme(folderTheme)
            if (theme) finallist.push(theme)
        }
    }
    return finallist.map((theme) => {
        try {
            const theme_folder = path.dirname(theme.mainCSS)
            if (!theme.options) return { ...theme, mainCSS: theme.mainCSS }
            return {
                ...theme,
                mainCSS: theme.mainCSS,
                options: theme.options.map((value) => {
                    if (value.css && value.css.replaceAll(" ", "") != "") return {
                        ...value,
                        css: path.join(`${theme_folder}`, value.css ?? "")
                    }

                    if (value.dropDown) return {
                        ...value, dropDown: value.dropDown.map((css_drop) => ({
                            ...css_drop,
                            css: css_drop.css != "" ? path.join(`${theme_folder}`, css_drop.css ?? "") : ""
                        }))
                    }

                    return value
                })
            }
        } catch (error) {
            console.error("Error in getThemeList", error, theme)

            return { ...theme, mainCSS: theme.mainCSS }
        }
    })
}

function themeParser(theme: themeFormatType): themeFormatType | undefined {
    try {
        if (!("author" in theme) || !("themeName" in theme) || !("mainCSS" in theme)) return
        let tmpTheme: themeFormatType = {
            author: theme["author"],
            themeName: theme["themeName"],
            mainCSS: theme["mainCSS"],
        } as any

        if (theme["api"]) tmpTheme = { ...tmpTheme, api: theme["api"] }
        if (theme["version"]) tmpTheme = { ...tmpTheme, version: theme["version"] }
        if (theme["options"]) {
            const tmpOptions = theme["options"].map((option) => {
                let tmpDropdown: any = undefined
                if (option["dropDown"]) {
                    tmpDropdown = option["dropDown"].map((v) => ({
                        option: v["option"],
                        css: v["css"],
                    }))
                }

                return {
                    name: option["name"],
                    dropDown: tmpDropdown,
                    css: option["css"],
                    default: option["default"],
                }
            })

            tmpTheme = { ...tmpTheme, options: tmpOptions }
        }

        return tmpTheme
    } catch (error) {
        console.error("Failed Parse Theme", error)
        return
    }
}

function getMetadataTheme(path_theme: string): themeFormatType | undefined {
    try {
        const pathTheme = path.join(`${path_theme}`, "/theme.json")

        if (!fs.existsSync(pathTheme)) return
        let themeJSON = JSON.parse(fs.readFileSync(pathTheme, "utf-8"))
        const theme = themeParser(themeJSON)
        if (!theme) return

        return { ...theme, mainCSS: path.join(`${path.basename(path_theme)}`, theme.mainCSS) }
    } catch (error) {
        console.error("Error parsing theme", error)
        return
    }
}

ipcMain.handle('theme:listTheme', async (): Promise<themeFormatType[]> => {
    return getThemeList(checkConfigFolder("themes"))
});

ipcMain.handle('theme:SaveConfig', async (_event, theme: themeFormatType, data: Record<string, boolean | string>): Promise<void> => saveThemeConfig(theme, data))
ipcMain.handle('theme:ConfigTheme', async (_event, theme: themeFormatType): Promise<Record<string, string | boolean> | {}> => getThemeConfig(theme))
