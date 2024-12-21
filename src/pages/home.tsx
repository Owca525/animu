import Sidebar from "../components/elements/sidebar";
import Content from "../components/elements/card-content";
import Header from "../components/elements/headers";
import Dialog from "../components/dialogs/dialog";
import { exit } from '@tauri-apps/plugin-process';
import "../css/pages/home.css";

import { ContainerProps } from "../utils/interface";
import { get_recent, get_search } from "../utils/backend";
import { useContext, useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import Notification from "../components/dialogs/notification";
import Update from "../components/dialogs/update";
import { useNavigate } from "react-router-dom";
import { ReadHistory } from "../utils/history";
import { configContext } from "../utils/context";

function home() {
  const navigate = useNavigate();

  const config = useContext(configContext);

  const [notificationData, setNotificationData] = useState<{ title: string; information: string; onClick?: () => void }[]>([{ title: "", information: "" }]);
  const [data, setData] = useState<ContainerProps>({ title: "", data: [] });
  const [error, seterror] = useState<{ error: boolean, note: string }>()

  const [loading, setLoading] = useState(true);
  const [isUpdate, setisUpdate] = useState(false);
  const [updateNotification, setUpdateNotification] = useState(false);

  const sidebarHomeTopData = [
    {
      value: '<div class="material-symbols-outlined text-button">schedule</div>Recent Anime',
      class: "icon-button",
      title: "Recent Anime",
      onClick: async () => change_content({ title: "Recent Anime", data: await get_recent() }),
    },
    {
      value: '<div class="material-symbols-outlined text-button">history</div>History',
      class: "icon-button",
      title: "Continue Watch",
      onClick: async () => change_content({ title: "Continue Watch", data: (await ReadHistory()).history }),
    }
  ];

  const sidebarHomeBottomData = [
    {
      value: '<div class="material-symbols-outlined text-button">extension</div>Extension',
      class: "icon-button",
      title: "Extension",
    },
    {
      value: '<div class="material-symbols-outlined text-button">settings</div>Settings',
      class: "icon-button",
      title: "Settings",
      onClick: async () => navigate("/settings"),
    }
  ];

  const checkUpdate = async () => {
    const update = await check();
    if (update && update.available) {
      setUpdateNotification(true);
      setNotificationData([
        {
          title: "New Update Availble",
          information: `Hey is new update ${update.version} wait to download, click notification`,
          onClick: () => setisUpdate(true),
        },
      ]);
    }
  };

  useEffect(() => {
    checkUpdate();

    const fetchData = async () => {
      change_content({
        title: "Recent Anime",
        data: await get_recent(),
      });
      setLoading(false);
    };

    fetchData();
  }, []);

  const change_content = (newData: ContainerProps) => {
    if (newData.data && newData.data.length != 0 && newData.data[0].title == "error") {
      seterror({ error: true, note: "Error getting information from allmanga" })
      setData({ title: "Recent Anime" })
      return
    }
    setData(newData);
  };

  const handleInputChange = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key == "Enter") {
      var search = event.currentTarget.value;
      const results = async () => {
        const data = await get_search(search);
        change_content({ title: `Searching: ${search}`, data: data });
      };
      results();
    }
  };

  if (config) {
    return (
      <main className="container">
        {updateNotification ? <Notification data={notificationData} /> : ""}
        {isUpdate ? <Update /> : ""}
        {error?.error ? <Dialog header_text="Connection Error" text={error.note} buttons={[{ title: "Exit", onClick: () => exit(0) }, { title: "Reload", onClick: () => navigate("/") }]} /> : ""}
        <Sidebar top={sidebarHomeTopData} bottom={sidebarHomeBottomData} sidebarHover={config.General.SideBar.HoverSidebar} />
        <Header onInputChange={handleInputChange} />
        {loading ? (
          <div className="content loading-home">
            <div className="card-content-loading loading material-symbols-outlined">
              progress_activity
            </div>
          </div>
        ) : (
          <Content title={data.title} data={data.data} />
        )}
      </main>
    );
  }
}

export default home;
