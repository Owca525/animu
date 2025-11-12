import { cardData, containerData } from "@renderer/utils/types"
import "./css/container.css"
import Card from "./card"
import Button from "@renderer/components/buttons"
import { t } from "i18next"
import { Component, createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { useQuery } from "@tanstack/solid-query"
import { getHomeCache, setHomeSearchPage, setHomeStopScrolling } from "@renderer/utils/stores/home"
import { unwrap } from "solid-js/store"

const Container: Component<containerData> = ({ title, data, horizontal = false, tags, titlevent, onScrollDownFunction }) => {
  let container: HTMLDivElement | undefined
  const [currentPage, setcurrentPage] = createSignal(unwrap(getHomeCache().page))
  const [animeCards, setAnimeCards] = createSignal<cardData[]>(data)
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setHomeSearchPage(currentPage() + 1)
          setcurrentPage(currentPage() + 1)
          cardResponse.refetch()
        }
      });
    }
  );

  const cardResponse = useQuery(() => ({
    queryKey: [currentPage()],
    queryFn: async ({ queryKey }) => {
      console.log(queryKey)
      const homeCache = unwrap(getHomeCache())
      if (!onScrollDownFunction) return ""
      let tmp = await onScrollDownFunction(homeCache.search, unwrap(currentPage()), homeCache.filterTags)
      if (tmp.data.length < tmp.maxPage) setHomeStopScrolling(true);
      setAnimeCards((prev) => [...prev, ...tmp.data])
      return ""
    },
    refetchOnWindowFocus: false,
    enabled: false,
    staleTime: 2 * 60 * 60 * 1000,
    cacheTime: 2 * 60 * 60 * 1000
  }))

  onMount(() => {
    handleUpdate()
  })

  createEffect(() => {
    animeCards()
    handleUpdate()
  })

  onCleanup(() => {
    observer.disconnect()
  })

  function handleUpdate() {
    if (horizontal) return
    const lastCard = document.querySelector(".card-container:last-child")
    if (!lastCard) return
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

  function handleTitleFunction() {
    if (!titlevent || !titlevent.onTitleClick) return
    titlevent.onTitleClick(titlevent.onTitleClickContext)
  }

  return (
    <div tabIndex={-1} class="main-container">
      <div tabIndex={-1} class="container-title-container">
        <Show when={title}>
          <div class={titlevent ? "container-title-click" : "container-title"} onclick={handleTitleFunction}>{title}</div>
        </Show>
        <Show when={tags}>
          <For each={tags}>
            {(element) => (
              <div onClick={element.remover} class="container-tag">{element.name} <span class="container-tag-icon material-symbols-outlined">close</span></div>
            )}
          </For>
        </Show>
      </div>
      <div tabIndex={-1} class={`container-button-container ${animeCards().length <= 0 && " container-error"}`}>
        <Show when={horizontal && animeCards().length > 0}>
          <Button icon="chevron_left" ButtonClass="container-left-skip-button" onClick={() => handleButtonScroll(-120)} />
        </Show>
        <Show when={animeCards().length > 0}>
          <div tabIndex={-1} class={horizontal ? "container-data-horizontal" : "container-data"} ref={container}>
            <For each={animeCards()}>
              {(card) => (<Card card={card} />)}
            </For>
          </div>
        </Show>
        <Show when={animeCards().length <= 0}>
          <div class="home-empty-container container-error-text"><span class="material-symbols-outlined home-empty-icon">search_off</span>{t("home.nothingfound")}</div>
        </Show>
        <Show when={horizontal && animeCards().length > 0}>
          <Button icon="chevron_right" ButtonClass="container-right-skip-button" onClick={() => handleButtonScroll(120)} />
        </Show>
      </div>
    </div>
  )
}

export default Container