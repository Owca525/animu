import { t } from "@renderer/utils/i18n";
import "./css/notificationMenu.css";
import { createSignal, For, Show } from "solid-js";
import Button from "@renderer/components/buttons";
import { getNotificationList } from "@renderer/utils/stores/global";
import { ReadedNotification } from "@renderer/utils/NotificationManager";

export default function NotificationMenu() {
    const [active, setActive] = createSignal<boolean>(false)
    const [hovered, setHovered] = createSignal<string[]>([])

    return (
        <main class="notificationmenu-container">
            <Button icon="notifications" ButtonClass="notificationmenu-button" onClick={() => setActive((v) => !v)} />

            <Show when={getNotificationList().length > 0 && getNotificationList().filter((v) => v["readed"] == false).length > 0}>
                <span class="notificationmenu-notitification-number">{getNotificationList().filter((v) => v["readed"] == false).length}</span>
            </Show>

            <div class={`notificationmenu-notification-container ${active() ? "active" : ""} ${getNotificationList().length > 0 ? "empty" : ""}`}>
                <div class="notificationmenu-notification-container-top">
                    <div class="notificationmenu-notification-container-left">
                        <span class="material-symbols-outlined icon">notifications</span>
                        Number Of Notification {getNotificationList().length}
                    </div>
                    <div class="notificationmenu-notification-container-right">
                        <Button icon="delete" content="Delete All"/>
                    </div>
                </div>

                <div class="notificationmenu-notification-notifications">
                    <For each={getNotificationList()}>
                        {(notification) => (
                            <span class={`notificationmenu-notification ${!notification["readed"] ? "notReaded" : ""}`}
                                on:mouseenter={() => {
                                    if (hovered().find((v) => notification["notID"] == v)) return
                                    setHovered((v) => [...v, notification["notID"]])
                                    ReadedNotification(notification["notID"])
                                }}
                                onMouseLeave={() => {
                                    setHovered((v) => v.filter((d) => d != notification["notID"]))
                                }}
                                onClick={notification["onClick"]}
                            >
                                <img src={notification["icon"]} class="notificationmenu-notification-img" />
                                <div class="notificationmenu-notification-text-container">
                                    <span class="notificationmenu-notification-title">{t(notification["title"])}</span>
                                    <span class="notificationmenu-notification-description">{t(notification["description"])}</span>
                                </div>
                                <Button icon="delete" />
                            </span>
                        )}
                    </For>
                    <Show when={getNotificationList().length <= 0}>
                        <span>No Notifications</span>
                    </Show>
                </div>
            </div>
        </main >
    );
}
