import { toast } from "react-toastify";
import { CardProps, notificationProps } from "../interface";
import { readConfig } from "./config";
import { showDialog } from "../context/DialogContext";
import { createDeleteDialog } from "../utils";
import { useContext } from "react";
import { configContext } from "../context/small";

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

export async function deleteHistory(event: MouseEvent, id: string) {
  event.stopPropagation()
  let data = await ReadHistory()
  let index = data.findIndex((item) => item.id === id)
  if (index == -1) {
    toast.error("Anime not found", notificationProps);
    return
  }

  let anime = data[index]
  readConfig().then((config) => {
    if (config.History.history.AlwaysAsk) {
      showDialog({
        type: "custom",
        content: createDeleteDialog(anime.title, "History")
      })
    }
  })
}

export async function ReadHistory(): Promise<CardProps[]> {
  await CheckHistory()
  try {
    const file = await window.api.os.read(appConfigDirPath + "/history.json");
    let data: CardProps[] = JSON.parse(file);
    data = data.reverse();
    console.log(data.map((value: CardProps) => { return { ...value, deletion: deleteHistory } }))
    return data.map((value: CardProps) => { return { ...value, deletion: deleteHistory } })
  } catch (Error) {
    console.error(`${Error} in ReadHistory`);
    return [];
  }
}
