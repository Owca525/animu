import React, { useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import "../../css/elements/update.css";

const UpdateComponent: React.FC = () => {
  const [status, setStatus] = useState("Starting Download");

  const updateDownloadAndInstall = async () => {
    const update = await check();
    if (!update) {
      return;
    }

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
          setStatus(`Downloaded: ${percentage}%`)
          break;
        case "Finished":
            setStatus(`Finished, now installing`)
          break;
        default:
          break;
      }
    });
    await relaunch();
  };

  useState(() => {
    updateDownloadAndInstall()
  })

  return (
    <div className="update-container">
      <div className="center-update">{status}</div>
    </div>
  );
};

export default UpdateComponent;
