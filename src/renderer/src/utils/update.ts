import { saveConfig } from "./FilesManager/config";
import { getConfig } from "./stores/config";
import { unwrap } from "solid-js/store";
import { toast, updateToast } from "./context/ToastNotification";
import { t } from "./i18n";
import { dateToUnix } from "./functions";

export async function checkUpdate(alwaysShow: boolean = false) {
  /* IFDEF DEBUG|PROD */
  try {
    const update = await window.api.update.checkUpdate();

    if (update.available) {
      const id = toast(t("update.available", { ver: update.version }), {
        duration: 5000,
        onClick: () => {
          window.api.update.downloadUpdate();
          downloadUpdate(id);
        },
      });
    } else if (alwaysShow) {
      toast(t("update.same"), { type: "success" });
    }

    const config = unwrap(getConfig());
    config.update.lastTime = dateToUnix(new Date().toString());
    saveConfig(config);
  } catch (error) {
    console.error("Error in checkUpdate", error);
    toast(t("update.failed"), { type: "error" });
  }
  /* ENDIF */
}

export function downloadUpdate(updateNotification: string) {
  /* IFDEF DEBUG|PROD */
  window.api.update.updateProgress((_event, percent) => {
    updateToast(updateNotification, t("update.progress", { procent: percent.toFixed(1) }), {
      type: "loading",
      timer: true,
      click: true,
      onClick: undefined
    });

    if (percent.toFixed(0) === "100") {
      updateToast(updateNotification, t("update.done"), { type: "success", timer: false, click: false });
    }
  });
  /* ENDIF */
}
