import { toast, ToastOptions } from "./context/ToastNotification"
import { t } from "./i18n"
import { isAnimuFocus, setNotificationList } from "./stores/global"
import { NotificationProps, NotificationExpanded } from "./types"

class NotifcationManagerInstance {
    cacheNotification: NotificationExpanded[] = []

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
        if (!cache) return

        this.cacheNotification = cache
        setNotificationList(this.cacheNotification)
    }

    private SaveNotificationCache = () => {
        localStorage.setItem("animu_notification_cache", JSON.stringify(this.cacheNotification))
        setNotificationList(this.cacheNotification)
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

        this.cacheNotification = [
            ...this.cacheNotification,
            {
                ...notificiation,
                readed: false,
                notID: notID
            }
        ]

        this.SaveNotificationCache()
    }

    DeleteNotification = (notID: string) => {
        this.cacheNotification = this.cacheNotification.filter((v) => v["notID"] != notID)
        this.SaveNotificationCache()
        return true
    }

    ClearAllNotification = () => {
        this.cacheNotification = []
        this.SaveNotificationCache()
    }

    ReadedNotification = (notID: string) => {
        this.cacheNotification = this.cacheNotification.map((v) => v["notID"] == notID ? {...v, readed: true} : v)
        this.SaveNotificationCache()
        return true
    }
}

export const NotificationManager = new NotifcationManagerInstance()
export const sendNotification = NotificationManager.sendNotification
export const DeleteNotification = NotificationManager.DeleteNotification
export const ClearAllNotification = NotificationManager.ClearAllNotification
export const ReadedNotification = NotificationManager.ReadedNotification