import { createContext, JSX, For, Show, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import "./css/menuContext.css"
import { themeMetadata } from "../types";
import CheckBox from "@renderer/components/checkBox";
import Dropdown from "@renderer/components/dropDown";
import Button from "@renderer/components/buttons";

interface menuProps {
    title: string,
    type: "themeConfig"
    theme: themeMetadata
    config: Record<string, string | boolean>
    onChange: (theme: themeMetadata, change: string, update: string | boolean) => void
}

interface menuContextType {
    showCustomMenu: (data: menuProps) => void
    hideCustomMenu: () => void
    isCustomMenuActive: () => boolean
};

const menuContext = createContext<menuContextType>();
let customMenuApi: menuContextType | undefined;

export function MenuContextProvider(props: { children: JSX.Element }) {
    const [content, setContent] = createSignal<menuProps | undefined>();

    function showCustomMenu(data: menuProps) {
        setContent(data)
    }

    function hideCustomMenu() { setContent(undefined) }

    function isCustomMenuActive() { return content() ? true : false }

    return (
        <menuContext.Provider value={{ showCustomMenu, hideCustomMenu, isCustomMenuActive }}>
            {(() => { customMenuApi = { showCustomMenu, hideCustomMenu, isCustomMenuActive }; return undefined; })()}
            {props.children}

            <Show when={content()}>
                <Portal>
                    <main class="custom-menu-background">
                        <div class="custom-menu-box">
                            <span class="custom-menu-content-title">{content()?.title}</span>
                            <div class="custom-menu-content">
                                <For each={content()?.theme.options}>
                                    {value => (
                                        <div class="custom-menu-space">
                                            {value.name}
                                            <div class="custom-menu-options">
                                                <Show when={!value.dropDown}>
                                                    <CheckBox checked={value.name in content()!.config ? content()!.config[value.name] as boolean : false} onChecked={(val) => content()?.onChange(content()?.theme!, value.name, val)} />
                                                </Show>
                                                <Show when={value.dropDown}>
                                                    <Dropdown disableX buttonText={value.name in content()!.config ? content()!.config[value.name] as string : value.dropDown![0].option} options={value.dropDown?.map((options) => ({ label: options.option, onClick: (text) => content()?.onChange(content()?.theme!, value.name, text) }))}/>
                                                </Show>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </div>
                            <Button icon="arrow_back" ButtonClass="custom-menu-exit-button" onClick={hideCustomMenu}/>
                        </div>
                    </main>
                </Portal>
            </Show>
        </menuContext.Provider>
    );
}

export function showCustomMenu(data: menuProps) {
    if (!customMenuApi) return;
    customMenuApi.showCustomMenu(data)
}

export function hideCustomMenu() {
    if (!customMenuApi) return;
    customMenuApi.hideCustomMenu()
}

export function isCustomMenuActive() {
    if (!customMenuApi) return false;
    return customMenuApi.isCustomMenuActive()
}