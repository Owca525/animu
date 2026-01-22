import Button from "@renderer/components/buttons";
import CheckBox from "@renderer/components/checkBox";
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu";
import { CreateContextMenuOptions, openUrlFolder } from "@renderer/utils/functions";
import { informationPluginFormat, playerPluginFormat } from "@renderer/utils/types";
import { Show } from "solid-js";
import icon from '@resources/icon.png';

interface SettingsPluginProps {
    active: boolean,
    plugin: playerPluginFormat | informationPluginFormat,
    hidePlugin: (plugin: playerPluginFormat, active: boolean) => void,
    pluginSettings: (plugin: playerPluginFormat | informationPluginFormat) => void
    setActivePlugin: (active: boolean, plugin: playerPluginFormat) => void
    unHidePlugin: (plugin: playerPluginFormat) => void
    isHidden?: boolean
}

export default function SettingsPlugin(props: SettingsPluginProps) {

    return (
        <div class='settings-extension-container'
            onContextMenu={(event) =>
                "home" in props.plugin ? "" :
                    OpenContextMenu(
                        CreateContextMenuOptions(
                            props.isHidden ?    [{ option: "UnHide Plugin", onClick: () => props.unHidePlugin(props.plugin as playerPluginFormat) }] : 
                                [{ option: "Hide Plugin", onClick: () => props.hidePlugin(props.plugin as playerPluginFormat, props.active) }]
                        ),
                        event
                    )
            }>
            <div class="settings-extension-top">
                <div class="settings-extension-top-left">
                    <img src={props.plugin.metadata.icon ? props.plugin.metadata.icon : icon} class='settings-extension-image' />
                    <div class="settings-extension-text">
                        <span class='settings-extension-name'>{props.plugin.metadata.name}</span>
                        <span class='settings-extension-author'>{props.plugin.metadata.author}</span>
                    </div>
                </div>
                <div class="settings-extension-top-right">
                    <CheckBox checked={props.active} onChecked={(v) => "home" in props.plugin ? "" : props.setActivePlugin(v, props.plugin as any)} />
                    <span class='settings-extension-version'>v{props.plugin.metadata.version}</span>
                </div>
            </div>
            <div class="settings-extension-bottom">
                <div class="settings-extension-bottom-left">
                    <Show when={props.plugin.metadata.urlWebsite}>
                        <span class='settings-extension-mini-button' onclick={() => openUrlFolder(props.plugin.metadata.urlWebsite!)}>Website</span>
                    </Show>
                    <span class='settings-extension-mini-button' >{"home" in props.plugin ? "Information" : "Player"}</span>
                </div>
                <div class='settings-extension-bottom-right'>
                    <Show when={props.plugin.config}>
                        <Button icon='settings' ButtonClass='settings-extension-button' onClick={() => props.pluginSettings(props.plugin)} />
                    </Show>
                </div>
            </div>
        </div>
    );
};
