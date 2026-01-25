import { createContext, JSX, For, Show, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import "./css/menuContext.css";
import { themeMetadata } from "../types";
import CheckBox from "@renderer/components/checkBox";
import Dropdown from "@renderer/components/dropDown";
import Button from "@renderer/components/buttons";
import SettingsInput from "@renderer/pages/settings/components/settingsInput";
import { useI18n } from "../i18n";

interface menuProps {
    title: string;
    themeConfig?: {
        theme: themeMetadata;
        config: Record<string, string | boolean>;
        onChange: (theme: themeMetadata, change: string, update: string | boolean) => void;
    };
    pluginConfig?: {
        config: { [key: string]: any }
        onChange: (variable: string, change: any) => void
    }
}

interface menuContextType {
    showCustomMenu: (data: menuProps) => void;
    hideCustomMenu: () => void;
    isCustomMenuActive: () => boolean;
}

const menuContext = createContext<menuContextType>();
let customMenuApi: menuContextType | undefined;

export function MenuContextProvider(props: { children: JSX.Element }) {
    const { t, pathExist } = useI18n()
    const [content, setContent] = createSignal<menuProps | undefined>();

    function showCustomMenu(data: menuProps) {
        setContent(data);
    }

    function hideCustomMenu() {
        setContent(undefined);
    }

    function isCustomMenuActive() {
        return content() ? true : false;
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
                        <div class="custom-menu-box">
                            <span class="custom-menu-content-title">{pathExist(content()?.title!) ? t(content()?.title!) : content()?.title}</span>
                            <div class="custom-menu-content">
                                <Show when={content()?.themeConfig}>
                                    <For each={content()?.themeConfig!.theme.options}>
                                        {(value) => (
                                            <div class="custom-menu-space">
                                                {pathExist(value.name) ? t(value.name) : value.name}
                                                <div class="custom-menu-options">
                                                    <Show when={!value.dropDown}>
                                                        <CheckBox
                                                            checked={
                                                                value.name in content()!.themeConfig!.config
                                                                    ? (content()!.themeConfig!.config[
                                                                        value.name
                                                                    ] as boolean)
                                                                    : false
                                                            }
                                                            onChecked={(val) =>
                                                                content()?.themeConfig!.onChange(
                                                                    content()?.themeConfig!.theme!,
                                                                    value.name,
                                                                    val,
                                                                )
                                                            }
                                                        />
                                                    </Show>
                                                    <Show when={value.dropDown}>
                                                        <Dropdown
                                                            disableX
                                                            buttonText={
                                                                value.name in content()!.themeConfig!.config
                                                                    ? (content()!.themeConfig!.config[
                                                                        value.name
                                                                    ] as string)
                                                                    : value.dropDown![0].option
                                                            }
                                                            options={value.dropDown?.map((options) => ({
                                                                label: options.option,
                                                                onClick: (text) =>
                                                                    content()?.themeConfig!.onChange(
                                                                        content()?.themeConfig!.theme!,
                                                                        value.name,
                                                                        text,
                                                                    ),
                                                            }))}
                                                        />
                                                    </Show>
                                                </div>
                                            </div>
                                        )}
                                    </For>
                                </Show>
                                <Show when={content()?.pluginConfig}>
                                    <For each={Object.entries(content()!.pluginConfig!.config)}>
                                        {(el) => {
                                            if (typeof el[1] == "string") return (
                                                <div class="custom-menu-space">
                                                    {pathExist(el[0]) ? t(el[0]) : el[0]}
                                                    <SettingsInput startValue={el[1]} onKeyDown={(v) => content()?.pluginConfig!.onChange(el[0], v)}/>
                                                </div>
                                            )
                                            if (typeof el[1] == "boolean") return (
                                                <div class="custom-menu-space">
                                                    {pathExist(el[0]) ? t(el[0]) : el[0]}
                                                    <CheckBox checked={el[1]} onChecked={(v) => content()?.pluginConfig!.onChange(el[0], v)}/>
                                                </div>
                                            )
                                            return
                                        }}
                                    </For>
                                </Show>
                            </div>
                            <Button
                                icon="arrow_back"
                                ButtonClass="custom-menu-exit-button"
                                onClick={hideCustomMenu}
                            />
                        </div>
                    </main>
                </Portal>
            </Show>
        </menuContext.Provider>
    );
}

export function showCustomMenu(data: menuProps) {
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