interface CheckKeybindProps {
    content: string
    keyBind: (keys: string) => void
}

const CheckKeybind: React.FC<CheckKeybindProps> = ({ content, keyBind }) => {
  return (
    <button>{content}</button>
  )
}

export default CheckKeybind
