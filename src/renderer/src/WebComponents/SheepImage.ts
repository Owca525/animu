class SheepImage extends HTMLElement {
    divClass: string | undefined = undefined
    imgClass: string | undefined = undefined
    src: string | undefined = undefined
    onClick: ((ev: PointerEvent) => void) | undefined
    onLoad: ((ev: Event) => void) | undefined
    onError: ((ev: string | Event) => void) | undefined
    ImgAlt: string | undefined = undefined

    loadingImg = true
    errorImg = false

    constructor() {
        super();

        this.divClass = this.getAttribute("divClass") ?? ""
        this.imgClass = this.getAttribute("class") ?? ""
        this.src = this.getAttribute("src") ?? ""
        this.ImgAlt = this.getAttribute("alt") ?? ""
        this.onClick = this.getAttribute("onClick") as any ?? undefined
        this.onLoad = this.getAttribute("onLoad") as any ?? undefined
        this.onError = this.getAttribute("onError") as any ?? undefined
    }

    connectedCallback() {
        const tmpClass = this.getAttribute("class")
        if (tmpClass != undefined && tmpClass != this.imgClass) {
            this.imgClass = tmpClass
        }

        if (!this.divClass) {
            this.style.width = "max-content"
            this.style.height = "max-content"
            this.style.display = "flex"
            this.style.justifyContent = "center"
            this.style.alignItems = "center"
        } else {
            this.className = this.divClass
        }

        const span = document.createElement("span")
        span.className = `material-symbols-outlined loading-animation icon`
        span.innerHTML = "progress_activity"

        this.appendChild(span)

        const img = document.createElement("img")
        img.style.display = "none"
        if (this.imgClass) img.className = this.imgClass
        if (this.src) img.src = this.src
        if (this.ImgAlt) img.alt = this.ImgAlt
        if (this.onClick) img.onclick = this.onClick
        img.onload = (ev) => {
            this.loadingImg = false
            img.style.display = ""

            img.style.animation = "fadeIn 0.3s forwards"

            span.remove()
            if (this.onLoad) this.onLoad(ev)
        }
        img.onerror = (ev) => {
            this.loadingImg = false
            this.errorImg = true
            span.classList.remove("loading-animation")
            span.innerHTML = "broken_image"

            img.remove()
            if (this.onError) this.onError(ev)
        }

        this.appendChild(span)
        this.appendChild(img)
    }

    disconnectedCallback() {
        this.innerHTML = ""
        this.remove()
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.debug(name, oldValue, newValue)
    }
}

customElements.define("sheep-img", SheepImage);