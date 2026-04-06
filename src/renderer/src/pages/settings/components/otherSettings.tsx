import CheckBox from '@renderer/components/checkBox';
import Dropdown from '@renderer/components/dropDown';
import SettingsInput from './settingsInput';
import { Component, For, Show } from 'solid-js';
import { t } from '@renderer/utils/i18n';
import { themeMetadata } from '@renderer/utils/types';

interface OtherSettingsProps {
    title: string,
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

const OtherSettings: Component<OtherSettingsProps> = (props) => {

    return (
        <div class="custom-menu-box">
            <span class="custom-menu-content-title">{t(props.title)}</span>
            <div class="custom-menu-content">
                <Show when={props?.themeConfig}>
                    <For each={props?.themeConfig!.theme.options}>
                        {(value) => (
                            <div class="custom-menu-space">
                                {t(value.name)}
                                <div class="custom-menu-options">
                                    <Show when={!value.dropDown}>
                                        <CheckBox
                                            checked={
                                                value.name in props!.themeConfig!.config
                                                    ? (props!.themeConfig!.config[
                                                        value.name
                                                    ] as boolean)
                                                    : false
                                            }
                                            onChecked={(val) =>
                                                props?.themeConfig!.onChange(
                                                    props?.themeConfig!.theme!,
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
                                                value.name in props!.themeConfig!.config
                                                    ? (props!.themeConfig!.config[
                                                        value.name
                                                    ] as string)
                                                    : value.dropDown![0].option
                                            }
                                            options={value.dropDown?.map((options) => ({
                                                label: options.option,
                                                onClick: (text) =>
                                                    props?.themeConfig!.onChange(
                                                        props?.themeConfig!.theme!,
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
                <Show when={props?.pluginConfig}>
                    <For each={Object.entries(props!.pluginConfig!.config)}>
                        {(el) => {
                            if (typeof el[1] == "string") return (
                                <div class="custom-menu-space">
                                    {t(el[0])}
                                    <SettingsInput startValue={el[1]} onKeyDown={(v) => props?.pluginConfig!.onChange(el[0], v)} />
                                </div>
                            )
                            if (typeof el[1] == "boolean") return (
                                <div class="custom-menu-space">
                                    {t(el[0])}
                                    <CheckBox checked={el[1]} onChecked={(v) => props?.pluginConfig!.onChange(el[0], v)} />
                                </div>
                            )
                            return
                        }}
                    </For>
                </Show>
            </div>
        </div>
    );
};

export default OtherSettings;
