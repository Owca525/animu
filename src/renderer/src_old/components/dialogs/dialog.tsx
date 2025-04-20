import React from 'react'
import '../../css/dialogs/dialog.css'
import Button from '../ui/button'
import { dialogProps } from '@renderer/utils/interface'

const dialog: React.FC<dialogProps> = ({ header_text, text, buttons, type = "info", content = null }) => {
  return (
    <div className="dialog-background">
      {type == "info" ? (
        <div className="dialog-container">
          <div className="dialog-message">
            <div className="dialog-Header">{header_text}</div>
            <div className="dialog-text">{text}</div>
          </div>
          <div className="dialog-buttons-container">
            {buttons != undefined ? buttons.map((button) => (
              <Button value={button.title} className="dialog-button" onClick={button.onClick} />
            )) : ""}
          </div>
        </div>
      ) : ""}
      {type == "custom" ? (
        <div className="dialog-container">{content}</div>
      ) : ""}
    </div>
  )
}

export default dialog
