import React, { useEffect, useState } from 'react'
import "./css/dropDown.css"

interface DropdownOption {
  label: string
  onClick?: (text: string) => void
}

interface DropdownProps {
  options: DropdownOption[] | undefined
  placeholder?: string
  placeholderChange?: () => string;
  buttonText?: string
  disableX?: boolean
  onClickX?: (text: string) => void
  dropClassName?: string
}

const Dropdown: React.FC<DropdownProps> = ({ options = [], placeholder = '', placeholderChange, buttonText = "", onClickX, disableX = false, dropClassName }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState<string>(buttonText)

  const toggleDropdown = () => setIsOpen(prev => !prev)

  const handleOptionClick = (option: DropdownOption) => {
    setIsOpen(false)
    if (option.onClick) option.onClick(option.label)
    setText(() => option.label)
    if (placeholderChange) console.log(placeholderChange())
    if (placeholderChange) setText(() => placeholderChange())
  }

  function resetText(event) {
    event.stopPropagation()
    if (onClickX) onClickX(text ? text : "")
    setText(() => "")
  }
  // {placeholder != "" ? text == "" ? placeholder : text : buttonText }

  useEffect(() => {
    setText(() => buttonText)
  }, [buttonText])

  return (
    <div className={`dropdown-container ${dropClassName}`}>
      <div className={`dropdown-button`} onClick={toggleDropdown}>
        <div className={`dropdown-button-text ${text == "" && "dropdown-button-shadow-text"} ${options.length <= 1 && "dropdown-button-shadow-text"}`}>{text != "" && text} {placeholder != "" && text == "" && placeholder}</div>
        {text == "" && !disableX && <div className='material-symbols-outlined dropdown-button-icon'>{isOpen ? "keyboard_arrow_left" : "keyboard_arrow_down"}</div>}
        {text != "" && !disableX && <div className='material-symbols-outlined dropdown-button-icon' onClick={resetText}>close</div>}
      </div>
      {isOpen && options.length > 1 && (
        <ul className="dropdown-menu" onMouseLeave={() => setIsOpen(false)}>
          {options.map((option) => (
            <li
              key={option.label}
              className="dropdown-item"
              onClick={() => handleOptionClick(option)}
              title={option.label}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Dropdown
