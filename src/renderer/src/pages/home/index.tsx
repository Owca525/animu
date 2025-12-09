import BigCardsContainer from './components/bigCardsContainer';
import Button from '@renderer/components/buttons';
import Container from './components/container';
import Filter from './components/filter';
import Input from '@renderer/components/input';
import Sidebar from '@renderer/components/sidebar';
import { CreateContextMenuOptions, getHistory } from '@renderer/utils/functions';
import {
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Switch
} from 'solid-js';
import { getConfig } from '@renderer/utils/stores/config';
import {
  getHomeCache,
  setAllHomeData,
  setHomeActivePage,
  setHomeNewData,
  setHomeSearch,
  setHomeSearchPage,
  setHomeSearchTags,
  setHomeStopScrolling
} from '@renderer/utils/stores/home';
import { getInformationPlugin, getPlayerPLugin } from '@renderer/utils/stores/plugins';
import { OpenContextMenu } from '@renderer/utils/context/ContextMenu';
import { t } from 'i18next';
import { unwrap } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import './home.css';
// Home css
import {
  cardData,
  containerData,
  FilterParams,
  homeData,
  SettingsConfig,
} from "@renderer/utils/types";
// import { createShortcut } from "@solid-primitives/keyboard";
// import WelcomeScreen from "./components/welcomeScreen"
import CryptoJS from "crypto-js";
import { createShortcut } from '@solid-primitives/keyboard';

