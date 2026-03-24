import { playlistFormatData } from "../types"

// TODO: ADD SUPPORT FOR BROWSER
export async function saveToPlaylist(playlist: string, data: playlistFormatData): Promise<boolean> {
    return await window.api.animePlaylist.save(playlist, data)
}

export async function updatePlaylist(playlist: string, data: playlistFormatData): Promise<boolean> {
    return await window.api.animePlaylist.update(playlist, data)
}

export async function removeInPlaylist(playlist: string, animeID: string): Promise<boolean> {
    return await window.api.animePlaylist.delete(playlist, animeID)
}

export async function deletePlaylist(playlist: string): Promise<boolean> {
    return await window.api.animePlaylist.deleteAll(playlist)
}

export async function readPlaylist(playlist: string): Promise<playlistFormatData[]> {
    return await window.api.animePlaylist.read(playlist)
}