import { t } from "@renderer/utils/i18n";
import "./css/notificationMenu.css";
import { createSignal, For, Show } from "solid-js";
import Button from "@renderer/components/buttons";
import { getNotificationList } from "@renderer/utils/stores/global";
import { ClearAllNotification, DeleteNotification, ReadedNotification } from "@renderer/utils/NotificationManager";

export default function NotificationMenu() {
    const [active, setActive] = createSignal<boolean>(false)

    return (
        <main class="notification-menu-container">
            <Button icon="notifications" ButtonClass="notification-menu-button" onClick={() => setActive((v) => !v)} />

            <Show when={getNotificationList().length > 0 && getNotificationList().filter((v) => v["readed"] == false).length > 0}>
                <span class="notification-menu-button-num">{getNotificationList().filter((v) => v["readed"] == false).length}</span>
            </Show>

            <Show when={active()}>
                <div class="notification-container active">
                    <div class="notification-container-top">
                        <div class="notification-container-left">
                            <span class="material-symbols-outlined icon notification-container-icon">notifications</span>
                            Notifications {getNotificationList().length}
                        </div>
                        <div class="notification-container-right">
                            <Button 
                                ButtonClass="notification-container-button" 
                                iconClassName="notification-container-button-icon" 
                                icon="delete" 
                                content="Delete All" 
                                onClick={ClearAllNotification}
                            />
                        </div>
                    </div>

                    <div class={`notification-list ${getNotificationList().length <= 0 ? "empty" : ""}`}>
                        <For each={getNotificationList()}>
                            {(notification) => (
                                <span class={`notification ${!notification["readed"] ? "notReaded" : ""}`}
                                    on:mouseenter={() => {
                                        if (notification["readed"]) return
                                        ReadedNotification(notification["notID"])
                                    }}
                                    onClick={notification["onClick"]}
                                >
                                    <sheep-img src={notification["icon"]} class="notification-img" />
                                    <div class="notification-text-container">
                                        <span class="notification-title">{t(notification["title"])}</span>
                                        <span class="notification-description">{t(notification["description"])}</span>
                                    </div>
                                    <Button icon="delete" ButtonClass="notification-button" iconClassName="notification-button-icon" onClick={() => DeleteNotification(notification["notID"])} />
                                </span>
                            )}
                        </For>
                        <Show when={getNotificationList().length <= 0}>
                            <span class="notification-list-nothing-container">
                                <span class="material-symbols-outlined icon notification-list-nothing-icon">flood</span>
                                <span class="notification-list-nothing-text">No Notifications</span>
                            </span>
                        </Show>
                    </div>
                </div>
            </Show>
        </main >
    );
}
