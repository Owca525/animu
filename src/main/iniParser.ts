import fs from 'fs';

export function updateObject<T, U>(path: string, value: U, object: T): T {
    if (path == "") return object

    const keys = path.split('.')
    const newObject = object

    let current: any = newObject
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]

        if (!current[key]) current[key] = {}
        current = current[key]
    }

    current[keys[keys.length - 1]] = value
    return newObject
}

export function ParseINI(content: string) {
    const SplitedContent = content.split("\n")
    let object: { [key: string]: any } = {}

    let lastPath = ""
    let listData: { name: string, content: any[], path: string } | undefined

    SplitedContent.forEach((element) => {
        if (element.length <= 0) return

        if (element.startsWith("[") && element.endsWith("]")) {
            const header = element.replace("[", "").replace("]", "").split(".")
            const tmp = header.reduceRight((acc, key) => {
                return { [key]: acc };
            }, {});

            lastPath = header.join(".")

            if (header[0] in object) {
                object = {
                    ...object,
                    ...updateObject(header.join("."), {}, object)
                }
                return
            }

            object = {
                ...object,
                ...tmp
            }
            return
        }

        const splited = element.split("=")
        if (splited.length != 2) return

        if (listData && splited[0] == listData["name"]) {
            listData = {
                ...listData,
                content: [
                    ...listData["content"],
                    splited[1]
                ]
            }
            return
        }

        if (splited[0].includes("[]")) {
            listData = {
                content: [splited[1]],
                name: splited[0],
                path: lastPath
            }
            return
        }

        if (listData && splited[0] != listData["name"]) {
            if (listData["path"].length <= 0) {
                object = {
                    ...object,
                    [listData["name"].replace("[]", "")]: structuredClone(listData.content)
                }
            } else {
                object = updateObject(`${listData["path"]}.${listData["name"].replace("[]", "")}`, structuredClone(listData.content), object)
            }
        }

        let variable = splited[1]
        try {
            variable = JSON.parse(splited[1])
        } catch (error) {}

        if (lastPath.length <= 0) {
            object = {
                ...object,
                [splited[0]]: variable
            }
            return
        }

        object = updateObject(`${lastPath}.${splited[0]}`, variable, object)
    })

    return object
}

export function ParseINIFile(file: string) {
    return ParseINI(fs.readFileSync(file, "utf-8"))
}

function hasNonObjectValues(obj: { [key: string]: any }): boolean {
  return Object.values(obj).some(value => {
    return typeof value !== "object" || value === null;
  });
}

function ConvertObjectTreeToString(content: { [key: string]: any }, path: string) {
    let convertedString = ""
    Object.entries(content).forEach(([key, val]) => {
        if (typeof val == "function") return
        
        if (Array.isArray(val)) {
            val.map((v) => {
                convertedString = `${convertedString}${key}[]=${v}\n`
            })
            return
        }
    
        if (typeof val == "object") {
            if (hasNonObjectValues(val)) {
                convertedString = `${convertedString}\n${path.length <= 0 ? `[${key}]\n` : `[${path}.${key}]\n`}`
            }

            convertedString = `${convertedString}${ConvertObjectTreeToString(val, path.length <= 0 ? key : `${path}.${key}`)}`
            return
        }

        convertedString += `${key}=${val}\n`
    })
    return convertedString
}

export function ConvertObjectToINI(content: { [key: string]: any }): string {
    return ConvertObjectTreeToString(content, "")
}