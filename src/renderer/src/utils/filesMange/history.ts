import { toast } from "react-toastify";
import { CardProps, notificationProps } from "../interface";
import { readConfig } from "./config";
import { showDialog } from "../context/DialogContext";
import { createDeleteDialog } from "../utils";

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

async function deleteHistory(data: CardProps[], id: string) {
  try {
    let file = data.filter(item => item.id !== id);
    window.api.os.write(
      appConfigDirPath + "/history.json",
      JSON.stringify(file.reverse())
    );
    toast.info("Anime succesfully delete from history", notificationProps);
    // TODO: Make reload history menu
  } catch (error) {
    toast.error(`Failing delete anime from history`, notificationProps);
  }
}

export async function DialogDeletionHistory(event: MouseEvent, id: string) {
  event.stopPropagation()
  let data = await ReadHistory()
  let config = await readConfig()
  let index = data.findIndex((item) => item.id === id)
  if (index == -1) {
    toast.error("Anime not found", notificationProps);
    return
  }

  let anime = data[index]

  if (config.History.history.AlwaysAsk) {
    showDialog({
      type: "custom",
      content: await createDeleteDialog(
        anime.title, 
        "History",
        () => deleteHistory(data, anime.id)
      )
    })
  } else {
    deleteHistory(data, anime.id)
  }
}

export async function ReadHistory(): Promise<CardProps[]> {
  await CheckHistory()
  try {
    const file = await window.api.os.read(appConfigDirPath + "/history.json");
    let data: CardProps[] = JSON.parse(file);
    data = data.reverse();
    return data.map((value: CardProps) => { return { ...value, deletion: DialogDeletionHistory } })
  } catch (Error) {
    console.error(`${Error} in ReadHistory`);
    return [];
  }
}
