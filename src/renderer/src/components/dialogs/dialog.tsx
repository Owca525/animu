import React from 'react'
import '../../css/dialogs/dialog.css'
import Button from '../ui/button'
import { dialogProps } from '@renderer/utils/interface'

const dialog: React.FC<dialogProps> = ({ header_text, text, buttons }) => {
  return (
    <div className="dialog-background">
      <div className="dialog-container">
        <div className="dialog-message">
          <div className="dialog-Header">{header_text}</div>
          <div className="dialog-text">{text}</div>
        </div>
        <div className="dialog-buttons-container">
          {buttons.map((button) => (
            <Button value={button.title} className="dialog-button" onClick={button.onClick} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default dialog
