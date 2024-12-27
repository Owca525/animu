import { error } from '@tauri-apps/plugin-log';
import { getVersion } from "@tauri-apps/api/app";
import * as semver from 'semver';

export async function checkUpdateAnimu() {
    try {
        const response = await fetch('https://api.github.com/repos/Owca525/animu/releases');
        if (response.ok) {
            const data = await response.json()
            const update = semver.gt(data[0].tag_name.replace("v", ""), await getVersion())
            return { update: update, version: data[0].tag_name, url: data[0].html_url }
        }
        return { update: false, version: "", url: "" }
    } catch (Error) {
        error("Error checking update: " + Error)
        return { update: false, version: "", url: "" }
    }
}