import Input from '../ui/TextInput'
import '../../css/elements/headers.css'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface TextInputProps {
  onInputChange?: (value: string) => void
}

const header: React.FC<TextInputProps> = ({ onInputChange }) => {
  const { t } = useTranslation()

  const handleKeyDown = (value: string) => {
    if (onInputChange) onInputChange(value)
  }

  return (
    <div className="header">
      <Input placeholder={t('header.search')} getInputText={handleKeyDown} />
    </div>
  )
}

export default header
