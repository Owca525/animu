import { useNavigate } from "react-router-dom";

// Home css
import "./home.css";
import Input from "@renderer/components/input";
import Sidebar from "@renderer/components/sidebar";
import Container from "./components/container";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import {
  containerData,
  FilterParams,
  homeData,
  informationPluginFormat,
  SettingsConfig,
} from "@renderer/utils/GlobalInterface";
import { t } from "i18next";
import store from "@renderer/utils/store";
import {
  homeStopScrolling,
  setHomeData,
  setHomeLocalSearch,
} from "@renderer/utils/pluginApi";
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu";
import { CreateContextMenuOptions } from "@renderer/utils/functions";
import Filter from "./components/filter";
import Button from "@renderer/components/buttons";
import BigCardsContainer from "./components/bigCardsContainer";
import { ReadFile } from "@renderer/utils/FilesManager/readFiles";
// import WelcomeScreen from "./components/welcomeScreen"

const Home = () => {
  const navigate = useNavigate();
  const plugin: informationPluginFormat = useSelector(
    (plugin: any) => plugin.plugin.informationPlugin
  );
  const homeCache: homeData = useSelector((cache: any) => cache.home);
  const pluginPlayer = store.getState().plugin.playerPlugin;
  const config: SettingsConfig = useSelector((data: any) => data.config);
  const [isOpenSidebar, setOpenSidebar] = useState<boolean>(false);
  const [headerActive, setHeaderActive] = useState<boolean>(false)

  const divRef = useRef<HTMLDivElement | null>(null);

  console.log(homeCache)

  let sidebarData = {
    top: [
      {
        icon: "home",
        text: t("global.home"),
        onClick: plugin.info.home,
      },
      {
        icon: "history",
        text: t("global.history"),
        onClick: () => setHomeData(history),
      },
    ],
    bottom: [
      {
        icon: "settings",
        text: t("global.settings"),
        onClick: () => navigate("/settings"),
      },
    ],
  };

  if (pluginPlayer.sidebarAddon) {
    sidebarData = {
      bottom: [...sidebarData.bottom],
      top: [...sidebarData.top, ...pluginPlayer.sidebarAddon],
    };
  }

  useEffect(() => {
    if (homeCache.data.sections.length <= 0) plugin.info.home()
    if (config.General.discordRPC)
      window.api.rpc.setActivity(undefined, t("discordrpc.home"));
  }, []);

  useEffect(() => {
    if (homeCache.data.sections.length <= 0) return
    if (homeCache.data.sections.length != 1) return
    if (homeCache.stopScrolling) return
    if (!divRef.current) return
    if ((divRef.current.scrollHeight > divRef.current.clientHeight) == false && homeCache.data.sections[0].onScrollDownFunction) {
      store.dispatch({ type: "setPage", payload: homeCache.page + 1 });
      homeCache.data.sections[0].onScrollDownFunction(homeCache.page + 1);
    }
  }, [homeCache.data])

  async function history(): Promise<{
    topCards?: containerData;
    sections: containerData[];
  }> {
    setHomeLocalSearch(true);
    return {
      sections: [
        {
          title: t("global.continuewatch"),
          data: (await ReadFile("continueWatch.json")).slice(0, 20),
          horizontal: true,
          onTitleClick: () =>
            setHomeData(async () => ({
              sections: [
                {
                  title: t("global.continuewatch"),
                  data: await ReadFile("continueWatch.json"),
                  horizontal: false,
                },
              ],
            })),
        },
        {
          title: t("global.history"),
          data: (await ReadFile("history.json")).slice(0, 20),
          horizontal: true,
          onTitleClick: () =>
            setHomeData(async () => ({
              sections: [
                {
                  title: t("global.history"),
                  data: await ReadFile("history.json"),
                  horizontal: false,
                },
              ],
            })),
        },
      ],
    };
  }
  const handleScroll = () => {
    if (!homeCache.data) return;
    if (!divRef.current) return;

    const scrollTop = divRef.current.scrollTop;
    const scrollHeight = divRef.current.scrollHeight - divRef.current.clientHeight;
    const scrollPercent = (scrollTop / scrollHeight) * 100;
    if (parseInt(scrollPercent.toFixed(0)) >= 20) setHeaderActive(() => true)
    else setHeaderActive(() => false)

    if (homeCache.data.sections.length > 1) return;

    const currentPos = -divRef.current.scrollTop + divRef.current.scrollHeight;
    const endPosition = divRef.current.offsetHeight;
    const isFUCKINGBottom = parseInt(currentPos.toFixed(0)) <= endPosition + 30;
    if (
      isFUCKINGBottom &&
      homeCache.stopScrolling == false &&
      homeCache.data.sections.length === 1
    ) {
      if (homeCache.data.sections[0].onScrollDownFunction) {
        store.dispatch({ type: "setPage", payload: homeCache.page + 1 });
        homeCache.data.sections[0].onScrollDownFunction(homeCache.page + 1);
      }
      return;
    }
  };

  // TODO: napraw wyszukiwanie itp
  async function OnSearch(text: string) {
    if (!homeCache.localSearch && homeCache.search != text) {
      store.dispatch({ type: "setSearch", payload: text });
      store.dispatch({ type: "setPage", payload: 1 });
      homeStopScrolling(false);
      plugin.info.search(text, 1, store.getState().home.filterTags);
      return;
    }

    if (text == "" || text == " ") {
      await setHomeData(history);
      return;
    }

    let HomeData = homeCache.data;
    if (!HomeData || !homeCache.data) return;
    if (
      homeCache.data.sections.length == 2 ||
      homeCache.data.sections.length == 0
    ) {
      HomeData = await history();
    }
    if (
      homeCache.data.sections.length == 1 &&
      homeCache.data[0].title == t("global.history")
    ) {
      HomeData = {
        sections: [{ ...homeCache.data[0], data: await ReadFile("history.json") }],
      };
    }
    if (
      homeCache.data.sections.length == 1 &&
      homeCache.data[0].title == t("global.continuewatch")
    ) {
      HomeData = {
        sections: [{ ...homeCache.data[0], data: await ReadFile("continueWatch.json") }],
      };
    }

    let newData = HomeData.sections.map((containerData) => {
      let data = containerData.data.filter((data) =>
        data.AnimeData.title.romaji.toLowerCase().includes(text.toLowerCase())
      );
      if (data.length == 0) return;
      return { ...containerData, data: data };
    });
    setHomeData(async () => ({
      sections: newData.filter((value) => value != undefined),
    }));
  }

  function onChange(params?: FilterParams, removeParam?: string) {
    if (removeParam) {
      const newParams: FilterParams = { ...homeCache.filterTags };
      if (newParams[removeParam] !== undefined) {
        delete newParams[removeParam];
      }
      store.dispatch({ type: "setTags", payload: newParams });
      OnSearch(homeCache.search);
      return;
    }

    if (!homeCache.filterTags)
      store.dispatch({ type: "setTags", payload: params });
    else
      store.dispatch({
        type: "setTags",
        payload: { ...homeCache.filterTags, ...params },
      });
    OnSearch(homeCache.search);
  }

  function CreateTagList() {
    if (!homeCache.filterTags) return;
    let data: any = [];
    for (const [key, type] of Object.entries(homeCache.filterTags)) {
      data.push({ remover: () => onChange(undefined, key), name: type });
    }

    return data;
  }

  // console.log(isOpenSidebar);

  return (
    <main
      className={`home ${homeCache.data && !homeCache.data.topCards ? "active" : ""}`}
      onContextMenu={(event) =>
        OpenContextMenu(CreateContextMenuOptions(), event)
      }
    >
      <div className={`home-header-container ${homeCache.data && !homeCache.data.topCards ? "active" : ""} ${headerActive ? "color" : ""}`}>
        <Button
          icon="menu"
          ButtonClass={`${homeCache.data && homeCache.data.topCards ? "home-header-background" : ""} ${headerActive ? "color" : ""}`}
          onClick={() => setOpenSidebar((prev) => !prev)}
        />
        <div className="home-header-search">
          <Input
            placeholder={t("home.search")}
            InputClass={`${homeCache.data && homeCache.data.topCards ? "home-header-background" : ""} ${headerActive ? "color" : ""}`}
            onKeyDown={OnSearch}
          />
          <div className="home-filter-void">
            <Filter
              onChange={onChange}
              filter={plugin.searchOption}
              custonClass={`${homeCache.data && homeCache.data.topCards ? "home-header-background" : ""} ${headerActive ? "color" : ""}`}
            />
          </div>
        </div>
      </div>

      <Sidebar
        data={sidebarData}
        openSidebar={isOpenSidebar}
        onChange={() => setOpenSidebar(false)}
      />

      <div className="home-content" onScroll={handleScroll} ref={divRef}>
        {homeCache.data && homeCache.data.topCards && (
          <BigCardsContainer data={homeCache.data.topCards} />
        )}
        <div
          className={`home-container ${homeCache.isLoading && "home-loading-container"} ${homeCache.isError && "home-loading-container"} ${homeCache.data && homeCache.data.sections.length <= 0 && "home-loading-container"}`}
        >
          {homeCache.isLoading && homeCache.isError == false && (
            <div className="material-symbols-outlined home-loading-animation">
              progress_activity
            </div>
          )}
          {homeCache.isError && homeCache.isLoading == false && (
            <div className="home-error-container">
              <span className="material-symbols-outlined home-error-icon">
                error
              </span>
              {t("home.error")}
            </div>
          )}
          {homeCache.isLoading == false &&
            homeCache.isError == false &&
            homeCache.data &&
            homeCache.data.sections.length > 0 &&
            homeCache.data.sections.map((element: containerData) => (
              <Container
                tags={
                  homeCache.filterTags && homeCache.data && homeCache.data.sections.length == 1
                    ? CreateTagList()
                    : undefined
                }
                title={element.title}
                data={element.data}
                horizontal={element.horizontal}
                onScrollDownFunction={element.onScrollDownFunction}
                onTitleClick={element.onTitleClick}
              />
            ))}
          {homeCache.isError == false &&
            homeCache.isLoading == false &&
            homeCache.data &&
            homeCache.data.sections.length <= 0 && (
              <div className="home-empty-container">
                <span className="material-symbols-outlined home-empty-icon">
                  search_off
                </span>
                {t("home.nothingfound")}
              </div>
            )}
        </div>
      </div>
    </main>
  );
};

