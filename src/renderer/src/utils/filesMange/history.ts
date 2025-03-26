import { CardProps } from "../interface";
import { readConfig } from "./config";

const DefaultHistory: { history: CardProps[] } = {
  history: [],
};

const appConfigDirPath = await window.api.os.getPath("userData");

export async function CheckHistory() {
  try {
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

    const config = await readConfig();
    let file = (await ReadHistory()).reverse();

    const index = file.findIndex((item) => item.id === save.id);

    if (
      config && config.History.history.LimitedHistory &&
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
  await CheckHistory()
  try {
    const file = await window.api.os.read(appConfigDirPath + "/history.json");
    const data = JSON.parse(file);
    return data.reverse();
  } catch (Error) {
    console.error(`${Error} in ReadHistory`);
    return [];
  }
}
