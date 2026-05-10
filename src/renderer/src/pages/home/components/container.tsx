import { cardData, containerData, FilterPluginsParams } from "@renderer/utils/types"
import "./css/container.css"
import Card from "./card"
import Button from "@renderer/components/buttons"
import { createEffect, createSignal, For, Match, onCleanup, onMount, Show, Switch } from "solid-js"
import { getHomeCache, setHomeSearchPage, setHomeStopScrolling } from "@renderer/utils/stores/home"
import { unwrap } from "solid-js/store"
import { useI18n } from "@renderer/utils/i18n"
import { useResponse } from "@renderer/utils/hooks/useResponse"
import { setHomeData, updateHomeContainer } from "@renderer/utils/functions"
import { getGlobalCache, setGlobalToken } from "@renderer/utils/stores/global"
import { v4 as uuidv4 } from 'uuid';

function Container(props: containerData) {
  const { t, pathExist } = useI18n()
  let container: HTMLDivElement | undefined
  const [currentPage, setcurrentPage] = createSignal(unwrap(getHomeCache().page))
  const [animeCards, setAnimeCards] = createSignal<cardData[]>(props.data)
  const [disableScrollButtons, setDisableScrollButtons] = createSignal<boolean>(false)

  const cardResponse = useResponse({
    queryKey: [currentPage(), props.title, props.tags ? props.tags.map((v) => v.name) : []],
    queryFn: async () => {
      const token = uuidv4()
      setGlobalToken(token)

      const homeCache = unwrap(getHomeCache())
      if (homeCache.stopScrolling) return
      if (!props.onScrollDownFunction) return
      let outputFilter: FilterPluginsParams | undefined = undefined;
      if (homeCache.filterTags) {
        outputFilter = Object.entries(homeCache.filterTags).reduce<FilterPluginsParams>(
          (acc, [key, value]) => {
            acc[key] = value.val;
            return acc;
          },
          {}
        );
      }

      const resp = await props.onScrollDownFunction(homeCache.search, unwrap(currentPage()), outputFilter)

      if (getGlobalCache().token != token) return

      setHomeStopScrolling(!resp.nextPage)
      return resp.content
    },
    cacheTime: 900000,
    disable: props["useResponse"] && animeCards().length <= 0 ? false : true,
  })

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const homeCache = unwrap(getHomeCache())
        if (entry.isIntersecting && !homeCache.stopScrolling && !cardResponse.loading() && !cardResponse.error()) {
          setHomeSearchPage(currentPage() + 1)
          setcurrentPage(currentPage() + 1)
          cardResponse.Refetch([currentPage() + 1, props.title, props.tags ? props.tags.map((v) => v.name) : []])
          observer.unobserve(entry.target)
        }
      });
    }
  );

  onMount(() => {
    handleUpdate()
    checkSkipButtons()
    window.addEventListener("resize", checkSkipButtons)
  })

  createEffect(() => {
    const tmpData = cardResponse.data()
    if (!tmpData) return
    setAnimeCards((prev) => [...prev, ...tmpData])
    handleUpdate()
  })

  onCleanup(() => {
    window.removeEventListener("resize", checkSkipButtons)
  })

  function checkSkipButtons() {
    if (!container) return
    if (container.clientWidth >= container.scrollWidth) setDisableScrollButtons(true)
    else setDisableScrollButtons(false)
  }

  function handleUpdate() {
    if (props.horizontal) return
    if (getHomeCache().stopScrolling) return
    setTimeout(() => {
      const lastCard = document.querySelector(".card-container:last-child")
      if (!lastCard) return
      observer.observe(lastCard)
    }, 300)
  }


  function handleButtonScroll(num: number) {
    if (!container) return
    let maxScrolLeft = (container.scrollWidth - container.clientWidth) + 120
    let currentValue = container.scrollLeft + num
    container.scrollLeft += num
    if (currentValue <= 0) container.scrollLeft = maxScrolLeft
    if (currentValue >= maxScrolLeft) container.scrollLeft = 0
  }

  async function handleTitleClick() {
    if (!props.onTitleClick) return
    setHomeData(props.onTitleClick)
  }

  function checkTitle(str: string) {
    let tmp = str.split("/")
    if (tmp.length <= 1) return pathExist(str) ? t(str) : str
    return t(tmp[0], { title: tmp[1] })
  }

  function updateAfterChangePage() {
    if (location.href.includes("#/info") || location.href.includes("#/player") || location.href.includes("#/settings") ) return
    
    const cache = getHomeCache()
    if (cache.data["sections"].length > 1) return
    updateHomeContainer([{
      ...props,
      data: unwrap(animeCards())
    }])
  }

  return (
    <div tabIndex={-1} class={`main-container ${cardResponse.error() || cardResponse.loading() ? "size" : ""}`}>
      <div tabIndex={-1} class="container-title-container">
        <Show when={props.title}>
          <div class={props.onTitleClick ? "container-title-click" : "container-title"} onclick={handleTitleClick}>{props.title && checkTitle(props.title)}</div>
        </Show>
        <Show when={props.tags}>
          <For each={props.tags}>
            {(element) => (
              <div onClick={element.remover} class="container-tag">{t(element.name)} <span class="material-symbols-outlined container-tag-icon">close</span></div>
            )}
          </For>
        </Show>
      </div>

      <div tabIndex={-1} class="container-button-container">
        <Switch>
          <Match when={!cardResponse.loading() && (cardResponse.error() || animeCards().length <= 0)}>
            <div class="container-error-text">
              <span class="material-symbols-outlined container-icon">search_off</span>{t("home.nothingfound")}
            </div>
          </Match>
          <Match when={cardResponse.loading() && animeCards().length <= 0}>
            <div class="container-error-text">
              <span class="material-symbols-outlined loading-animation container-icon">progress_activity</span>
            </div>
          </Match>
          <Match when={animeCards().length > 0}>
            <div tabIndex={-1} class={props.horizontal ? "container-data-horizontal" : "container-data"} ref={container}>
              <For each={animeCards()}>
                {(card) => (
                  <Card
                    card={card}
                    containerClick={updateAfterChangePage} small={animeCards().length <= 15}
                  />
                )}
              </For>
            </div>
          </Match>
        </Switch>
        <Show when={disableScrollButtons() == false && (props.horizontal && animeCards().length > 0)}>
          <Button icon="chevron_left" ButtonClass="container-left-skip-button" onClick={() => handleButtonScroll(-120)} />
          <Button icon="chevron_right" ButtonClass="container-right-skip-button" onClick={() => handleButtonScroll(120)} />
        </Show>
      </div>

      <Switch>
        <Match when={cardResponse.loading() && animeCards().length > 0}>
          <div class="container-loading-bottom">
            <span class="material-symbols-outlined loading-animation icon">progress_activity</span>
          </div>
        </Match>
        <Match when={cardResponse.error() && animeCards().length > 0}>
          <div class="container-loading-bottom">
            <span class="material-symbols-outlined loading-animation icon">progress_activity</span>
          </div>
        </Match>
      </Switch>
    </div>
  )
}

export default Container