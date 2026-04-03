import fs from 'fs';
import path from 'path';
import { animuPlaylistPath } from '.';
import { ipcMain } from 'electron';
import { playlistFormatData } from './types';

ipcMain.handle("playlist:save", async (_, playlist: string, data: playlistFormatData) => {
    try {
        const playlistPath = path.join(animuPlaylistPath, `${btoa(playlist)}.json`)
        if (!fs.existsSync(playlistPath)) {
            fs.writeFileSync(playlistPath, JSON.stringify([data]), "utf-8")
            return true
        }
        const tmpPlaylist = JSON.parse(fs.readFileSync(playlistPath, "utf-8"))

        fs.writeFileSync(playlistPath, JSON.stringify([...tmpPlaylist, data]), "utf-8")
        return true
    } catch (error) {
        console.error("Failed Save Playlist", error)
        return false
    }
});

ipcMain.handle("playlist:update", async (_, playlist: string, data: playlistFormatData) => {
    try {
        const playlistPath = path.join(animuPlaylistPath, `${btoa(playlist)}.json`)
        
        if (!fs.existsSync(playlistPath)) return false
        const tmpPlaylist: playlistFormatData[] = JSON.parse(fs.readFileSync(playlistPath, "utf-8"))

        fs.writeFileSync(playlistPath, JSON.stringify([...tmpPlaylist.map((v) => v.anime.AnimeData.id == data.anime.AnimeData.id ? data : v)]), "utf-8")
        return true
    } catch (error) {
        console.error("Failed Update Playlist", error)
        return false
    }
});

ipcMain.handle("playlist:delete", async (_, playlist: string, animeID: string) => {
    try {
        const playlistPath = path.join(animuPlaylistPath, `${btoa(playlist)}.json`)
        if (!fs.existsSync(playlistPath)) return false
        const tmpPlaylist: playlistFormatData[] = JSON.parse(fs.readFileSync(playlistPath, "utf-8"))

        fs.writeFileSync(playlistPath, JSON.stringify([...tmpPlaylist.filter((v) => v.anime.AnimeData.id != animeID)]), "utf-8")
        return true
    } catch (error) {
        console.error("Failed Delete Playlist", error)
        return false
    }
});

ipcMain.handle("playlist:deleteAll", async (_, playlist: string) => {
    try {
        const playlistPath = path.join(animuPlaylistPath, `${btoa(playlist)}.json`)
        if (!fs.existsSync(playlistPath)) return true
        fs.rmSync(playlistPath)
        return true
    } catch (error) {
        console.error("Failed Everything From Playlist", error)
        return false
    }
});

ipcMain.handle("playlist:read", async (_, playlist: string) => {
    try {
        const playlistPath = path.join(animuPlaylistPath, `${btoa(playlist)}.json`)
        if (!fs.existsSync(playlistPath)) return []
        return JSON.parse(fs.readFileSync(playlistPath, "utf-8"))
    } catch (error) {
        console.error("Failed read Playlist", error)
        return []
    }
});