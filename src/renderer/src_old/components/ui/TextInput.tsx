import { FC, useState } from 'react'
import "../../css/ui/input.css"

interface inputprops extends React.HtmlHTMLAttributes<HTMLInputElement> {
  placeholder?: string
  getInputText: (value: string) => void
}

const input: FC<inputprops> = ({ placeholder, onKeyDown, getInputText }) => {
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (debounceTimeout) clearTimeout(debounceTimeout);

    const newTimeout = setTimeout(() => {
      getInputText(event.target.value)
    }, 300);
    
    setDebounceTimeout(newTimeout);
  };

  return (
    <input
      placeholder={placeholder}
      type="input"
      onKeyDown={onKeyDown}
      onChange={handleChange}
      className='input'
    />
  )
}

export default input

