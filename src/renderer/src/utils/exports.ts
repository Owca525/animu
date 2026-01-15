import { t } from "@renderer/utils/i18n";
import { decryptAES, decodeHtmlEntities, detectTitle, convertText, genYearsList, getEpisodeDay, getGradientColor, getHistory, getWeek, calculateZoomLevel, capitalizeFirstLetter, checkDate, convertChaptersVTT, convertDateToFormattedString, convertKeybinds, convertMsToMinutes, convertPath, convertSeconds, SaveToClipboard, updateObjectConfig, request, openUrlFolder, getRenderPath } from "./functions"
import { saveConfig } from "./pluginManager";
// @ts-nocheck

try {
    t("")
    decryptAES()
    decodeHtmlEntities()
    detectTitle()
    convertText()
    genYearsList()
    getEpisodeDay()
    getGradientColor()
    getHistory() 
    getWeek()
    calculateZoomLevel()
    capitalizeFirstLetter()
    checkDate()
    convertChaptersVTT()
    convertDateToFormattedString()
    convertKeybinds()
    convertMsToMinutes()
    convertPath()
    convertSeconds()
    SaveToClipboard()
    updateObjectConfig()
    request()
    openUrlFolder()
    getRenderPath()
    saveConfig()
} catch (error) {}