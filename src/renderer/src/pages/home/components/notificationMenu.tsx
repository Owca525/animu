import { t } from "@renderer/utils/i18n";
import "./css/notificationMenu.css";
import { createSignal, For, Show } from "solid-js";
import Button from "@renderer/components/buttons";
import { getNotificationList, modifyNotification } from "@renderer/utils/stores/global";

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
                <For each={getNotificationList()}>
                    {(notification) => (
                        <span class={`notificationmenu-notification ${!notification["readed"] ? "notReaded" : ""}`}
                            on:mouseenter={() => {
                                const tmp = JSON.stringify(notification)
                                if (hovered().find((v) => tmp == v)) return
                                setHovered((v) => [...v, tmp])
                                modifyNotification({
                                    ...notification,
                                    readed: true
                                })
                            }}
                            onMouseLeave={() => {
                                const tmp = JSON.stringify(notification)
                                setHovered((v) => v.filter((d) => d != tmp))
                            }}
                            onClick={notification["onClick"]}
                        >
                            <img src={notification["icon"]} class="notificationmenu-notification-img" />
                            <div class="notificationmenu-notification-text-container">
                                <span class="notificationmenu-notification-title">{t(notification["title"])}</span>
                                <span class="notificationmenu-notification-description">{t(notification["description"])}</span>
                            </div>
                        </span>
                    )}
                </For>
                <Show when={getNotificationList().length > 0}>
                    <span>No Notifications</span>
                </Show>
            </div>
        </main >
    );
}
