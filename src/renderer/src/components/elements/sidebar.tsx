import Button from '../ui/button'
import { SidebarProps } from '../../utils/interface'
import '../../css/elements/sidebar.css'
import { useEffect, useState } from 'react'
import icon from "../../../../../resources/icon.png"

const Sidebar: React.FC<SidebarProps> = ({
  class: className,
  top,
  bottom,
  onlyMax = false,
  showVersion = false,
  sidebarHover = true
}) => {
  const [isMaxSidebar, setIsMaxSidebar] = useState(false)
  const [version, setversion] = useState<any>()

  const getAndSetVersion = async (): Promise<void> => setversion(await window.backend.version())

  useEffect(() => { getAndSetVersion() }, [])

  function changeClass(): string {
    if (onlyMax) return `sidebar-max ${className}`
    if (isMaxSidebar) return `sidebar-max ${className}`
    else return `sidebar-mini ${className}`
  }

  function changeClassButton(): "icon-text" | "icon" {
    if (onlyMax) return 'icon-text'
    if (isMaxSidebar) return 'icon-text'
    else return 'icon'
  }

  function handleMouseEnter(): void {
    if (!isMaxSidebar && sidebarHover) setIsMaxSidebar(true)
  }

  function handleMouseLeave(): void {
    if (isMaxSidebar && sidebarHover) setIsMaxSidebar(false)
  }

  return (
    <div className={changeClass()} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="top-sidebar">
        {showVersion && onlyMax && <div className="sidebar-version">Animu v{version}</div>}
        {showVersion && !onlyMax && <img src={icon} className='AnimuIcon' title='Animu Icon' />}
        <div className="border"></div>
        {top.length > 0
          ? top.map((button) => (
              <Button
                value={button.value}
                className={button.class}
                title={button.title}
                type={changeClassButton()}
                onClick={button.onClick}
              />
            ))
          : ''}
      </div>
      <div className="bottom-sidebar">
        <div className="border"></div>
        {bottom.length > 0
          ? bottom.map((button) => (
              <Button
                value={button.value}
                className={button.class}
                title={button.title}
                type={changeClassButton()}
                onClick={button.onClick}
              />
            ))
          : ''}
      </div>
    </div>
  )
}

export default Sidebar
