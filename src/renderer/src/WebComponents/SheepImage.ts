
function IsURLValid(value: string | undefined | null): boolean {
    if (!value) return false
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

class SheepImage extends HTMLElement {
    img_divClass: string | null = null
    img_class: string | null = null
    img_src: string | null = null
    img_onClick: ((ev: PointerEvent) => void) | null = null
    img_onLoad: ((ev: Event) => void) | null = null
    img_onError: ((ev: string | Event) => void) | null = null
    img_alt: string | null = null

    ImageRef: HTMLImageElement | null = null
    SpanRef: HTMLSpanElement | null = null

    loadingImg = true
    errorImg = false

    set src(v) {
        this.img_src = v
        this.render()
    }
    set class(_) {
        this.render()
    }
    set divClass(_) {
        this.render()
    }
    set onClick(v) {
        this.img_onClick = v
        this.render()
    }
    set onLoad(v) {
        this.img_onLoad = v
        this.render()
    }
    set alt(v) {
        this.img_alt = v
        this.render()
    }
    set onError(v) {
        this.img_onError = v
        this.render()
    }

    constructor() {
        super();
    }

    render() {
        let img_class = this.getAttribute("class")
        let img_divClass = this.getAttribute("divClass")

        if (img_class != img_divClass) {
            this.img_divClass = img_divClass
            this.img_class = img_class
        }

        if (!this.img_divClass) {
            this.style.width = "max-content"
            this.style.height = "max-content"
            this.style.display = "flex"
            this.style.justifyContent = "center"
            this.style.alignItems = "center"
        } else {
            this.className = this.img_divClass
        }

        if (this.img_class && this.ImageRef) this.ImageRef.className = this.img_class
        if (this.img_alt && this.ImageRef) this.ImageRef.alt = this.img_alt
        if (this.img_onClick && this.ImageRef) this.ImageRef.onclick = this.img_onClick

        if (!IsURLValid(this.img_src) && this.SpanRef) {
            this.SpanRef.classList.remove("loading-animation")
            this.SpanRef.innerHTML = "broken_image"
            return
        }

        if (this.ImageRef && this.ImageRef.src == this.img_src) return

        if (this.ImageRef && this.ImageRef.src != this.img_src) {
            this.loadingImg = true
            this.errorImg = false
        }

        if (this.loadingImg && !this.SpanRef) {
            this.SpanRef = document.createElement("span")
            this.SpanRef.className = `material-symbols-outlined loading-animation icon`
            this.SpanRef.innerHTML = "progress_activity"

            this.appendChild(this.SpanRef)
        }

        if (!this.ImageRef) {
            this.ImageRef = document.createElement("img")
            this.appendChild(this.ImageRef)
        }

        this.ImageRef.style.display = "none"
        if (this.img_src) this.ImageRef.src = this.img_src

        this.ImageRef.onload = (ev) => {
            this.loadingImg = false

            if (this.ImageRef) {
                this.ImageRef.style.display = ""
                this.ImageRef.style.animation = "fadeIn 0.3s forwards"
            }

            if (this.SpanRef) this.SpanRef.remove()
            if (this.img_onLoad) this.img_onLoad(ev)
        }
        this.ImageRef.onerror = (ev) => {
            this.loadingImg = false
            this.errorImg = true

            if (this.SpanRef) {
                this.SpanRef.classList.remove("loading-animation")
                this.SpanRef.innerHTML = "broken_image"
            }

            if (this.ImageRef) this.ImageRef.remove()
            if (this.img_onError) this.img_onError(ev)
        }
    }

    connectedCallback() {
        this.render()
    }

    // disconnectedCallback() {
    //     console.log("Has Been Removed", this)
    //     this.remove()
    // }
}

customElements.define("sheep-img", SheepImage);