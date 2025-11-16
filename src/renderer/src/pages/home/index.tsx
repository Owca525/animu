// Home css
import "./home.css";
import Input from "@renderer/components/input";
import Sidebar from "@renderer/components/sidebar";
import Container from "./components/container";
import {
  containerData,
  FilterParams,
  homeData,
  SettingsConfig,
} from "@renderer/utils/types";
import { t } from "i18next";
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu";
import { CreateContextMenuOptions, getHistory } from "@renderer/utils/functions";
import Filter from "./components/filter";
import Button from "@renderer/components/buttons";
import BigCardsContainer from "./components/bigCardsContainer";
import { getInformationPlugin, getPlayerPLugin } from "@renderer/utils/stores/plugins";
import { useNavigate } from "@solidjs/router";
import { getHomeCache, setAllHomeData, setHomeLocalSearch, setHomeSearch, setHomeSearchPage, setHomeSearchTags, setHomeStopScrolling } from "@renderer/utils/stores/home";
import { getConfig } from "@renderer/utils/stores/config";
import { createEffect, createSignal, For, Match, onMount, Show, Switch } from "solid-js";
import { unwrap } from "solid-js/store";
// import { createShortcut } from "@solid-primitives/keyboard";
// import WelcomeScreen from "./components/welcomeScreen"

const Home = () => {
  const navigate = useNavigate();
  const plugin = getInformationPlugin()
  const [homeCache] = createSignal<homeData>(getHomeCache());
  const pluginPlayer = getPlayerPLugin();
  const [isOpenSidebar, setOpenSidebar] = createSignal<boolean>(false);
  const [headerActive, setHeaderActive] = createSignal<boolean>(false)

  let divRef: HTMLDivElement | undefined;

  let sidebarData = {
    top: [
      {
        icon: "home",
        text: t("global.home"),
        onClick: plugin.home,
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

  if (pluginPlayer && pluginPlayer.sidebarAddon) {
    sidebarData = {
      bottom: [...sidebarData.bottom],
      top: [...sidebarData.top, ...pluginPlayer.sidebarAddon] as any,
    };
  }

  onMount(() => {
    if (homeCache().data.sections.length <= 0) plugin.home()
    const config: SettingsConfig = unwrap(getConfig());
    console.log(config)
    if (config.General.discordRPC && window.api)
      window.api.rpc.setActivity(undefined, t("discordrpc.home"));
  })

  createEffect(() => {
    if (!divRef) return
    let home = homeCache()
    console.log(home)
    if (!home.data.sections) return
    if (home.data.sections.length <= 0 || home.data.sections.length != 1) return
    if (home.stopScrolling) return
    // if ((divRef.scrollHeight > divRef.clientHeight) == false && home.data.sections[0].onScrollDownFunction) {
    //   setHomeSearchPage(home.page + 1)
    //   home.data.sections[0].onScrollDownFunction(home.page + 1);
    // }
  })

  function history() {
    setHomeLocalSearch(true);
    let history = getHistory()

    console.log(history)

    let data = {
      sections: [
        {
          title: t("global.continuewatch"),
          data: history.continue.slice(0, 20),
          horizontal: true,
          // onTitleClick: () =>
          //   setHomeData(async () => ({
          //     sections: [
          //       {
          //         title: t("global.continuewatch"),
          //         data: history.continue,
          //         horizontal: false,
          //       },
          //     ],
          //   })),
        },
        {
          title: t("global.history"),
          data: history.history.slice(0, 20),
          horizontal: true,
          // onTitleClick: () =>
          //   setHomeData(async () => ({
          //     sections: [
          //       {
          //         title: t("global.history"),
          //         data: history.history,
          //         horizontal: false,
          //       },
          //     ],
          //   })),
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

    if (home.data.sections.length > 1) return;

    const currentPos = -divRef.scrollTop + divRef.scrollHeight;
    const endPosition = divRef.offsetHeight;
    const isFUCKINGBottom = parseInt(currentPos.toFixed(0)) <= endPosition + 30;
    if (
      isFUCKINGBottom &&
      home.stopScrolling == false &&
      home.data.sections.length === 1
    ) {
      // if (home.data.sections[0].onScrollDownFunction) {
      //   setHomeSearchPage(home.page + 1)
      //   home.data.sections[0].onScrollDownFunction(home.page + 1);
      // }
      return;
    }
  };

  // TODO: napraw wyszukiwanie itp
  async function OnSearch(text: string) {
    let home = homeCache()
    if (!home.localSearch && home.search != text) {
      setHomeSearch(text)
      setHomeSearchPage(1)
      setHomeStopScrolling(false);
      plugin.searchAnime(text, 1, home.filterTags);
      return;
    }

    // if (text == "" || text == " ") {
    //   await setHomeData(history);
    //   return;
    // }

    // TODO: Fix search history
    // let HomeData = home.data;
    // if (!HomeData || !home.data) return;
    // if ( home.data.sections.length == 2 || home.data.sections.length == 0 ) {
    //   HomeData = await history();
    // }
    // if (home.data.sections.length == 1 && home.data[0].title == t("global.history")) {
    //   HomeData = {
    //     sections: [{ ...home.data[0], data: await ReadFile("history") }],
    //   };
    // }
    // if (
    //   home.data.sections.length == 1 &&
    //   home.data[0].title == t("global.continuewatch")
    // ) {
    //   HomeData = {
    //     sections: [{ ...home.data[0], data: await ReadFile("continueWatch") }],
    //   };
    // }

    // let newData = HomeData.sections.map((containerData) => {
    //   let data = containerData.data.filter((data) =>
    //     data.AnimeData.title.romaji.toLowerCase().includes(text.toLowerCase())
    //   );
    //   if (data.length == 0) return;
    //   return { ...containerData, data: data };
    // });
    // setHomeData(async () => ({
    //   sections: newData.filter((value) => value != undefined),
    // }));
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

  // console.log(isOpenSidebar);

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
      />

      <div class={`home-header-container ${homeCache().data && !homeCache().data.topCards ? "active" : ""} ${headerActive() ? "color" : ""}`}>
        <Button
          icon="menu"
          ButtonClass={`${homeCache().data && homeCache().data.topCards ? "home-header-background" : ""} ${headerActive() ? "color" : ""}`}
          onClick={() => setOpenSidebar((prev) => !prev)}
        />
        <div class="home-header-search">
          <Input
            placeholder={t("home.search")}
            InputClass={`${homeCache().data && homeCache().data.topCards ? "home-header-background" : ""} ${headerActive() ? "color" : ""}`}
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
                    titlevent={element.titlevent}
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
