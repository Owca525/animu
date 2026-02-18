import { saveConfig } from "./FilesManager/config";
import { getConfig } from "./stores/config";
import { unwrap } from "solid-js/store";
import { toast, updateToast } from "./context/ToastNotification";
import { t } from "./i18n";
import { dateToUnix } from "./functions";

export async function checkUpdate(alwaysShow: boolean = false) {
  try {
    if (!window.api) return
    const update = await window.api.update.checkUpdate();

    if (update.available) {
      const id = toast(t("update.available", { ver: update.version }), {
        duration: 5000,
        removeClick: true,
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
}

export function downloadUpdate(updateNotification: string) {
  window.api.update.updateProgress((_event, percent) => {
    updateToast(updateNotification, t("update.progress", { procent: percent.toFixed(1) }), {
      type: "loading",
      removeTimer: true,
      removeClick: true,
      onClick: undefined
    });

    if (percent.toFixed(0) === "100") {
      updateToast(updateNotification, t("update.done"), { type: "success", removeTimer: false, removeClick: false });
    }
  });
}
