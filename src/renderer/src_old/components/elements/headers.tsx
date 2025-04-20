import Input from '../ui/TextInput'
import '../../css/elements/headers.css'
import React from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../ui/button'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@renderer/utils/store'
import { setHover } from '@renderer/utils/reducers/sidebar'

interface HeaderProps {
  onInputChange?: (value: string) => void,
  className?: string,
}

const header: React.FC<HeaderProps> = ({ onInputChange, className }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch();
  const sidebarHover = useSelector((state: RootState) => state.sidebar.hover);

  const handleKeyDown = (value: string) => {
    if (onInputChange) onInputChange(value)
  }

  function handleInput(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key == "Enter") handleKeyDown(event.currentTarget.value)
  }

  return (
    <div className={`header ${className}`}>
      <Button className='material-symbols-outlined button-sidebar-show' value='menu' onClick={() => dispatch(setHover(!sidebarHover))} />
      <Input placeholder={t('header.search')} getInputText={handleKeyDown} onKeyDown={handleInput} />
    </div>
  )
}

export default header
