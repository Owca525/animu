import { cardData, containerData } from "@renderer/utils/types"
import "./css/container.css"
import Card from "./card"
import Button from "@renderer/components/buttons"
import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { getHomeCache, setHomeSearchPage, setHomeStopScrolling } from "@renderer/utils/stores/home"
import { unwrap } from "solid-js/store"
import { useI18n } from "@renderer/utils/i18n"
import { getInformationPlugin } from "@renderer/utils/stores/plugins"
import { useResponse } from "@renderer/utils/hooks/useResponse"
import { setHomeData } from "@renderer/utils/functions"

function Container(props: containerData) {
  const { t, pathExist } = useI18n()
  let container: HTMLDivElement | undefined
  const [currentPage, setcurrentPage] = createSignal(unwrap(getHomeCache().page))
  const [animeCards, setAnimeCards] = createSignal<cardData[]>(props.data)
  const [disableScrollButtons, setDisableScrollButtons] = createSignal<boolean>(false)
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const homeCache = unwrap(getHomeCache())
        if (entry.isIntersecting && !homeCache.stopScrolling) {
          setHomeSearchPage(currentPage() + 1)
          setcurrentPage(currentPage() + 1)
          cardResponse.Refetch([currentPage() + 1, props.title])
          observer.unobserve(entry.target)
        }
      });
    }
  );

  const cardResponse = useResponse({
    queryKey: [currentPage(), props.title],
    queryFn: async () => {
      const homeCache = unwrap(getHomeCache())
      if (homeCache.stopScrolling) return
      if (!props.onScrollDownFunction) return ""
      let tmp = await props.onScrollDownFunction(homeCache.search, unwrap(currentPage()), homeCache.filterTags)
      if (tmp.data.length < tmp.maxPage) setHomeStopScrolling(true);
      setAnimeCards((prev) => [...prev, ...tmp.data])
      return ""
    },
    cacheTime: 2 * 60 * 60 * 1000,
    disable: true,
  })

  onMount(() => {
    handleUpdate()
    checkSkipButtons()
    window.addEventListener("resize", checkSkipButtons)
  })

  createEffect(() => {
    animeCards()
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
    const lastCard = document.querySelector(".card-container:last-child")
    if (!lastCard) return
    let plugin = getInformationPlugin()
    if (animeCards().length < plugin.currentPlugin.metadata.pageSize) setHomeStopScrolling(true)
    observer.observe(lastCard)
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

  return (
    <div tabIndex={-1} class="main-container">
      <div tabIndex={-1} class="container-title-container">
        <Show when={props.title}>
          <div class={props.onTitleClick ? "container-title-click" : "container-title"} onclick={handleTitleClick}>{props.title && pathExist(props.title) ? t(props.title) : props.title}</div>
        </Show>
        <Show when={props.tags}>
          <For each={props.tags}>
            {(element) => (
              <div onClick={element.remover} class="container-tag">{element.name} <span class="material-symbols-outlined container-tag-icon">close</span></div>
            )}
          </For>
        </Show>
      </div>
      <div tabIndex={-1} class={`container-button-container ${animeCards().length <= 0 && " container-error"}`}>
        <Show when={animeCards().length > 0}>
          <div tabIndex={-1} class={props.horizontal ? "container-data-horizontal" : "container-data"} ref={container}>
            <For each={animeCards()}>
              {(card) => (<Card card={card} />)}
            </For>
          </div>
        </Show>
        <Show when={animeCards().length <= 0}>
          <div class="home-empty-container container-error-text"><span class="material-symbols-outlined home-empty-icon">search_off</span>{t("home.nothingfound")}</div>
        </Show>
        <Show when={disableScrollButtons() == false && (props.horizontal && animeCards().length > 0)}>
          <Button icon="chevron_left" ButtonClass="container-left-skip-button" onClick={() => handleButtonScroll(-120)} />
          <Button icon="chevron_right" ButtonClass="container-right-skip-button" onClick={() => handleButtonScroll(120)} />
        </Show>
      </div>
    </div>
  )
}

export default Container