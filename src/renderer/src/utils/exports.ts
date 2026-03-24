import { t } from "@renderer/utils/i18n";
import { decodeHtmlEntities, detectTitle, convertText, genYearsList, getEpisodeDay, getGradientColor, getHistory, getWeek, calculateZoomLevel, capitalizeFirstLetter, checkDate, convertChaptersVTT, convertDateToFormattedString, convertKeybinds, convertMsToMinutes, convertPath, convertSeconds, SaveToClipboard, updateObject, request, openUrlFolder, getRenderPath, makeSmallText, runYT_DLP, SheepFinderAnime2000, timeToSeconds, dateToUnix } from "./functions"
import { getConfig } from "./stores/config";
import { getGlobalCache } from "./stores/global";
// @ts-nocheck

try {
    makeSmallText()
    t("")
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
    getConfig()
    getGlobalCache()
    dateToUnix()
} catch (error) {}