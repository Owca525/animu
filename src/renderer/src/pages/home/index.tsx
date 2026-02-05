import BigCardsContainer from './components/bigCardsContainer';
import Button from '@renderer/components/buttons';
import Container from './components/container';
import Filter from './components/filter';
import Input from '@renderer/components/input';
import Sidebar from '@renderer/components/sidebar';
import { changeTitleAnimu, CreateContextMenuOptions, dateToUnix, getHistory, unixToDateTime } from '@renderer/utils/functions';
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
  setHomeActivePage,
  setHomeNewData,
  setHomeSearch,
  setHomeSearchPage,
  setHomeSearchTags,
  setHomeStopScrolling
} from '@renderer/utils/stores/home';
import { getInformationPlugin, pluginManager } from '@renderer/utils/stores/plugins';
import { OpenContextMenu } from '@renderer/utils/context/ContextMenu';
import { unwrap } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import './home.css';
// Home css
import {
  cardData,
  containerData,
  deepLinkData,
  FilterParams,
  homeData,
  SettingsConfig,
} from "@renderer/utils/types";
import { useI18n } from '@renderer/utils/i18n';
import { removeToast, toast, updateToast } from '@renderer/utils/context/ToastNotification';
import { getGlobalCache, setDeeplinkRunned } from '@renderer/utils/stores/global';
import { setAnimuList, setCalendary, setHistory } from './homeUtils';

// import WelcomeScreen from "./components/welcomeScreen"
const Home = () => {
  const { t } = useI18n()
  const navigate = useNavigate();
  const plugin = getInformationPlugin()
  const [homeCache] = createSignal<homeData>(getHomeCache());
  // const pluginPlayer = getPlayerPLugin();
  const [isOpenSidebar, setOpenSidebar] = createSignal<boolean>(false);
  const [searchText, setSearchText] = createSignal<string>();
  const [headerActive, setHeaderActive] = createSignal<boolean>(false)

  let divRef: HTMLDivElement | undefined;

  let sidebarData = {
    top: [
      {
        icon: "home",
        text: "global.home",
        onClick: plugin.home,
      },
      {
        icon: "history",
        text: "global.history",
        onClick: setHistory,
      },
      {
        icon: "view_list",
        text: "global.animulist",
        onClick: setAnimuList,
      },
      {
        icon: "calendar_month",
        text: "global.schedule",
        onClick: setCalendary,
      }
    ],
    bottom: [
      {
        icon: "settings",
        text: "global.settings",
        onClick: () => navigate("/settings"),
      },
    ],
  };

  function setNewActivePage(text: string) {
    setHomeSearch(undefined)
    setHomeSearchTags(undefined)
    setHomeActivePage(text)
    changeTitleAnimu(`Animu - ${t(text)}`)
    setSearchText(t(`search.${text.split(".")[1]}`))
  }

  onMount(() => {
    for (let index = 0; index < sidebarData.top.length; index++) {
      const element = sidebarData.top[index];
      if (getHomeCache().activePage == element.text) setNewActivePage(element.text)
    }
    
    if (!getGlobalCache().deeplinkRunned) {
      window.api.onProtocolRequest(fetchDeeplinks)
      setDeeplinkRunned(true)
    }

    if (homeCache().data.sections.length <= 0) plugin.home()
    const config: SettingsConfig = unwrap(getConfig());
    if (config.General.discordRPC && window.api)
      window.api.rpc.setActivity(undefined, t("discordrpc.home"));
  })

  async function fetchDeeplinks(deeplink: string) {
    if (deeplink.replaceAll(" ", "").length <= 0) return
    let anime: deepLinkData | undefined;
    try {
      const str = atob(deeplink.replaceAll("animu://", ""))
      if (str.startsWith("{")) anime = JSON.parse(str)
      else {
        const tmp = str.split(",")
        if (tmp.length <= 0) throw "Failed Parse"
        if (tmp.length == 1) anime = { animeID: tmp[0] }
        if (tmp.length != 6) throw "Failed Parse"
        anime = {
          animeID: tmp[0],
          player: {
            plugin: tmp[1],
            type: tmp[2],
            id: tmp[3],
            episode: tmp[4],
            time: parseInt(tmp[5])
          }
        }
      }
    } catch (error) { console.error(t("deeplink.failed"), error) }
    if (!anime) return

    const infoPlugin = getInformationPlugin()
    const idToast = toast(t("notification.fetchinganime"), { type: "loading", removeTimer: true })
    const response = await infoPlugin.anime(anime.animeID)
    if (!response) return updateToast(idToast, t("notification.failedanime"), { type: "error", removeTimer: false })
    updateToast(idToast, t("notification.successanime"), { type: "success", removeTimer: false })

    if (!anime.player) {
      localStorage.setItem("informationCache", JSON.stringify({ anime: response }))
      navigate!("/info")
      return
    }

    const toastID = toast(t("notification.episodesfetching"), { type: "loading", removeTimer: true })
    const currentPLugin = pluginManager().changePlugin(anime.player.plugin)
    const episodeList = await currentPLugin.extractOnlyEpisodesList(anime.player.type, anime.player.id);

    if (episodeList.length <= 0) {
      updateToast(toastID, t("notification.episodesfailed"), { type: "error", removeTimer: false })
      return
    }

    removeToast(toastID)

    localStorage.setItem("playerCache", JSON.stringify({
      data: {
        ...response,
        player_ID: anime.player.id
      },
      save: {
        pluginName: currentPLugin.metadata.name,
        last_Time: anime.player.time,
        episode: anime.player.episode,
        type: anime.player.type,
      },
      episodelist: episodeList,
    }))

    navigate("/player");
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
  async function OnSearch(text: string = "") {
    let home = homeCache()
    if (home.activePage == "global.home") {
      setHomeSearch(text)
      setHomeSearchPage(1)
      setHomeStopScrolling(false);
      plugin.searchAnime(text, 1, home.filterTags);
      return;
    }

    if (home.activePage != "global.history") return
    if (text.replaceAll(" ", "") == "") {
      setHistory()
      return
    }
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
        onClickTopButtons={setNewActivePage}
      />

      <div class={`home-header-container ${homeCache().data && !homeCache().data.topCards ? "active" : ""} ${headerActive() ? "color" : ""}`}>
        <Button
          icon="menu"
          ButtonClass={`${homeCache().data && homeCache().data.topCards ? "home-header-background" : ""} ${headerActive() ? "color" : ""}`}
          onClick={() => setOpenSidebar((prev) => !prev)}
        />
        <div class="home-header-search">
          <Input
            placeholder={searchText()}
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
          <Show when={getHomeCache().activePage == "global.schedule"}>
            <Input type="date" defaultValue={unixToDateTime(dateToUnix(new Date().toString())).split(" ")[0]} onKeyDown={setCalendary}/>
          </Show>
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
