import Input from '../ui/input'
import '../../css/elements/headers.css'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface TextInputProps {
  onInputChange?: (event: React.KeyboardEvent<HTMLInputElement>) => void
}

const header: React.FC<TextInputProps> = ({ onInputChange }) => {
  const { t } = useTranslation()

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (onInputChange) {
      onInputChange(event)
    }
  }

  return (
    <div className="header">
      <Input placeholder={t('header.search')} onKeyDown={handleKeyDown} />
    </div>
  )
}

export default header
