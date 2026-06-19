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
        this.defaultSize = this.getAttribute("defaultsize") as any ?? { w: 300, h: 200 }
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

        this.append(titlebar, resizer, content)
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
    overflow: hidden;
    box-sizing: border-box;
}
.sheep-debug-content {
    display: flex;
    flex-direction: column;
    padding: 4px;
    overflow: auto;
    height: 100%;
    box-sizing: border-box;
    padding-bottom: 40px;
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
.sheep-debug-details {
    margin-left: 10px;
    padding-left: 10px;
}

.sheep-debug-summary {
    list-style: none;
    cursor: pointer;
    user-select: none;

    padding: 3px 6px;

    color: #EBEBEB;
    font-family: Consolas, monospace;
    font-size: 0.8em;

    transition: background 0.15s;
}

.sheep-debug-summary:hover {
    background: #434343;
}

.sheep-debug-summary::-webkit-details-marker {
    display: none;
}

.sheep-debug-summary::before {
    content: "▶";
    display: inline-block;
    width: 14px;
    margin-right: 4px;

    color: #A0A0A0;

    transition: transform 0.15s;
}

.sheep-debug-details[open] > .sheep-debug-summary::before {
    transform: rotate(90deg);
}

.sheep-debug-p {
    margin: 2px 0 2px 10px;
    padding: 2px 6px;

    color: #A0A0A0;

    font-family: Consolas, monospace;
    font-size: 0.8em;
    line-height: 1.4;
}
.sheep-debug-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    font-family: Consolas, monospace;
    width: max-content;
}

.sheep-debug-checkbox .sheep-debug-input-checkbox {
    appearance: none;
    width: 20px;
    height: 20px;
    border: 1px solid #303030;
    background-color: #2D2D2D;
    display: grid;
    place-content: center;
    transition: 0.15s;
}

.sheep-debug-checkbox .sheep-debug-input-checkbox:hover {
    border-color: #434343;
}

.sheep-debug-checkbox .sheep-debug-input-checkbox:checked {
    background-color: #313332;
    border-color: #549E72;
}

