function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, options: { [key: string]: any } = {}): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    Object.assign(element, options)
    return element;
}

class DebugSheep extends HTMLElement {
    defaultSize = { w: 300, h: 200 }
    titleWindow = "Window"

    positionResize = { x: 0, y: 0 };
    positionDrag = { x: 0, y: 0 }
    tmpSize = { w: 0, h: 0 };
    offset = { x: 0, y: 0 }

    resizing = false;
    dragging = false;

    constructor() {
        super();

        this.titleWindow = this.getAttribute("titlewindow") ?? "Window"
    }

    onMouseDownResize = (e: MouseEvent) => {
        this.resizing = true;

        this.positionResize = { x: e.clientX, y: e.clientY };
        this.tmpSize = { ...this.defaultSize };

        window.addEventListener("mousemove", this.onMouseMove);
        window.addEventListener("mouseup", this.onMouseUp);
    };

    onMouseDown = (e: MouseEvent) => {
        this.dragging = true

        this.offset = {
            x: e.clientX - this.positionDrag.x,
            y: e.clientY - this.positionDrag.y,
        };

        window.addEventListener("mousemove", this.onDragWindow);
        window.addEventListener("mouseup", this.onMouseUpDragg);
    };

    onDragWindow = (e: MouseEvent) => {
        if (!this.dragging) return;

        this.positionDrag = {
            x: e.clientX - this.offset.x,
            y: e.clientY - this.offset.y,
        };

        this.style.transform = `translate(${this.positionDrag.x}px, ${this.positionDrag.y}px)`
    };

    onMouseMove = (e: MouseEvent) => {
        if (!this.resizing) return;

        const dx = e.clientX - this.positionResize.x;
        const dy = e.clientY - this.positionResize.y;

        this.defaultSize = {
            w: Math.max(150, this.tmpSize.w + dx),
            h: Math.max(100, this.tmpSize.h + dy),
        };

        this.style.width = `${this.defaultSize.w}px`
        this.style.height = `${this.defaultSize.h}px`
    };

    onMouseUp = () => {
        this.resizing = false;
        window.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("mouseup", this.onMouseUp);
    };

    onMouseUpDragg = () => {
        this.dragging = false;
        window.removeEventListener("mousemove", this.onDragWindow);
        window.removeEventListener("mouseup", this.onMouseUpDragg);
    };

    connectedCallback() {
        this.className = "sheep-debug-window"

        this.style.width = `${this.defaultSize.w}px`
        this.style.height = `${this.defaultSize.h}px`

        const titlebar = createElement("div", {
            className: "sheep-debug-titlebar",
            innerHTML: this.titleWindow,
            onmousedown: this.onMouseDown
        })

        const content = createElement("div", {
            className: "sheep-debug-content",
        })

        const resizer = createElement("div", {
            className: "sheep-debug-resizer",
            onmousedown: this.onMouseDownResize
        })

        this.appendChild(titlebar)
        this.appendChild(resizer)
        this.appendChild(content)
    }

    disconnectedCallback() {
        window.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("mouseup", this.onMouseUp);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.debug(name, oldValue, newValue)
    }
}

customElements.define("debug-window", DebugSheep);

const css = `
.sheep-debug-window {
    position: absolute;
    top: 100px;
    left: 100px;

    background: #181818;
    border: 1px solid #2D2D2D;

    color: white;
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    z-index: 99999;
}
.sheep-debug-content {
    display: flex;
    flex-direction: column;
    padding: 4px;
}

.sheep-debug-titlebar {
    background: #2D2D2D;
    padding: 8px 12px;
    cursor: move;
    user-select: none;
    font-weight: bold;
}

.sheep-debug-span {
    padding: 8px 12px;
}
.sheep-debug-resizer {
    position: absolute;
    right: 0;
    bottom: 0;

    width: 16px;
    height: 16px;

    cursor: nwse-resize;
}

.sheep-debug-resizer::after {
    content: "";
    position: absolute;
    right: 3px;
    bottom: 3px;

    width: 8px;
    height: 8px;

    border-right: 2px solid #434343;
    border-bottom: 2px solid #434343;
}

.sheep-debug-button {
    cursor: pointer;
    user-select: none;
    text-align: center;
    border: none;
    background-color: #303030;
    font-size: 0.9em;
    width: max-content;
    padding: 4px 16px;
}
.sheep-debug-button:hover {
    background-color: #434343;
}
`;

const style = createElement('style', {
    textContent: css
});
document.head.appendChild(style);

interface windowManagerConfig {
    title?: string
}

class SheepWindowManager {
    ref: HTMLElement | undefined = undefined
    ContentRef: HTMLDivElement | undefined = undefined

    constructor(config: windowManagerConfig = {}) {
        const element = createElement("debug-window" as any, {
            titlewindow: config["title"],
        })
        document.body.appendChild(element)
        this.ref = element

        this.ContentRef = element.querySelector(".sheep-debug-content")
    }

    Text(str: string) {
        if (!this.ContentRef) return

        const textElement = createElement("span", {
            innerHTML: str,
            className: "sheep-debug-span"
        })

        this.ContentRef.appendChild(textElement)
    }

    Button(str: string, onClick?: (ev: PointerEvent) => void) {
        if (!this.ContentRef) return

        const buttonElement = createElement("button", {
            innerHTML: str,
            className: "sheep-debug-button",
            onclick: onClick
        })

        this.ContentRef.appendChild(buttonElement)
    }

    Destroy() {
        if (this.ref) this.ref?.remove()
    }
}

class DebuggerSheep {
    window_list: SheepWindowManager[] = []

    createWindow(options?: windowManagerConfig) {
        const new_window = new SheepWindowManager(options)
        this.window_list.push(new_window)
        return new_window
    }

    DestroyAllWindow() {
        this.window_list.forEach((w) => {
            w.Destroy()
        })
    }
}

(window as any).DebuggerSheep = new DebuggerSheep();