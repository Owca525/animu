import React, { useState } from 'react'
import '../../css/ui/dropdown.css'

interface DropdownOption {
  label: string
  value: string
  onClick?: () => void
}

interface DropdownProps {
  options: DropdownOption[] | undefined
  placeholder: string
  placeholderChange?: () => string;
}

const Dropdown: React.FC<DropdownProps> = ({ options, placeholder = '', placeholderChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState<string>(placeholder)

  const toggleDropdown = () => setIsOpen(prev => !prev)

  const handleOptionClick = (option: DropdownOption) => {
    setIsOpen(false)
    if (option.onClick) option.onClick()
    setText(() => option.label)
    if (placeholderChange) setText(() => placeholderChange())
  }

  return (
    <div className="dropdown-container">
      <div className="dropdown-button" onClick={toggleDropdown}>
        {text}
      </div>
      {isOpen && options && (
        <ul className="dropdown-menu" onMouseLeave={() => setIsOpen(false)}>
          {options.map((option) => (
            <li
              key={option.value}
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
