import { CardProps } from "./interface";
import { readConfig } from "./config";

const DefaultHistory: { history: CardProps[] } = {
  history: [],
};

export async function CheckHistory() {
  try {
    const appConfigDirPath = await window.api.os.getPath("userData");
    window.api.os.exists(appConfigDirPath + "/history.json");
    if (await window.api.os.exists(appConfigDirPath + "/history.json") == false) {
      window.api.os.write(
        appConfigDirPath + "/history.json",
        JSON.stringify(DefaultHistory)
      );
    }
  } catch (Error) {
    console.error(`${Error} in CheckHistory`);
  }
}

export async function SaveHistory(save: CardProps) {
  try {
    await CheckHistory();
    const appConfigDirPath = await window.api.os.getPath("userData");

    const config = await readConfig();
    let file = (await ReadHistory()).reverse();

    const index = file.findIndex((item) => item.id === save.id);

    if (
      config &&
      file.length >= parseInt(config.History.history.maxSave.toString())
    )
      file.shift();
    if (index != -1) file.splice(index, 1);

    file.push(save);
    window.api.os.write(
      appConfigDirPath + "/history.json",
      JSON.stringify(file)
    );
  } catch (Error) {
    console.error(`${Error} in SaveHistory`);
  }
}

export async function ReadHistory(): Promise<CardProps[]> {
  try {
    const appConfigDirPath = await window.api.os.getPath("userData");
    const file = await window.api.os.read(appConfigDirPath + "/history.json");
    const data = JSON.parse(file);
    return data.reverse();
  } catch (Error) {
    console.error(`${Error} in ReadHistory`);
    return [];
  }
}