const Home = () => {
  const navigate = useNavigate();
  const plugin = getInformationPlugin()
  const [homeCache] = createSignal<homeData>(getHomeCache());
  // const pluginPlayer = getPlayerPLugin();
  const [isOpenSidebar, setOpenSidebar] = createSignal<boolean>(false);
  const [headerActive, setHeaderActive] = createSignal<boolean>(false)

  let divRef: HTMLDivElement | undefined;

  let sidebarData = {
    top: [
      {
        icon: "home",
        text: t("global.home"),
        onClick: () => { setHomeActivePage(t("global.home")); plugin.home() },
      },
      {
        icon: "history",
        text: t("global.history"),
        onClick: history,
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

  // if (pluginPlayer && pluginPlayer.sidebarAddon) {
  //   sidebarData = {
  //     bottom: [...sidebarData.bottom],
  //     top: [...sidebarData.top, ...pluginPlayer.sidebarAddon] as any,
  //   };
  // }

  onMount(() => {
    if (homeCache().data.sections.length <= 0) plugin.home()
    const config: SettingsConfig = unwrap(getConfig());
    if (config.General.discordRPC && window.api)
      window.api.rpc.setActivity(undefined, t("discordrpc.home"));
  })

  function history() {
    setHomeActivePage(t("global.history"));
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
    setAllHomeData({ data: data } as any)
  }
  const handleScroll = () => {
    let home = homeCache()
    if (!home.data) return;
    if (!divRef) return;

    const scrollTop = divRef.scrollTop;
    const scrollHeight = divRef.scrollHeight - divRef.clientHeight;
    const scrollPercent = (scrollTop / scrollHeight) * 100;
    if (parseInt(scrollPercent.toFixed(0)) >= 15) setHeaderActive(() => true)
    else setHeaderActive(() => false)
  };

  // TODO: napraw wyszukiwanie itp
  async function OnSearch(text: string) {
    let home = homeCache()
    if (home.activePage == t("global.home")) {
      setHomeSearch(text)
      setHomeSearchPage(1)
      setHomeStopScrolling(false);
      plugin.searchAnime(text, 1, home.filterTags);
      return;
    }

    if (home.activePage != t("global.history")) return
    let history = getHistory()
    let finnalContainer: containerData[] = []
    let historySearch = history.history.filter((data) =>
      data.AnimeData.title.romaji.toLowerCase().includes(text.toLowerCase())
    );
    let continueSearch = history.history.filter((data) =>
      data.AnimeData.title.romaji.toLowerCase().includes(text.toLowerCase())
    );

    if (continueSearch.length > 0) finnalContainer.push({
      title: t("global.continuewatch"),
      data: continueSearch as cardData[],
      horizontal: historySearch.length <= 0
    })

    if (historySearch.length > 0) finnalContainer.push({
      title: t("global.history"),
      data: historySearch as cardData[],
      horizontal: historySearch.length <= 0
    })

    if (continueSearch.length <= 0 && historySearch.length <= 0) finnalContainer.push({
      title: t("global.history"),
      data: [],
      horizontal: true
    })

    setHomeNewData({ sections: finnalContainer })
  }

  function onChange(params?: FilterParams, removeParam?: string) {
    let home = homeCache()
    if (removeParam) {
      const newParams: FilterParams = { ...home.filterTags };
      if (newParams[removeParam] !== undefined) {
        delete newParams[removeParam];
      }
      setHomeSearchTags(newParams)
      OnSearch(home.search);
      return;
    }

    if (!home.filterTags) setHomeSearchTags(params)
    else setHomeSearchTags({ ...home.filterTags, ...params })
    OnSearch(home.search);
  }

  function CreateTagList() {
    let home = homeCache()

    if (!home.filterTags) return;
    let data: any = [];
    for (const [key, type] of Object.entries(home.filterTags)) {
      data.push({ remover: () => onChange(undefined, key), name: type });
    }

    return data;
  }

  function getSidebarNumber() {
    let home = homeCache()
    for (let index = 0; index < sidebarData.top.length; index++) {
      const element = sidebarData.top[index];
      if (element.text == home.activePage) return index
    }
    return 0
  }

  // createShortcut(["h"], () => {
  //   let plugin = getPlayerPLugin()
  //   if (!plugin) return
  //   plugin.searchAnime("Oshi no ko", 1)
  // })

  return (
    <main
      class={`home-main ${homeCache().data && !homeCache().data.topCards ? "active" : ""}`}
      onContextMenu={(event) =>
        OpenContextMenu(CreateContextMenuOptions(), event)
      }
    >
      <Sidebar
        data={sidebarData}
        openSidebar={isOpenSidebar()}
        onChange={() => setOpenSidebar(false)}
        activeElement
        setAciveElement={getSidebarNumber()}
      />

      <div class={`home-header-container ${homeCache().data && !homeCache().data.topCards ? "active" : ""} ${headerActive() ? "color" : ""}`}>
        <Button
          icon="menu"
          ButtonClass={`${homeCache().data && homeCache().data.topCards ? "home-header-background" : ""} ${headerActive() ? "color" : ""}`}
          onClick={() => setOpenSidebar((prev) => !prev)}
        />
        <div class="home-header-search">
          <Input
            placeholder={getHomeCache().activePage == "history" ? t("home.historySearch") : t("home.search")}
            InputClass={`${homeCache().data && homeCache().data.topCards ? "home-header-background" : ""} ${headerActive() ? "color" : ""}`}
            defaultValue={homeCache().search}
            onKeyDown={OnSearch}
          />
          <div class="home-filter-void">
            <Filter
              onChange={onChange}
              filter={plugin.currentPlugin.metadata.searchOption}
              custonClass={`${homeCache().data && homeCache().data.topCards ? "home-header-background" : ""} ${headerActive() ? "color" : ""}`}
            />
          </div>
        </div>
      </div>

      <div class="home-main-content" onScroll={handleScroll} ref={divRef}>
        <Switch>
          <Match when={homeCache().isLoading && homeCache().isError == false}>
            <div class="home-notification-container">
              <div class="material-symbols-outlined loading-animation icon">
                progress_activity
              </div>
            </div>
          </Match>
          <Match when={homeCache().isError && homeCache().isLoading == false}>
            <div class="home-notification-container">
              <span class="material-symbols-outlined icon">
                error
              </span>
              {t("home.error")}
            </div>
          </Match>
          <Match when={homeCache().isError == false && homeCache().isLoading == false && homeCache().data && homeCache().data.sections && homeCache().data.sections.length <= 0}>
            <div class="home-notification-container">
              <span class="material-symbols-outlined icon">
                search_off
              </span>
              {t("home.nothingfound")}
            </div>
          </Match>
          <Match when={homeCache().isLoading == false && homeCache().isError == false && homeCache().data && homeCache().data.sections && homeCache().data.sections.length > 0}>
            <Show when={homeCache().data && homeCache().data.topCards}>
              <BigCardsContainer data={homeCache().data.topCards as containerData} />
            </Show>
            <For each={homeCache().data.sections}>
              {(element) => (
                <Container
                  tags={
                    homeCache().filterTags && homeCache().data && homeCache().data.sections.length == 1
                      ? CreateTagList()
                      : undefined
                  }
                  title={element.title}
                  data={element.data}
                  horizontal={element.horizontal}
                  onScrollDownFunction={element.onScrollDownFunction}
                  onTitleClick={element.onTitleClick}
                // onTitle={element.onTitleClick}
                />
              )}
            </For>
          </Match>
        </Switch>
      </div>
    </main>
  );
};

export default Home;
