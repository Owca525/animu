import toast from "solid-toast";
import { saveConfig } from "./FilesManager/config";
import { t } from "i18next";
import { getConfig } from "./stores/config";

export async function checkUpdate(alwaysShow: boolean = false) {
  try {
    const update = await window.api.update.checkUpdate();
    console.log(update);

    if (update.available) {
      const id = toast.loading(t("update.progress", { procent: 0 }));

      toast(t("update.available", { ver: update.version }), {
        duration: 5000,
        // onClick: () => {
        //   window.api.update.downloadUpdate();
        //   downloadUpdate(id);
        // },
      });
    } else if (alwaysShow) {
      toast.success(t("update.same"));
    }

    const config = structuredClone(getConfig());
    config.update.lastTime = new Date().toString();
    saveConfig(config);
  } catch (error) {
    console.error("Error in checkUpdate", error);
    toast.error("Failed to check for updates");
  }
}

export function downloadUpdate(updateNotification: string) {
  window.api.update.updateProgress((_event, percent) => {
    toast.loading(t("update.progress", { procent: percent.toFixed(1) }), {
      id: updateNotification,
    });

    if (percent.toFixed(0) === "100") {
      toast.dismiss(updateNotification);
      toast.success(t("update.done"));
    }
  });
}