.sheep-debug-checkbox .sheep-debug-input-checkbox:checked::before {
    content: "✓";
    color: white;
    font-size: 12px;
    font-weight: bold;
}
.sheep-debug-input {
    appearance: none;
    outline: none;
    padding: 4px;
    width: auto;
    background-color: #1F1F1F;
    border: 2px solid #2D2D2D;
}
.sheep-debug-input:hover {
    background-color: #30303;
}
.sheep-debug-slider {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px;

    font-family: Consolas, monospace;
    font-size: 13px;
}
.sheep-debug-slider-input {
    appearance: none;

    width: 180px;
    height: 6px;

    background-color: #303030;
    border-radius: 5px;

    cursor: pointer;
}
.sheep-debug-slider-input::-webkit-slider-thumb {
    appearance: none;

    width: 14px;
    height: 14px;
    background-color: #549E72;
    border-radius: 50%;
    cursor: pointer;

    transition: 0.15s;
}
.sheep-debug-slider-input::-moz-range-thumb {
    width: 14px;
    height: 14px;

    background-color: #549E72;

    border: none;
    border-radius: 50%;

    cursor: pointer;
}
.sheep-debug-horizontal-content {
    display: flex;
    flex-column: row;
    gap: 4px;
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

    Text(label: string, horizontalCotext?: HTMLDivElement) {
        if (!this.ContentRef) return

        const textElement = createElement("span", {
            innerHTML: label,
            className: "sheep-debug-span"
        })
        
        if (horizontalCotext) horizontalCotext.append(textElement)
        else this.ContentRef.appendChild(textElement)
    }

    Button(label: string, onClick?: (ev: PointerEvent) => void, horizontalCotext?: HTMLDivElement) {
        if (!this.ContentRef) return

        const buttonElement = createElement("button", {
            innerHTML: label,
            className: "sheep-debug-button",
            onclick: onClick
        })

        if (horizontalCotext) horizontalCotext.append(buttonElement)
        else this.ContentRef.appendChild(buttonElement)
    }

    ObjectTree(object: { [key: string]: any }, horizontalCotext?: HTMLDivElement) {
        if (!this.ContentRef) return

        const divElement = this.ContentRef

        function createEntry(key: string, value: any, parent: HTMLElement) {
            if (value !== null && typeof value === "object") {
                const isMap = value instanceof Map
                const isArray = Array.isArray(value)

                let title = key

                if (isMap) title += " (Map)"
                if (isArray) title += `: ${value.length}`

                const detailsElement = createElement("details", {
                    className: "sheep-debug-details",
                })

                const summaryElement = createElement("summary", {
                    className: "sheep-debug-summary",
                    innerHTML: title,
                })

                detailsElement.appendChild(summaryElement)
                parent.appendChild(detailsElement)

                if (isMap) {
                    value.forEach((v: any, k: any) => {
                        createEntry(String(k), v, detailsElement)
                    })
                } else {
                    Object.entries(value).forEach(([k, v]) => {
                        createEntry(k, v, detailsElement)
                    })
                }

                return
            }

            const textElement = createElement("p", {
                className: "sheep-debug-p"
            })

            if (typeof value === "function") {
                textElement.innerHTML = `${key}: "${value}"`
            } else {
                try {
                    textElement.innerHTML = `${key}: ${JSON.stringify(value)}`
                } catch {
                    textElement.innerHTML = `${key}: [unsupported]`
                }
            }

            parent.appendChild(textElement)
        }

        function setEntriesObject(object: Record<string, any>) {
            Object.entries(object).forEach(([key, value]) => {
                createEntry(key, value, divElement)
            })
        }

        setEntriesObject(object)

        if (horizontalCotext) horizontalCotext.append(divElement)
        else this.ContentRef.appendChild(divElement)
    }

    CheckBox(label: string, onCheck?: (val: boolean) => void, horizontalCotext?: HTMLDivElement) {
        if (!this.ContentRef) return

        const labelElement = createElement("label", {
            className: "sheep-debug-checkbox"
        })

        const checkbox = createElement("input", {
            type: "checkbox",
            className: "sheep-debug-input-checkbox"
        })

        const text = createElement("span", {
            innerHTML: label
        })

        labelElement.append(checkbox, text)

        if (horizontalCotext) horizontalCotext.append(labelElement)
        else this.ContentRef.appendChild(labelElement)

        if (onCheck) {
            checkbox.onchange = () => {
                onCheck(checkbox.checked)
            }
        }
    }

    Input(onKeyPress?: (str: string) => void, type: string = "input", horizontalCotext?: HTMLDivElement) {
        if (!this.ContentRef) return

        const inputElement = createElement("input", {
            type: type,
            className: "sheep-debug-input"
        })

        if (onKeyPress) {
            inputElement.onkeydown = () => {
                onKeyPress(inputElement.value)
            }
        }

        if (horizontalCotext) horizontalCotext.append(inputElement)
        else this.ContentRef.appendChild(inputElement)
    }

    CreateHorizontalMenu() {
        const divHorizontalElement = createElement("div", {
            className: "sheep-debug-horizontal-content"
        })

        if (this.ContentRef) this.ContentRef.append(divHorizontalElement)

        return divHorizontalElement
    }

    Slider(value: number, min: number = 0, max: number = 100, horizontalCotext?: HTMLDivElement) {
        if (!this.ContentRef) return

        const sliderContainerElement = createElement("div", {
            className: "sheep-debug-slider"
        })

        const sliderElement = createElement("input", {
            type: "range",
            min: min,
            max: max,
            value: value,
            className: "sheep-debug-slider-input"
        })

        sliderContainerElement.append(sliderElement)

        if (horizontalCotext) horizontalCotext.append(sliderContainerElement)
        else this.ContentRef.appendChild(sliderContainerElement)
    }

    Destroy() {
        if (this.ref) this.ref?.remove()
    }
}

class DebuggerSheep {
    private window_list: SheepWindowManager[] = []

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
export default DebuggerSheep