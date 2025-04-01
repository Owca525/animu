import { toast } from "react-toastify";
import { CardProps, notificationProps } from "../interface";
import { readConfig } from "./config";
import { showDialog } from "../context/DialogContext";
import { createDeleteDialog } from "../utils";

const DefaultContinue: { continue: CardProps[] } = {
  continue: [],
};

const appConfigDirPath = await window.api.os.getPath("userData");

export async function CheckContinue() {
  try {
    window.api.os.exists(appConfigDirPath + "/continueWatch.json");

    if (
      await window.api.os.exists(appConfigDirPath + "/continueWatch.json") == false
    ) {
      window.api.os.write(
        appConfigDirPath + "/continueWatch.json",
        JSON.stringify(DefaultContinue)
      );
    }
  } catch (Error) { console.error(`${Error} in CheckContinue`) }
}

export async function SaveContinue(save: CardProps) {
  try {
    await CheckContinue()
    const file = await window.api.os.read(appConfigDirPath + "/continueWatch.json");
    const data = JSON.parse(file) as { continue: CardProps[] };
    const index = data.continue.findIndex((item) => item.id === save.id);

    if (index != -1) data.continue.splice(index, 1);

    data.continue.push(save);
    window.api.os.write(appConfigDirPath + "/continueWatch.json", JSON.stringify(data))
  } catch (Error) { console.error(Error) }
}

export async function DialogDeletionContinue(event: MouseEvent, id: string) {
  event.stopPropagation()
  let data = await ReadContinue()
  let config = await readConfig()
  let index = data.findIndex((item) => item.id === id)
  if (index == -1) {
    toast.error("Anime not found", notificationProps);
    return
  }

  let anime = data[index]

  try {
    if (config.History.history.AlwaysAsk) {
      showDialog({
        type: "custom",
        content: await createDeleteDialog(
          anime.title, 
          "Continue Watch",
          () => DeleteFromcontinue(anime)
        )
      })
    } else {
      DeleteFromcontinue(anime)
    }
    toast.info("Anime succesfully delete from history", notificationProps);
  } catch (error) {
    toast.error(`Failing delete anime from history`, notificationProps);
  }
}

export async function DeleteFromcontinue(data: CardProps) {
  try {
    await CheckContinue()
    window.api.os.read(appConfigDirPath + "/continueWatch.json")
    const file = await window.api.os.read(appConfigDirPath + "/continueWatch.json")
    const list = JSON.parse(file) as { continue: CardProps[] };
    const index = list.continue.findIndex(
      (item) => item.player?.episode.ep === data.player?.episode.ep && item.id === data.id
    );

    if (index != -1) list.continue.splice(index, 1);
    
    window.api.os.write(appConfigDirPath + "/continueWatch.json", JSON.stringify(list))
  } catch (Error) { console.error(`${Error} in DeleteFromcontinue`) }
}

export async function ReadContinue(): Promise<CardProps[]> {
  try {
    await CheckContinue()
    const file = await window.api.os.read(appConfigDirPath + "/continueWatch.json")
    const data = JSON.parse(file) as { continue: CardProps[] };
    return data.continue.map((value: CardProps) => { return { ...value, deletion: DialogDeletionContinue } }).reverse()
  } catch (Error) {
    console.error(`${Error} in ReadContinue`)
    return [];
  }
}
