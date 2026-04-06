import {
    themeFormatType,
    ThemeSchema
} from './types';
import ini from 'ini';
import { themeConfigPath } from '.';
import fs from 'fs';
import path from 'path';
import { ipcMain } from 'electron';
import { checkConfigFolder, getFolderPath } from './utils';

function getThemeConfig(theme: themeFormatType) {
    if (!fs.existsSync(path.join(themeConfigPath, `${theme.themeName}.ini`))) return generateConfigTheme(theme)
    return ini.parse(fs.readFileSync(path.join(themeConfigPath, `${theme.themeName}.ini`), "utf-8"))
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

    fs.writeFileSync(path.join(themeConfigPath, `${theme.themeName}.ini`), ini.stringify(generetatedConfig), "utf-8")
    return generetatedConfig
}

function saveThemeConfig(theme: themeFormatType, data: Record<string, boolean | string> | {}): any {
    let content = data
    if (!fs.existsSync(path.join(themeConfigPath, `${theme.themeName}.ini`))) {
        content = { ...generateConfigTheme(theme), ...content }
    } else {
        content = { ...getThemeConfig(theme), ...content }
    }
    fs.writeFileSync(path.join(themeConfigPath, `${theme.themeName}.ini`), ini.stringify(content), "utf-8")
}


async function getThemeList(themePath: string): Promise<themeFormatType[]> {
    let listFolder = await fs.promises.readdir(themePath)
    let finallist: themeFormatType[] = []
    for (let index = 0; index < listFolder.length; index++) {
        const element = listFolder[index];
        const folderTheme = path.join(themePath, element)
        if (fs.statSync(folderTheme).isDirectory()) {
            let theme = await getMetadataTheme(folderTheme)
            if (theme) finallist.push(theme)
        }
    }
    return finallist.map((theme) => {
        if (!theme.options) return theme
        const mainCSSPath = getFolderPath(theme.mainCSS)
        return {
            ...theme, options: theme.options.map((value) => {
                if (value.css && value.css.replaceAll(" ", "") != "") return { ...value, css: path.join(mainCSSPath, value.css) }
                if (value.dropDown) return { ...value, dropDown: value.dropDown.map((val) => ({ ...val, css: val.css != "" ? path.join(mainCSSPath, val.css) : "" })) }
                return value
            })
        }
    })
}

async function getMetadataTheme(path_theme: string): Promise<themeFormatType | undefined> {
    try {
        const pathTheme = path.join(path_theme, "/theme.json")

        if (!fs.existsSync(pathTheme)) return undefined
        let themeJSON = JSON.parse(fs.readFileSync(pathTheme, "utf-8"))
        const theme = ThemeSchema.parse(themeJSON)
        return { ...theme, mainCSS: path.join(path_theme, theme.mainCSS) }
    } catch (error) {
        console.log("Error parsing theme", error)
        return undefined
    }
}

ipcMain.handle('theme:listTheme', async (): Promise<themeFormatType[]> => {
    // Directory for local css
    let stylesDir: string = "";
    if (process.env.NODE_ENV === 'development') {
        stylesDir = path.join(__dirname, '../../src/renderer/src/themes')
    } else {
        stylesDir = path.join(__dirname, '../../out/renderer/assets/themes')
    }

    const localList = await getThemeList(stylesDir)

    const configcss = checkConfigFolder("themes")
    if (configcss == undefined) return localList

    // Direcotry for config/theme css
    const customList = await getThemeList(configcss)

    return [...localList, ...customList]
});

ipcMain.handle('theme:SaveConfig', async (_event, theme: themeFormatType, data: Record<string, boolean | string>): Promise<void> => saveThemeConfig(theme, data))
ipcMain.handle('theme:ConfigTheme', async (_event, theme: themeFormatType): Promise<Record<string, string | boolean> | {}> => getThemeConfig(theme))
