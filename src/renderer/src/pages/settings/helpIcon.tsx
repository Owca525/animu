import React, { useState } from 'react'
import '../../css/ui/helpicon.css'

interface HelpIconProps {
  description: string
}

const HelpIcon: React.FC<HelpIconProps> = ({ description }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="help-icon-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="material-symbols-outlined help-icon">help</div>
      {isHovered && <div className="help-icon-description">{description}</div>}
    </div>
  )
}

export default HelpIcon
