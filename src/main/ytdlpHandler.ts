import path from "node:path"
import fs from "fs"
import { animuUserData } from "."
import { advanceRequest } from "./request"
import { spawn } from "node:child_process"
import { app } from "electron"

export class yt_dlpInstance {
    currentVersion: string = ""
    versionList: string[] = []

    private checkSystem = () => {
        if (process.platform == "win32") return "yt-dlp.exe"
        if (process.platform == "linux") return "yt-dlp"
        return "yt-dlp"
    }

    private informationPath: string = path.join(app.getPath("userData"), "yt-dlp.txt")
    private currentRepo: string = "https://api.github.com/repos/yt-dlp/yt-dlp/"
    private fileExec: string = this.checkSystem()

    constructor(repo: string) {
        this.currentRepo = repo

        if (!fs.existsSync(this.informationPath)) {
            this.checkUpdate()
            return
        }

        const contentReaded = fs.readFileSync(this.informationPath, "utf-8")

        this.currentVersion = contentReaded
        this.checkUpdate()

    }

    getVersionList = async (): Promise<{ ver: string, assets: { name: string, url: string }[] }[]> => {
        const releasesResponse = await advanceRequest(`${this.currentRepo}releases`)
        if (!releasesResponse["json"] || !releasesResponse["success"]) return []

        try {
            this.versionList = releasesResponse["json"].map(element => element["tag_name"])

            return releasesResponse["json"].map(element => ({
                ver: element["tag_name"],
                assets: element["assets"].map(element => ({ name: element["name"], url: element["browser_download_url"] }))
            }));
        } catch (error) {
            console.error("getVersionList get error", error)
            return []
        }
    }

    install = async (ver: string) => {
        const versionList = await this.getVersionList()
        if (versionList.length <= 0) return

        let version = versionList.find(el => el["ver"] == ver)
        if (!version) version = versionList[0]

        const file = version["assets"].find(exe => exe["name"] == this.fileExec)
        if (!file) return console.error("Failed Find Exec yt-dlp", this.fileExec, versionList)

        const resp = await advanceRequest(file["url"])
        if (!resp.success) return console.error(`Failed Download yt-dlp ${version["ver"]}: `, file["name"])

        fs.writeFileSync(this.informationPath, version["ver"], "utf-8")
        fs.writeFileSync(path.join(animuUserData, file["name"]), Buffer.from(resp.buffer as any), "binary")
        fs.chmodSync(path.join(animuUserData, file["name"]), 0o755)
    }

    checkUpdate = async () => {
        const latestResponse = await advanceRequest(`${this.currentRepo}releases/latest`)
        if (!latestResponse["json"] || !latestResponse["success"]) return

        try {
            if (latestResponse["tag_name"] != this.currentVersion) return this.install(latestResponse["tag_name"])
            else {
                fs.writeFileSync(this.informationPath, latestResponse["tag_name"], "utf-8")
            }
        } catch (error) {
            console.error("Failed Check Update in yt-dlp", error)
        }
    }

    execute = (commands: string[]) => {
        let execPath = path.join(animuUserData, this.fileExec)

        return new Promise(async (resolve, reject) => {
            const yt = spawn(execPath, ["-j", "--flat-playlist", ...commands]);

            let data = "";
            let error = "";

            yt.stdout.on("data", chunk => {
                data += chunk.toString();
            });

            yt.stderr.on("data", chunk => {
                error += chunk.toString();
            });

            yt.on("close", code => {
                if (code !== 0) {
                    reject(error);
                } else {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        resolve(data)
                    }
                }
            });
        });
    }
}