import Button from './buttons';
import icon from '@resources/icon.png';
import {
  createEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show
  } from 'solid-js';
import { createShortcut } from '@solid-primitives/keyboard';
import { setHomeSearchPage } from '@renderer/utils/stores/home';
import { sidebarData } from '@renderer/utils/types';
import './css/sidebar.css';
import { useI18n } from '@renderer/utils/i18n';

interface sidebarProps {
  showLogo?: boolean
  openSidebar?: boolean
  onChange?: (isOpen: boolean) => void
  onClickTopButtons?: (text: string) => void
  onClickBottomButtons?: (text: string) => void
  data: {
    top: sidebarData[]
    bottom: sidebarData[]
  }
  activeElement?: boolean
  setAciveElement?: number
}
// Component<sidebarProps> = ({ showLogo = false, data, onChange, openSidebar, activeElement }) =>
export default function Sidebar(props: sidebarProps) {
  const { t, pathExist } = useI18n()

  const [sidebarHover, setHover] = createSignal<boolean>(false)
  const [animuVersion, setVersion] = createSignal<string>("")
  const [currentButton, setCurrentButton] = createSignal<number>(
    props.activeElement ?
    props.setAciveElement ? props.setAciveElement : 0
    : -1
  )

  let sidebarRef: HTMLDivElement | undefined;

  const handleClickOutside = (event: MouseEvent) => {
    let data = event.target as HTMLElement
    if (data.classList.contains("sidebar-button")) return
    if (data.classList.contains("sidebar-hide-button")) return
    setHover(() => false)
  };

  createEffect(() => {
    if (props.openSidebar) setHover(props.openSidebar)
    if (props.onChange) props.onChange(sidebarHover())
  })

  onMount(async () => {
    setVersion(await window.backend.version())
    document.addEventListener('mousedown', handleClickOutside);
  })
  onCleanup(() => {
    document.removeEventListener('mousedown', handleClickOutside);
  })

  createShortcut(["tab"], () => {
    setHover((prev) => !prev)
  })

  function hideSidebar(event: MouseEvent, func, num?: number) {
    setHomeSearchPage(1)

    if (props.activeElement && num != undefined) setCurrentButton(num)
    setHover((prev) => !prev)
    if (func) func(event)
  }

  function detectSidebarStateButton(text: string): string | undefined {
    if (sidebarHover()) return pathExist(text) ? t(text) : text
    return undefined
  }

  function detectSidebarState() {
    if (sidebarHover()) return `sidebar-container-max ${!props.showLogo ? "show" : ""}`
    return `sidebar-container-min ${!props.showLogo ? "hidden" : ""}`
  }

  function detectSidebarStateClass() {
    if (sidebarHover()) return "sidebar-button"
    return "sidebar-button-min"
  }

  function detectSidebarStateContainers() {
    if (sidebarHover()) return "sidebar-max-button-container"
    return "sidebar-min-button-container"
  }

  function checkNumber(num: number): string {
    if (num == currentButton()) return "active"
    return ""
  }

  return (
    <div class={detectSidebarState()} ref={sidebarRef}
      // initial={showLogo ? "visible" : "hidden"}
      // animate={showLogo ? "visible" : sidebarHover ? "visible" : "hidden"}
      // variants={sidebarVariants}
      // transition={{ duration: 0.2 }}
      onMouseEnter={() => props.showLogo && setHover(() => true)}
      onMouseLeave={() => props.showLogo && setHover(() => false)}
    >
      <Show when={props.showLogo}>
        <div class="sidebar-logo-icon-container">
          <img src={icon} alt={animuVersion()} class="sidebar-image" />
          <Show when={sidebarHover()}>
            <div class="sidebar-version">v{animuVersion()}</div>
          </Show>
        </div>
      </Show>
      <div class="sidebar-buttons-content">
        <div class={`sidebar-top ${detectSidebarStateContainers()}`}>
          <Show when={!props.showLogo}>
            <Button icon={"arrow_back"}
              content={detectSidebarStateButton(t("sidebar.hide"))}
              onClick={(event) => hideSidebar(event, undefined) }
              ButtonClass={detectSidebarStateClass()}
              iconClassName="sidebar-button"
            />
          </Show>
          <div class="sidebar-black-line"></div>
          <For each={props.data.top}>
            {(value, i) => (
              <Button icon={value.icon}
                content={detectSidebarStateButton(value.text)}
                onClick={(event) => { 
                  hideSidebar(event, value.onClick, i()) 
                  if (props.onClickTopButtons) props.onClickTopButtons(value.text)
                }}
                ButtonClass={`${detectSidebarStateClass()} ${checkNumber(i())}`}
                iconClassName={`sidebar-button ${checkNumber(i())}`} />
            )}
          </For>
        </div>
        <div class={`sidebar-bottom ${detectSidebarStateContainers()}`}>
          <div class="sidebar-black-line"></div>
          <For each={props.data.bottom}>
            {(value) => (
              <Button icon={value.icon} 
                content={detectSidebarStateButton(value.text)} 
                onClick={(event) => {
                  hideSidebar(event, value.onClick)
                  if (props.onClickBottomButtons) props.onClickBottomButtons(value.text)
                }} 
                ButtonClass={detectSidebarStateClass()} 
                iconClassName="sidebar-button" />
            )}
          </For>
        </div>
      </div>
    </div>
  )
}
