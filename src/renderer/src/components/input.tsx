import { useRef, useState } from "react"
import "./css/input.css"

interface InputProps {
    type?: "text" | "password" | "number"
    InputClass?: string
    placeholder?: string
    onKeyDown?: (text: string) => void
}

const Input: React.FC<InputProps> = ({ type = "text", InputClass, placeholder, onKeyDown }) => {
    const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null)

    function handleData(event) {
        if (!onKeyDown) return
        if (debounceTimeout) clearTimeout(debounceTimeout);
        if (event.code == "Enter") {
            onKeyDown(event.currentTarget.value)
            return
        }

        const newTimeout = setTimeout(() => {
            if (inputRef.current) onKeyDown(inputRef.current.value)
        }, 300);

        setDebounceTimeout(newTimeout);
    }

    return (
        <input type={type} ref={inputRef} className={"input " + InputClass} placeholder={placeholder} onKeyDown={handleData} />
    )
}

export default Input
