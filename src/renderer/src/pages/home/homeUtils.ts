import { dateToUnix, getHistory, setHomeData } from "@renderer/utils/functions";
import { t } from "@renderer/utils/i18n";
import { animulistData } from "@renderer/utils/stores/global";
import { getInformationPlugin } from "@renderer/utils/stores/plugins";
import { homeData } from "@renderer/utils/types";
import { unwrap } from "solid-js/store";

export function setCalendary(date?: string) {
    let tmp = new Date()
    if (date) tmp = new Date(date)

    const startOfDay = new Date(tmp);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(tmp);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(startOfDay, endOfDay)

    setHomeData(async () => getInformationPlugin().schedule(dateToUnix(startOfDay.toString()), dateToUnix(endOfDay.toString())))
}

export function setAnimuList() {
    setHomeData(undefined, {
        sections: [
            {
                data: unwrap(animulistData())
            }
        ]
    })
}

export function setHistory() {
    let history = getHistory()

    let data: homeData["data"] = {
        sections: [
            {
                title: t("global.continuewatch"),
                data: history.continue.slice(0, 20),
                horizontal: true,
                onTitleClick: async () => ({
                    title: t("global.continuewatch"),
                    data: history.continue,
                    horizontal: false,
                }),
            },
            {
                title: t("global.history"),
                data: history.history.slice(0, 20) as any,
                horizontal: true,
                onTitleClick: async () => ({
                    title: t("global.history"),
                    data: history.history as any,
                    horizontal: false,
                })
            },
        ],
    };
    setHomeData(undefined, data)
}

