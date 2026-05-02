import { createContext, JSX, Show, createSignal, For } from "solid-js";
import { Portal } from "solid-js/web";
import "./css/menuContext.css";
import Button from "@renderer/components/buttons";
import { unwrap } from "solid-js/store";

interface menuContextType {
    showCustomMenu: (data: JSX.Element) => void;
    hideCustomMenu: () => void;
    isCustomMenuActive: () => boolean;
    hideAllCustomMenu: () => void
}

const menuContext = createContext<menuContextType>();
let customMenuApi: menuContextType | undefined;

export function MenuContextProvider(props: { children: JSX.Element }) {
    const [content, setContent] = createSignal<JSX.Element[]>([]);

    function showCustomMenu(data: JSX.Element) {
        setContent((v) => [...v, data]);
    }

    function isCustomMenuActive() {
        return content() ? true : false;
    }

    function hideCustomMenu() {
        let tmp = unwrap(content())
        tmp.pop()

        setContent([])
        setContent(tmp)
    }

    function hideAllCustomMenu() {
        setContent([])
    }

    return (
        <menuContext.Provider
            value={{ showCustomMenu, hideCustomMenu, isCustomMenuActive, hideAllCustomMenu }}
        >
            {(() => {
                customMenuApi = { showCustomMenu, hideCustomMenu, isCustomMenuActive, hideAllCustomMenu };
                return undefined;
            })()}
            {props.children}

            <Show when={content()}>
                <For each={content()}>
                    {(element) => (
                        <Portal>
                            <main class="custom-menu-background">
                                {element}
                                <Button
                                    icon="arrow_back"
                                    ButtonClass="custom-menu-exit-button"
                                    onClick={hideCustomMenu}
                                />
                            </main>
                        </Portal>
                    )}
                </For>
            </Show>
        </menuContext.Provider>
    );
}

export function showCustomMenu(data: JSX.Element) {
    if (!customMenuApi) return;
    customMenuApi.showCustomMenu(data);
}

export function hideCustomMenu() {
    if (!customMenuApi) return;
    customMenuApi.hideCustomMenu();
}

export function isCustomMenuActive() {
    if (!customMenuApi) return false;
    return customMenuApi.isCustomMenuActive();
}

export function hideAllCustomMenu() {
    if (!customMenuApi) return false;
    return customMenuApi.hideAllCustomMenu();
}