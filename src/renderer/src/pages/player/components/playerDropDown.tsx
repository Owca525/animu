import React, { useEffect, useState } from 'react'
import "./css/playerdropdown.css"

interface playerDropDownOptions {
  label: string
  onClick?: (text: string) => void
}

interface playerDropDownProps {
    options: playerDropDownOptions[],
    defaultButtonText: string,
}

const PlayerDropDown: React.FC<playerDropDownProps> = ({ defaultButtonText, options }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [text, setText] = useState<string>(defaultButtonText)

  function handleClick(element: playerDropDownOptions) {
    setText(() => element.label)
    if (element.onClick) element.onClick(element.label) 
  }

  console.log(defaultButtonText, options)

  useEffect(() => {
    setText(defaultButtonText)
  }, [defaultButtonText, options])

  return (
    <div className='player-dropdown-container'>
        <button className={options.length <= 1 ? "player-dropdown-button-disable" : "player-dropdown-button"} onClick={() => setIsOpen((prev) => !prev)}>
            {text}
        </button>
        {isOpen && options.length > 1 &&
          <div className='player-dropdown-container-item'>
            {options.map((element) => (
              <div className='player-dropdown-item' onClick={() => handleClick(element)}>{element.label}</div>
            ))}
          </div>
        }
    </div>
  )
}

export default PlayerDropDown
