import { containerData } from "@renderer/utils/types"
import "./css/container.css"
import Card from "./card"
import Button from "@renderer/components/buttons"
import { t } from "i18next"
import { Component, For, Show } from "solid-js"

const Container: Component<containerData> = ({ title, data, horizontal = false, tags }) => {
  let container: HTMLDivElement | undefined

  function handleButtonScroll(num: number) {
    if (!container) return
    let maxScrolLeft = (container.scrollWidth - container.clientWidth) + 120
    let currentValue = container.scrollLeft + num
    container.scrollLeft += num
    if (currentValue <= 0) container.scrollLeft = maxScrolLeft
    if (currentValue >= maxScrolLeft) container.scrollLeft = 0
  }

  return (
    <div tabIndex={-1} class="main-container">
        <div tabIndex={-1} class="container-title-container">
          <Show when={title}>
            <div class={false ? "container-title-click" : "container-title"}>{title}</div>
          </Show>
          <Show when={tags}>
            <For each={tags}>
              {(element) => (
                <div onClick={element.remover} class="container-tag">{element.name} <span class="container-tag-icon material-symbols-outlined">close</span></div>
              )}
            </For>
          </Show>
        </div>
        <div tabIndex={-1} class={`container-button-container ${data.length <= 0 && " container-error"}`}>
          <Show when={horizontal && data.length > 0}>
              <Button icon="chevron_left" ButtonClass="container-left-skip-button" onClick={() => handleButtonScroll(-120)}/>
          </Show>
          <Show when={data.length > 0}>
            <div tabIndex={-1} class={horizontal ? "container-data-horizontal" : "container-data"} ref={container}>
                <For each={data}>
                  {(card) => (<Card card={card} />)}
                </For>
            </div>
          </Show>
          <Show when={data.length <= 0}>
              <div class="home-empty-container container-error-text"><span class="material-symbols-outlined home-empty-icon">search_off</span>{t("home.nothingfound")}</div>
          </Show>
          <Show when={horizontal && data.length > 0}>
              <Button icon="chevron_right" ButtonClass="container-right-skip-button" onClick={() => handleButtonScroll(120)}/>
          </Show>
        </div>
    </div>
  )
}

export default Container
