import { createSignal, Show } from "solid-js";
import "./css/imageViewer.css"
import Button from "./buttons";
import { request, SaveToClipboard } from "@renderer/utils/functions";
import { toast } from "@renderer/utils/context/ToastNotification";
import { t } from "i18next";

export default function ImageViewer(props: { files: string[], disable: () => void }) {
    const defaultValue = 1
    const [scale, setScale] = createSignal(defaultValue);
    const [pos, setPos] = createSignal({ x: 0, y: 0 });
    const [dragging, setDragging] = createSignal(false);
    const [start, setStart] = createSignal({ x: 0, y: 0 });
    const [file, setFile] = createSignal(props.files.length == 0 ? "" : props.files[0]);
    const [currentFile, setCurrentFile] = createSignal(0);

    let container: HTMLDivElement | undefined;
    let img: HTMLImageElement | undefined;

    async function SaveCoverToClipboard() {
        if (await SaveToClipboard("image", file())) {
            toast(t("information.notification.coverdone"), { type: "success" })
        } else {
            toast(t("information.notification.coverfailed"), { type: "error" })
        }
    }

    async function saveAsFile() {
        try {
            let resp = await request(file())
            if (!resp.success) return toast("Failed Fetch Image", {type: "error"})
            const pathname = new URL(file()).pathname;
            const filename = pathname.split("/").pop();
            if (!filename) return toast("Failed Save Image", {type: "error"})
            window.api.os.saveDialog(filename, resp.buffer, "Saving Image", "Test", [])
            return
        } catch (error) {
            console.error(error)
            toast("Failed Save Image", {type: "error"})
            return
        }
    }

    function changeImage(num: number) {
        if (props.files[num]) {
            setFile(props.files[num])
            setCurrentFile(num)
        }
    }

    function centerImage() {
        if (!container || !img) return;
        const cx = (container.clientWidth - img.clientWidth * scale()) / 2;
        const cy = (container.clientHeight - img.clientHeight * scale()) / 2;
        setPos({ x: cx, y: cy });
    };

    function changeZoom(num: number) {
        setScale(s => Math.min(5, Math.max(0.1, s + num)));
    }

    function onWheel(e: WheelEvent) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        changeZoom(delta)
    };

    function onMouseDown(e: MouseEvent) {
        setDragging(true);
        setStart({ x: e.clientX - pos().x, y: e.clientY - pos().y });
    };

    function onMouseMove(e: MouseEvent) {
        if (!dragging()) return;
        setPos({ x: e.clientX - start().x, y: e.clientY - start().y });
    };

    function onDoubleClick() {
        setScale(defaultValue);
        centerImage()
    };

    return (
        <main class="imageViewer-main-container">
            <div
                style={{
                    cursor: dragging() ? "grabbing" : "grab",
                }}
                class="imageViewer-control-space"
                onWheel={onWheel}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={() => setDragging(false)}
                onMouseLeave={() => setDragging(false)}
                onDblClick={onDoubleClick}
                ref={container}
            >
                <img
                    src={file()}
                    ref={img}
                    onload={centerImage}
                    style={{
                        transform: `translate(${pos().x}px, ${pos().y}px) scale(${scale()})`,
                    }}
                    class="imageViewer-image"
                />
            </div>
            <div class="imageViewer-navigation-bar">
                <Button icon="close" ButtonClass="imageViewer-exit-button" onClick={props.disable} />
                <div class="imageViewer-bar">
                    <Button icon="zoom_in" ButtonClass="imageViewer-button" onClick={() => changeZoom(0.10)} />
                    <Button icon="zoom_out" ButtonClass="imageViewer-button" onClick={() => changeZoom(-0.10)} />
                    <Button icon="save" ButtonClass="imageViewer-button" onClick={saveAsFile} />
                    <Button icon="file_copy" ButtonClass="imageViewer-button" onClick={SaveCoverToClipboard} />
                </div>
            </div>
            <div class="imageViewer-bottom-informations">
                Zoom: {scale().toFixed(2)}x
            </div>
            <Show when={props.files.length > 1}>
                <Button icon="arrow_back" ButtonClass="imageViewer-left-button" onClick={() => changeImage(currentFile() - 1)} />
                <Button icon="arrow_back" ButtonClass="imageViewer-right-button" onClick={() => changeImage(currentFile() + 1)} />
            </Show>
        </main>
    );
}
