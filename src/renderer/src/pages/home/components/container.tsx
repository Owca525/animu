import { cardData, containerData, homeData } from "@renderer/utils/GlobalInterface"
import "./css/container.css"
import Card from "./card"
import { useEffect, useRef, useState } from "react"
import Button from "@renderer/components/buttons"
import { t } from "i18next"
import { useQuery } from "react-query"
import store from "@renderer/utils/store"
import { homeStopScrolling } from "@renderer/utils/pluginApi"

const Container: React.FC<containerData> = ({ title, data, horizontal = false, titlevent, tags, onScrollDownFunction }) => {
  const container = useRef<HTMLDivElement>(null)
  const [animeCards, setAnimeCards] = useState<cardData[]>(data)

  const { isFetching: isLoading, refetch } = useQuery({
    queryKey: [store.getState().home],
    queryFn: async ({ queryKey }) => {
      const [cache] = queryKey as [homeData];
      if (!onScrollDownFunction) return
      let tmp = await onScrollDownFunction(cache.search, cache.page, cache.filterTags)
      if (tmp.data.length < tmp.maxPage) homeStopScrolling(true);
      setAnimeCards((prev) => [...prev, ...tmp.data])
    },
    refetchOnWindowFocus: false,
    enabled: false,
    staleTime: 2 * 60 * 60 * 1000,
    cacheTime: 2 * 60 * 60 * 1000
  });

  function handleButtonScroll(num: number) {
    if (!container.current) return
    let maxScrolLeft = (container.current.scrollWidth - container.current.clientWidth) + 120
    let currentValue = container.current.scrollLeft + num
    container.current.scrollLeft += num
    if (currentValue <= 0) container.current.scrollLeft = maxScrolLeft
    if (currentValue >= maxScrolLeft) container.current.scrollLeft = 0
  }

  function handleTitleFunction() {
    if (!titlevent || !titlevent.onTitleClick) return
    titlevent.onTitleClick(titlevent.onTitleClickContext)
  }

  function handleScroll() {
    let cache: homeData = store.getState().home
    if (!cache.data) return;
    if (!cache.mainContainer) return;
    if (cache.data.sections.length > 1) return;

    const currentPos = -cache.mainContainer.scrollTop + cache.mainContainer.scrollHeight;
    const endPosition = cache.mainContainer.offsetHeight;
    const isFUCKINGBottom = parseInt(currentPos.toFixed(0)) <= endPosition + 30;
    if (!isFUCKINGBottom || cache.stopScrolling) return
    store.dispatch({ type: "setPage", payload: cache.page + 1 });
    refetch()
  };

  useEffect(() => {
    let cache: homeData = store.getState().home
    if (cache.data.sections.length > 1) return;
    store.dispatch({ type: "setonScrollContainer", payload: handleScroll });
    if (!cache.mainContainer) return
    if (cache.mainContainer.scrollHeight > cache.mainContainer.clientHeight) refetch()
  }, [])

  return (
    <div tabIndex={-1} className="main-container">
      <div tabIndex={-1} className="container-title-container">
        {title && <div className={titlevent ? "container-title-click" : "container-title"} onClick={handleTitleFunction}>{title}</div>}
        {tags && tags.map((element) => <div onClick={element.remover} className="container-tag">{element.name} <span className="container-tag-icon material-symbols-outlined">close</span></div>)}
      </div>
      <div tabIndex={-1} className={`container-button-container ${animeCards.length <= 0 && " container-error"}`}>
        {horizontal && animeCards.length > 0 ? <Button icon="chevron_left" ButtonClass="container-left-skip-button" onClick={() => handleButtonScroll(-120)} /> : ""}
        {animeCards.length > 0 &&
          <div tabIndex={-1} className={horizontal ? "container-data-horizontal" : "container-data"} ref={container}>
            {animeCards.length > 0 && animeCards.map((card) => <Card card={card} />)}
          </div>
        }
        {animeCards.length <= 0 && <div className="home-empty-container container-error-text"><span className="material-symbols-outlined home-empty-icon">search_off</span>{t("home.nothingfound")}</div>}
        {horizontal && animeCards.length > 0 ? <Button icon="chevron_right" ButtonClass="container-right-skip-button" onClick={() => handleButtonScroll(120)} /> : ""}
      </div>
    </div>
  )
}

export default Container
