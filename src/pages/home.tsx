import { exit } from '@tauri-apps/plugin-process';
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";

// Components
import Notification from "../components/dialogs/notification";
import Update from "../components/dialogs/update";
import Sidebar from "../components/elements/sidebar";
import Content from "../components/elements/card-content";
import Header from "../components/elements/headers";
import Dialog from "../components/dialogs/dialog";

// utils
import { ContainerProps } from "../utils/interface";
import { get_recent, get_search } from "../utils/backend";
import { ReadContinue } from "../utils/continueWatch";
import { configContext } from "../utils/context";

import "../css/pages/home.css";
import { ReadHistory } from '../utils/history';
import ContextMenu from '../components/elements/context-menu';

function home() {
  const navigate = useNavigate();

  const config = useContext(configContext);

  // Language
  const {t} = useTranslation();

  const [notificationData, setNotificationData] = useState<{ title: string; information: string; onClick?: () => void }[]>([{ title: "", information: "" }]);
  const [data, setData] = useState<ContainerProps>({ title: "", data: [] });
  const [error, seterror] = useState<{ error: boolean, note: string }>()

  const [loading, setLoading] = useState(true);
  const [isUpdate, setisUpdate] = useState(false);
  const [updateNotification, setUpdateNotification] = useState(false);

  const sidebarHomeTopData = [
    {
      value: '<div class="material-symbols-outlined text-button">schedule</div>' + t("sidebar.RecentAnime"),
      class: "icon-button",
      title: t("sidebar.RecentAnime"),
      onClick: async () => change_content({ title: t("sidebar.RecentAnime"), data: await get_recent() }),
    },
    {
      value: '<div class="material-symbols-outlined text-button">history</div>'+t("sidebar.ContinueWatching"),
      class: "icon-button",
      title: t("sidebar.ContinueWatching"),
      onClick: async () => change_content({ title: t("sidebar.ContinueWatching"), data: (await ReadContinue()).continue }),
    },
    {
      value: '<div class="material-symbols-outlined text-button">history</div>'+t("sidebar.History"),
      class: "icon-button",
      title: t("sidebar.History"),
      onClick: async () => change_content({ title: t("sidebar.History"), data: (await ReadHistory()).history }),
    }
  ];

  const sidebarHomeBottomData = [
    {
      value: '<div class="material-symbols-outlined text-button">extension</div>' + t("sidebar.Extensions"),
      class: "icon-button",
      title: t("sidebar.Extensions"),
    },
    {
      value: '<div class="material-symbols-outlined text-button">settings</div>' + t("sidebar.settings"),
      class: "icon-button",
      title: t("sidebar.settings"),
      onClick: async () => navigate("/settings"),
    }
  ];

  const menuItems = [
    { label: t("contextMenu.reload"), onClick: () => location.reload() }
  ];

  const checkUpdate = async () => {
    const update = await check();
    if (update && update.available) {
      setUpdateNotification(true);
      setNotificationData([
        {
          title: t("update.title"),
          information: t("update.information", {version: update.version}),
          onClick: () => setisUpdate(true),
        },
      ]);
    }
  };

  useEffect(() => {
    checkUpdate();

    const fetchData = async () => {
      change_content({
        title: t("sidebar.RecentAnime"),
        data: await get_recent(),
      });
      setLoading(false);
    };
    fetchData();
  }, []);

  const change_content = (newData: ContainerProps) => {
    if (newData.data && newData.data.length != 0 && newData.data[0].title == "error") {
      seterror({ error: true, note: "Error getting information from allmanga" })
      setData({ title: t("sidebar.RecentAnime") })
      return
    }
    setData(newData);
  };

  const handleInputChange = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key == "Enter") {
      var search = event.currentTarget.value;
      const results = async () => {
        const data = await get_search(search);
        change_content({ title: t("header.activeSearch", { name: search }), data: data });
      };
      results();
    }
  };

  if (config) {
    return (
      <main className="container">
        <ContextMenu items={menuItems} />
        {updateNotification ? <Notification data={notificationData} /> : ""}
        {isUpdate ? <Update /> : ""}
        {error?.error ? <Dialog header_text={t("error.connection")} text={error.note} buttons={[{ title: t("general.exit"), onClick: () => exit(0) }, { title: t("general.reload"), onClick: () => navigate("/") }]} /> : ""}
        <Sidebar top={sidebarHomeTopData} bottom={sidebarHomeBottomData} sidebarHover={config.General.HoverSidebar} />
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
