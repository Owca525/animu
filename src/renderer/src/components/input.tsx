import { useRef, useState } from "react"
import "./css/input.css"

interface InputProps {
    type?: "text" | "password" | "number"
    InputClass?: string
    placeholder?: string
    onKeyDown?: (text: string) => void
    defaultValue?: string
}

const Input: React.FC<InputProps> = ({ type = "text", InputClass, placeholder, onKeyDown, defaultValue }) => {
    const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null)
    const [cacheText, setCacheText] = useState<string>("")

    function handleData(event) {
        if (!onKeyDown) return
        if (cacheText == event.currentTarget.value) return
        if (debounceTimeout) clearTimeout(debounceTimeout);
        if (event.code == "Enter") {
            setCacheText(event.currentTarget.value)
            onKeyDown(event.currentTarget.value)
            return
        }

        const newTimeout = setTimeout(() => {
            if (inputRef.current) {
                setCacheText(inputRef.current.value)
                onKeyDown(inputRef.current.value)
            }
        }, 300);

        setDebounceTimeout(newTimeout);
    }

    return (
        <input tabIndex={-1} defaultValue={defaultValue} type={type} ref={inputRef} className={"input " + InputClass} placeholder={placeholder} onKeyDown={handleData} />
    )
}

export default Input
