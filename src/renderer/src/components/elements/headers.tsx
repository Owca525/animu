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

  return (
    <div className={`header ${className}`}>
      <Button className='material-symbols-outlined' value='menu' onClick={onToggleHover} />
      <Input placeholder={t('header.search')} getInputText={handleKeyDown} />
    </div>
  )
}

export default header
