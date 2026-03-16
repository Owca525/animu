import { t } from "@renderer/utils/i18n";
import { decryptAES, decodeHtmlEntities, detectTitle, convertText, genYearsList, getEpisodeDay, getGradientColor, getHistory, getWeek, calculateZoomLevel, capitalizeFirstLetter, checkDate, convertChaptersVTT, convertDateToFormattedString, convertKeybinds, convertMsToMinutes, convertPath, convertSeconds, SaveToClipboard, updateObject, request, openUrlFolder, getRenderPath, makeSmallText, runYT_DLP, SheepFinderAnime2000, timeToSeconds } from "./functions"
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
    updateObject()
    request()
    openUrlFolder()
    getRenderPath()
    runYT_DLP()
    SheepFinderAnime2000()
    timeToSeconds()
} catch (error) {}