import BigCardsContainer from './components/bigCardsContainer';
import Button from '@renderer/components/buttons';
import Container from './components/container';
import Filter, { updateGenres } from './components/filter';
import Input from '@renderer/components/input';
import Sidebar from '@renderer/components/sidebar';
import { changeTitleAnimu, CreateContextMenuOptions, dateToUnix, unixToDateTime } from '@renderer/utils/functions';
import {
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Switch,
} from 'solid-js';
import { getConfig } from '@renderer/utils/stores/config';
import {
  getHomeCache,
  setHomeActivePage,
  setHomeSearch,
  setHomeSearchPage,
  setHomeSearchTags,
  setHomeStopScrolling,
} from '@renderer/utils/stores/home';
import { getInformationPlugin } from '@renderer/utils/stores/plugins';
import { OpenContextMenu } from '@renderer/utils/context/ContextMenu';
import { unwrap } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import './home.css';
import {
  containerData,
  FilterParams,
  genres,
  homeData,
  SettingsConfig,
} from "@renderer/utils/types";
import { useI18n } from '@renderer/utils/i18n';
import { anilistSearch, AnimuListSearch, historySearch, setAnimuList, setCalendary, setHistory } from './homeUtils';
import Avatar from './components/avatar';
// import { io } from 'socket.io-client';
// import { socketPlayerInit } from '../player/VideoPlayer';

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
        onSearch: anilistSearch
      },
      {
        icon: "history",
        text: "global.history",
        onClick: setHistory,
        onSearch: historySearch
      },
      {
        icon: "view_list",
        text: "global.animulist",
        onClick: setAnimuList,
        onSearch: AnimuListSearch
      },
      {
        icon: "calendar_month",
        text: "global.schedule",
        onClick: () => setCalendary(),
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

  function setNewActivePage(text: string, overwrite: boolean = true) {
    if (overwrite) {
      setHomeSearch(undefined)
      setHomeSearchTags(undefined)
    }
    setHomeActivePage(text)
    changeTitleAnimu(`Animu - ${t(text)}`)
    setSearchText(t(`search.${text.split(".")[1]}`))
  }

  onMount(() => {
    sidebarData.top.forEach((element) => {
      if (getHomeCache().activePage == element.text) 
        setNewActivePage(element.text, false)
    })

    if (homeCache().data.sections.length <= 0) plugin.home()
    const config: SettingsConfig = unwrap(getConfig());
    
    /* IFDEF DEBUG|PROD */
    if (config.General.discordRPC)
      window.api.rpc.setActivity(undefined, t("discordrpc.home"));
    /* ENDIF */
  })

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


  function CreateTagList() {
    let home = homeCache()

    if (!home.filterTags) return;
    let data: any = [];
    for (const [key, type] of Object.entries(home.filterTags)) {
      data.push({ remover: () => { updateGenres(key, undefined); StartSearch(unwrap(homeCache().search), unwrap(homeCache().filterTags)) }, name: type });
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

  function StartSearch(search: string = "", params: FilterParams | undefined) {
    setHomeSearchPage(1)
    setHomeStopScrolling(false)

    sidebarData.top.forEach((element) => {
      if (element.onSearch && element.text == homeCache().activePage) 
        element.onSearch(search, params)
    })
  }

  function checkOtherFilters() {
    if (homeCache().otherFilter.length <= 0) return []
    let tmp: genres[] = []
    for (let index = 0; index < homeCache().otherFilter.length; index++) {
      const element = homeCache().otherFilter[index];
      if (element.page == homeCache().activePage) tmp = [...tmp, ...element.filter]
    }
    return tmp
  }

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
            onKeyDown={(search: string) => { StartSearch(search, unwrap(homeCache().filterTags)) }}
          />
          <div class="home-filter-void">
            <Filter
              onChange={(params: FilterParams | undefined) => { StartSearch(unwrap(homeCache().search), params) }}
              filter={[...plugin.currentPlugin.metadata.searchOption, ...checkOtherFilters()]}
              custonClass={`${homeCache().data && homeCache().data.topCards ? "home-header-background" : ""} ${headerActive() ? "color" : ""}`}
            />
          </div>
          <Show when={getHomeCache().activePage == "global.schedule"}>
            <Input type="date" defaultValue={unixToDateTime(dateToUnix(new Date().toString())).split(" ")[0]} onInput={setCalendary} />
          </Show>
        </div>
        <Avatar />
      </div>

      <div class="home-main-content" onScroll={handleScroll} ref={divRef}>
        <Switch>
          <Match when={homeCache().isLoading && !homeCache().isError}>
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
              <Show when={typeof homeCache().isError == "boolean"}>
                {t("home.error")}
              </Show>
              <Show when={typeof homeCache().isError == "string"}>
                <span class='home-error-notification'>
                  {t(homeCache().isError as string)}
                </span>
              </Show>
            </div>
          </Match>
          <Match when={!homeCache().isError && homeCache().isLoading == false && homeCache().data && homeCache().data.sections && homeCache().data.sections.length <= 0}>
            <div class="home-notification-container">
              <span class="material-symbols-outlined icon">
                search_off
              </span>
              {t("home.nothingfound")}
            </div>
          </Match>
          <Match when={homeCache().isLoading == false && !homeCache().isError && homeCache().data && homeCache().data.sections && homeCache().data.sections.length > 0}>
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
