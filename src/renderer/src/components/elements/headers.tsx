import Input from '../ui/TextInput'
import '../../css/elements/headers.css'
import React from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../ui/button'

interface HeaderProps {
  onInputChange?: (value: string) => void,
  className?: string,
  onToggleHover?: () => void
}

const header: React.FC<HeaderProps> = ({ onInputChange, className, onToggleHover }) => {
  const { t } = useTranslation()

  const handleKeyDown = (value: string) => {
    if (onInputChange) onInputChange(value)
  }

  function handleInput(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key == "Enter") handleKeyDown(event.currentTarget.value)
  }

  return (
    <div className={`header ${className}`}>
      <Button className='material-symbols-outlined button-sidebar-show' value='menu' onClick={onToggleHover} />
      <Input placeholder={t('header.search')} getInputText={handleKeyDown} onKeyDown={handleInput} />
    </div>
  )
}

export default header
