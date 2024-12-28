import React, { useEffect, useState } from 'react'
import '../../css/dialogs/keybind.css'

interface keybindsProps {
  title: string
  value: string
  changeKey: (key: string) => void
}

const keybind: React.FC<keybindsProps> = ({ title, value, changeKey }) => {
  const [isListening, setIsListening] = useState<boolean>(false)
  const [keyPressed, setKeyPressed] = useState<string | null>(null)

  const handleKeyDown = (event: KeyboardEvent) => {
    if (isListening) {
      if (event.key == ' ') {
        setKeyPressed('Space')
      } else {
        setKeyPressed(event.key)
      }
      if (event.key.length == 1) {
        setKeyPressed(event.key.toUpperCase())
      }
      changeKey(event.key)
      setIsListening(false)
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isListening])

  const handleClick = () => {
    setIsListening(true)
    setKeyPressed(null)
  }
  return (
    <div className="keybind-container">
      {title}{' '}
      <div
        className={isListening ? 'keybind-space keybind-active' : 'keybind-space'}
        onClick={handleClick}
      >
        {keyPressed ? keyPressed : value}
      </div>
    </div>
  )
}

export default keybind
