import { saveConfig } from "./FilesManager/config";
import { t } from "i18next";
import { getConfig } from "./stores/config";
import { unwrap } from "solid-js/store";
import { toast } from "./context/ToastNotification";

export async function checkUpdate(alwaysShow: boolean = false) {
  try {
    if (!window.api) return
    const update = await window.api.update.checkUpdate();
    console.log(update);

    if (update.available) {
      const id = toast(t("update.progress", { procent: 0 }));

      toast(t("update.available", { ver: update.version }), {
        duration: 5000,
        // onClick: () => {
        //   window.api.update.downloadUpdate();
        //   downloadUpdate(id);
        // },
      });
    } else if (alwaysShow) {
      toast(t("update.same"), { type: "success" });
    }

    const config = unwrap(getConfig());
    config.update.lastTime = new Date().toString();
    saveConfig(config);
  } catch (error) {
    console.error("Error in checkUpdate", error);
    toast("Failed to check for updates", { type: "error" });
  }
}
// TODO: Fix updates
export function downloadUpdate(updateNotification: string) {
  // window.api.update.updateProgress((_event, percent) => {
  //   toast.loading(t("update.progress", { procent: percent.toFixed(1) }), {
  //     id: updateNotification,
  //   });

  //   if (percent.toFixed(0) === "100") {
  //     toast.dismiss(updateNotification);
  //     toast(t("update.done"), { type: "success" });
  //   }
  // });
}
