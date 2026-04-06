import { createContext, JSX, Show, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import "./css/menuContext.css";
import Button from "@renderer/components/buttons";

interface menuContextType {
    showCustomMenu: (data: JSX.Element) => void;
    hideCustomMenu: () => void;
    isCustomMenuActive: () => boolean;
}

const menuContext = createContext<menuContextType>();
let customMenuApi: menuContextType | undefined;

export function MenuContextProvider(props: { children: JSX.Element }) {
    const [content, setContent] = createSignal<JSX.Element | undefined>();

    function showCustomMenu(data: JSX.Element) {
        setContent(data);
    }

    function isCustomMenuActive() {
        return content() ? true : false;
    }

    function hideCustomMenu() {
        setContent(undefined)
    }

    return (
        <menuContext.Provider
            value={{ showCustomMenu, hideCustomMenu, isCustomMenuActive }}
        >
            {(() => {
                customMenuApi = { showCustomMenu, hideCustomMenu, isCustomMenuActive };
                return undefined;
            })()}
            {props.children}

            <Show when={content()}>
                <Portal>
                    <main class="custom-menu-background">
                        {content()}
                        <Button
                            icon="arrow_back"
                            ButtonClass="custom-menu-exit-button"
                            onClick={hideCustomMenu}
                        />
                    </main>
                </Portal>
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