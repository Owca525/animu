import React, { useRef, useState } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import Button from "../ui/button";
import "../../css/dialogs/update.css";
import { useTranslation } from "react-i18next";

const UpdateComponent: React.FC = () => {
  const [data, setdata] = useState<any>({
    title: "",
    note: "",
  });

  const {t} = useTranslation();

  const [progress, setProgress] = useState({ mb: 0, procent: 0.0 });
  const [status, setStatus] = useState<string>("Status: " + t("update.status.download"));
  const [isDownloadUpdate, setDownloadUpdate] = useState<boolean>(false);
  const [update, setUpdate] = useState<Update>();
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const progressRef = useRef<HTMLDivElement>(null);

  const convertBytes = (bytes: number): string => {
    const ONE_MB = 1024 * 1024;

    if (bytes < ONE_MB) {
      const kilobytes = bytes / 1024;
      return `${kilobytes.toFixed(2)} KB`;
    } else {
      const megabytes = bytes / ONE_MB;
      return `${megabytes.toFixed(2)} MB`;
    }
  };

  const checkUpdate = async () => {
    const update = await check();
    if (update) {
      setdata({ title: t("update.downloadUpdate", { version: update.version }), note: update.body });
      setUpdate(update);
    }
  };

  const updateDownloadAndInstall = async () => {
    if (!update) {
      return;
    }
    setDownloadUpdate(true);
    setdata({ title: t("update.downloadingUpdate", { version: update.version }), note: update.body });
  
    let contentLength = 0;
    let downloaded = 0;

    await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            if (event.data.contentLength) {
              contentLength = event.data.contentLength;
            }
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            const percentage = (downloaded / contentLength) * 100;
            setProgress({ mb: downloaded, procent: percentage });
            if (progressRef.current) {
              progressRef.current.style.width = `${percentage}%`
            }
            break;
          case "Finished":
            setStatus(`Status: ` + t("update.status.finish"));
            break;
          default:
            break;
        }
      }
    );
    setStatus("Status: " + t("update.status.install"))
    await relaunch();
  };

  useState(() => {
    checkUpdate();
  });

  if (isDownloadUpdate) {
    return (
      <div className="update-container">
        <div className="center-update">
          <div className="header-update">{data.title}</div>
          <div className="progress-container">
            <div className="prgress-mb">{convertBytes(progress.mb)}</div>
            <div className="seek-bar" style={{pointerEvents: "none"}}>
              <div className="progress" ref={progressRef}></div>
            </div>
            <div className="progress-precent">{progress.procent.toFixed(1)}%</div>
          </div>
          <div className="status">{status}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={isVisible ? "update-container" : "update-container hidden"}>
      <div className="center-update">
        <div className="header-update">{data.title}</div>
        <div
          className="update-note"
          dangerouslySetInnerHTML={{ __html: data.note }}
        ></div>
        <div className="buttons-update">
          <Button
            value="Install Update"
            className="update-button"
            onClick={async () => await updateDownloadAndInstall()}
          />
          <Button
            value="Back To watch"
            className="update-button"
            onClick={() => setIsVisible(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default UpdateComponent;
