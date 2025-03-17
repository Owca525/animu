import { CardProps } from "./interface";

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
    return data.continue.reverse();
  } catch (Error) {
    console.error(`${Error} in ReadContinue`)
    return [];
  }
}
