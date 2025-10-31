import { createSignal, createEffect, onCleanup, For, onMount } from "solid-js";
import Button from "./buttons";
import "./css/sidebar.css";
import icon from "../../../../resources/icon.png";
import { sidebarData } from "@renderer/utils/types";
import { motion } from "@motionone/solid";
import { createShortcut } from "@solid-primitives/keyboard";
import { setHomeLocalSearch } from "@renderer/utils/stores/home";

interface SidebarProps {
  showLogo?: boolean;
  openSidebar?: boolean;
  onChange?: (isOpen: boolean) => void;
  data: {
    top: sidebarData[];
    bottom: sidebarData[];
  };
  activeElement?: boolean;
}

export default function Sidebar(props: SidebarProps) {
  const [sidebarHover, setHover] = createSignal(false);
  const [version, setVersion] = createSignal("");
  let currentButton = props.activeElement ? 0 : -1;

  const getVersion = async () => {
    const ver = await window.backend.version();
    setVersion(ver);
  };

  createEffect(() => {
    if (props.onChange) props.onChange(sidebarHover());
    if (props.openSidebar) setHover(props.openSidebar);
  });

  const handleClickOutside = (event: MouseEvent) => {
    const data = event.target as HTMLElement;
    if (data.classList.contains("sidebar-button")) return;
    if (data.classList.contains("sidebar-hide-button")) return;
    setHover(false);
  };

  onMount(() => {
    getVersion();
    document.addEventListener("mousedown", handleClickOutside);
    onCleanup(() => document.removeEventListener("mousedown", handleClickOutside));
  })

  createShortcut(["Tab"], () => setHover((prev) => !prev));

  function hideSidebar(event: MouseEvent, func?: (event: MouseEvent) => void, num?: number) {
    if (props.activeElement && num != undefined) currentButton = num;
    setHover((prev) => !prev);
    if (func) func(event);
  }

  function detectSidebarStateButton(text: string): string | undefined {
    return sidebarHover() ? text : undefined;
  }

  function detectSidebarState() {
    return sidebarHover() ? "sidebar-container-max" : "sidebar-container-min";
  }

  function detectSidebarStateClass() {
    return sidebarHover() ? "sidebar-button" : "sidebar-button-min";
  }

  function detectSidebarStateContainers() {
    return sidebarHover() ? "sidebar-max-button-container" : "sidebar-min-button-container";
  }

  function checkNumber(num: number) {
    return num === currentButton ? "active" : "";
  }

  return (
    <div
      class={detectSidebarState()}
      onMouseEnter={() => props.showLogo && setHover(true)}
      onMouseLeave={() => props.showLogo && setHover(false)}
    >
      {props.showLogo && (
        <div class="sidebar-logo-icon-container">
          <img src={icon} alt={version()} class="sidebar-image" />
          {sidebarHover() && <div class="sidebar-version">v{version()}</div>}
        </div>
      )}
      <div class="sidebar-buttons-content">
        <div class={`sidebar-top ${detectSidebarStateContainers()}`}>
          {!props.showLogo && (
            <Button
              icon="arrow_back"
              content={detectSidebarStateButton("Hide Sidebar")}
              onClick={(event) => {
                setHomeLocalSearch(false);
                hideSidebar(event as any);
              }}
              ButtonClass={detectSidebarStateClass()}
              iconClassName="sidebar-button"
            />
          )}
          <div class="sidebar-black-line"></div>
          <For each={props.data.top}>
            {(value, i) => (
              <Button
                icon={value.icon}
                content={detectSidebarStateButton(value.text)}
                onClick={(event) => {
                  setHomeLocalSearch(false);
                  hideSidebar(event as any, value.onClick, i());
                }}
                ButtonClass={`${detectSidebarStateClass()} ${checkNumber(i())}`}
                iconClassName={`sidebar-button ${checkNumber(i())}`}
              />
            )}
          </For>
        </div>
        <div class={`sidebar-bottom ${detectSidebarStateContainers()}`}>
          <div class="sidebar-black-line"></div>
          <For each={props.data.bottom}>
            {(value) => (
              <Button
                icon={value.icon}
                content={detectSidebarStateButton(value.text)}
                onClick={(event) => {
                  setHomeLocalSearch(false);
                  hideSidebar(event as any, value.onClick);
                }}
                ButtonClass={detectSidebarStateClass()}
                iconClassName="sidebar-button"
              />
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
