import { toast, ToastOptions } from "./context/ToastNotification"
import { t } from "./i18n"
import { isAnimuFocus, setNotificationList } from "./stores/global"
import { NotificationProps, NotificationExpanded } from "./types"

class NotifcationManagerInstance {
    cacheNotitifications: NotificationExpanded[] = []

    constructor() {
        this.ReadNotificationCache()
    }

    private ReadNotificationCache = () => {
        const cache = localStorage.getItem("animu_notification_cache")

        try {
            const list: NotificationExpanded[] = JSON.parse(cache!)
            this.CheckTypeCache(list)
        } catch (error) {
            console.error("NotifcationManagerInstance/ReadNotificationCache", error)
        }
    }

    private CheckTypeCache = (cache: NotificationExpanded[]) => {
        this.cacheNotitifications = cache
    }

    private SaveNotificationCache = () => {
        localStorage.setItem("animu_notification_cache", JSON.stringify(this.cacheNotitifications))
        setNotificationList(this.cacheNotitifications)
    }

    sendNotification = (notificiation: NotificationProps, toastprop?: ToastOptions) => {
        const notID = crypto.randomUUID()

        if (!isAnimuFocus()) {
            Notification.requestPermission().then(permission => {
                if (permission != 'granted') return
                let tmp = new Notification(t(notificiation.title), { body: t(notificiation.description), icon: notificiation.icon });
                if (notificiation.onClick) tmp.addEventListener("click", notificiation.onClick)
            });
        } else {
            toast({
                title: t(notificiation.title),
                description: t(notificiation.description),
                icon: notificiation.icon
            }, { ...toastprop, type: "notification", onClick: notificiation.onClick })
        }

        this.cacheNotitifications = [
            ...this.cacheNotitifications,
            {
                ...notificiation,
                readed: false,
                notID: notID
            }
        ]

        this.SaveNotificationCache()
    }

    DeleteNotification = (notID: string) => {
        this.cacheNotitifications.filter((v) => v["notID"] != notID)
        this.SaveNotificationCache()
        return true
    }

    ClearAllNotification = () => {
        this.cacheNotitifications = []
        this.SaveNotificationCache()
    }

    ReadedNotification = (notID: string) => {
        this.cacheNotitifications = this.cacheNotitifications.map((v) => v["notID"] == notID ? {...v, readed: true} : v)
        this.SaveNotificationCache()
        return true
    }
}

export const NotificationManager = new NotifcationManagerInstance()
export const sendNotification = NotificationManager.sendNotification
export const DeleteNotification = NotificationManager.DeleteNotification
export const ClearAllNotification = NotificationManager.ClearAllNotification
export const ReadedNotification = NotificationManager.ReadedNotification