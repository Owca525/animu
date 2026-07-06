import { setServiuceList } from "./stores/global"
import { DefaultService, serviceFormat } from "./types"

class ServiceManagerInstance {
    /** @type {DefaultService[]} */
    defaultServices = []
    /** @type {serviceFormat[]} */
    services = []

    InitialServiceManager = (defaultServices = []) => {
        this.defaultServices = defaultServices

        this.defaultServices.forEach((service) => {
            this.RunService(service)
        })
        setServiuceList(this.services)
    }

    /**
     * @param {DefaultService} service
     * @returns {void}
     */
    RunService = (service) => {
        if (this.FindService(service["name"])) return

        const serviceID = crypto.randomUUID()

        /** @type {NodeJS.Timeout | undefined} */
        let timer = undefined

        if (service.active) timer = setInterval(() => {
            try {
                service["execute"]()
            } catch (error) { console.error(`Failed Execute ${service["name"]}`, error) }
        }, service.activeTime)

        if (!service.noFirstStart) {
            try {
                service["execute"]()
            } catch (error) { console.error(`Failed Execute ${service["name"]}`, error) }
        }

        this.services.push({
            active: service["active"],
            id: serviceID,
            execute: service["execute"],
            timer: timer,
            name: service["name"],
            description: service["description"],
            activeTime: service["activeTime"]
        })
    }

    /**
     * @param {string} name
     * @returns {boolean}
     */
    StopService = (name) => {
        let service = this.FindService(name)

        if (!service) return false

        if (!service.active) return true

        if (service["timer"]) clearInterval(service["timer"])

        this.services = this.services.map((s) => s["id"] == service["id"] ? {
            ...service,
            time: undefined,
            active: false
        } : s)
        setServiuceList(this.services)

        return true
    }

    /**
     * @param {string} name
     * @returns {boolean}
     */
    ActiveService = (name) => {
        let service = this.FindService(name)

        if (!service) return false

        if (service.active) return true

        const timer = setInterval(() => {
            try {
                service["execute"]()
            } catch (error) { console.error(`Failed Execute ${service["name"]}`, error) }
        }, service["activeTime"])

        try {
            service["execute"]()
        } catch (error) { console.error(`Failed Execute ${service["name"]}`, error) }

        this.services = this.services.map((s) => s["id"] == service["id"] ? {
            ...service,
            time: timer,
            active: true
        } : s)
        setServiuceList(this.services)

        return true
    }

    /**
     * @param {string} name
     * @returns {serviceFormat | undefined}
     */
    FindService = (name) => {
        let service = this.services.find((v) => v["name"] == name)
        if (!service) service = this.services.find((v) => v["id"] == name)

        return service
    }
}

export const ServiceManager = new ServiceManagerInstance