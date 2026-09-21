import { onMount } from "solid-js";
import Button from "./buttons";
import { BufferTobase64, createElement } from "@renderer/utils/functions";

export interface FileFormat {
    type: string,
    size: number,
    name: string,
    content_base64: string,
    content: ArrayBuffer
}

export default function FilePicker(content: { onFileSelect?: (file: FileFormat) => void, acceptFormat?: string }) {

    const handleFileChange = async (event: Event) => {
        if (!content["onFileSelect"]) return

        const input = event.currentTarget as HTMLInputElement;
        const selectedFile = input.files?.[0] ?? null;

        if (!selectedFile) return console.error("FilePicker/handleFileChange Failed Load File")

        const buffer = await selectedFile.arrayBuffer()
        
        content.onFileSelect({
            type: selectedFile.type,
            size: selectedFile.size,
            name: selectedFile.name,
            content_base64: `data:${selectedFile["type"]};base64,${BufferTobase64(buffer)}`,
            content: buffer
        })
    };

    let inputRef: HTMLInputElement = createElement("input", { type: "file", accept: content["acceptFormat"] })

    onMount(() => {
        inputRef.onchange = handleFileChange
    })

    const openFilePicker = () => {
        if (inputRef) inputRef.click();
    };

    return (
        <Button content="Select File" onClick={openFilePicker}/>
    );
}