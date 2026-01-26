import { t } from "@renderer/utils/i18n";
import { decryptAES, decodeHtmlEntities, detectTitle, convertText, genYearsList, getEpisodeDay, getGradientColor, getHistory, getWeek, calculateZoomLevel, capitalizeFirstLetter, checkDate, convertChaptersVTT, convertDateToFormattedString, convertKeybinds, convertMsToMinutes, convertPath, convertSeconds, SaveToClipboard, updateObjectConfig, request, openUrlFolder, getRenderPath, makeSmallText, runYT_DLP } from "./functions"
// @ts-nocheck

try {
    makeSmallText()
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
    runYT_DLP()
} catch (error) {}