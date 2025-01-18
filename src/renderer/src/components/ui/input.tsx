import { FC } from 'react'
import "../../css/ui/input.css"

interface inputprops extends React.HtmlHTMLAttributes<HTMLInputElement> {
  placeholder?: string
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
}

const input: FC<inputprops> = ({ placeholder, onKeyDown }) => {
  return (
    <input
      placeholder={placeholder}
      type="input"
      onKeyDown={onKeyDown}
      className='input'
    />
  )
}

export default input