export default Home;

{
  /* <div className="home-header">
                <div className="home-header-left">
                <div className="button home-header-sidebar-placeholder"><span className="material-symbols-outlined">menu</span></div>
                    <Input placeholder={t("home.search")} InputClass="home-header-search" onKeyDown={OnSearch} />
                    <div className="home-filter-void">
                        <Filter onChange={onChange} filter={plugin.searchOption}
                        />
                    </div>
                </div>
                <div></div>
                <div className="home-header-right"></div>
            </div>
            {!config.General.HideSidebar && <div className="shadow-sidebar"></div>}
            <div className="home-top-container" style={{ backgroundImage: `url(${ANIME_DATA.bannerImage})` }}>
                <div className="home-top-background"></div>
                <div className="home-top-content">
                    <img src={ANIME_DATA.coverImage} className="card-image" />
                </div>
            </div>
            <div ref={divRef} className={`home-container ${homeCache.isLoading && "home-loading-container"} ${homeCache.isError && "home-loading-container"} ${homeCache.data.length <= 0 && "home-loading-container"}`} onScroll={handleScroll}>
                {homeCache.isLoading && homeCache.isError == false && <div className="material-symbols-outlined home-loading-animation">progress_activity</div>}
                {homeCache.isError && homeCache.isLoading == false && <div className="home-error-container"><span className="material-symbols-outlined home-error-icon">error</span>{t("home.error")}</div>}
                {homeCache.isLoading == false && homeCache.isError == false && homeCache.data.length > 0 && homeCache.data.map((element) => <Container tags={homeCache.filterTags && homeCache.data.length == 1 ? CreateTagList() : undefined} title={element.title} data={element.data} horizontal={element.horizontal} onScrollDownFunction={element.onScrollDownFunction} onTitleClick={element.onTitleClick} />)}
                {homeCache.isError == false && homeCache.isLoading == false && homeCache.data.length <= 0 && <div className="home-empty-container"><span className="material-symbols-outlined home-empty-icon">search_off</span>{t("home.nothingfound")}</div>}
            </div>
            <Sidebar data={sidebarData} /> */
}
{
  /* <WelcomeScreen /> */
}
