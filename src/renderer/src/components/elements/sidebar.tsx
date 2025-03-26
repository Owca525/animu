import Button from '../ui/button'
import { SidebarProps } from '../../utils/interface'
import '../../css/elements/sidebar.css'
import { useContext, useEffect, useRef, useState } from 'react'
import icon from "../../../../../resources/icon.png"
import { configContext } from '@renderer/utils/context/small'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@renderer/utils/reducers'
import { setHover } from '@renderer/utils/reducers/sidebar'

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
  const dispatch = useDispatch();
  const sidebarData = useSelector((state: RootState) => state.sidebar.hover);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const config = useContext(configContext)

  const getAndSetVersion = async (): Promise<void> => setversion(await window.backend.version())

  const handleClickOutside = (event: MouseEvent) => { // "button-sidebar-show"
    let data = event.target as HTMLElement
    if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && data.classList.contains("button-sidebar-show") == false) {
      dispatch(setHover(false))
    }
  };

  useEffect(() => { 
    getAndSetVersion()
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
   }, [])

  function changeClass(): string {
    if (onlyMax) return `sidebar-max ${className}`
    if (showVersion) return `sidebar-mini ${className}`
    if (config.General.HideSidebar) {
      if (sidebarData) return "sidebar-max sidebar-show"
      return "sidebar-hidden"
    }

    if (isMaxSidebar) return `sidebar-max ${className}`
    else return `sidebar-mini ${className}`
  }

  function changeClassButton(): "icon-text" | "icon" {
    if (onlyMax) return 'icon-text'
    if (showVersion) return "icon"
    if (config.General.HideSidebar) {
      if (sidebarData) return "icon-text"
      return "icon"
    }

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
    <>
      {config.General.HideSidebar == false && onlyMax == false && showVersion == false && <div className="fake-sidebar"></div>}
      <div className={changeClass()} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} ref={sidebarRef}>
        <div className="top-sidebar">
          {showVersion && onlyMax && <div className="sidebar-version">Animu v{version}</div>}
          {showVersion && !onlyMax && <img src={icon} className='AnimuIcon' title='Animu Icon' />}
          <div className="border"></div>
          {top.length > 0
            ? top.map((button) => (
              <Button
                value={`<div class="material-symbols-outlined text-button">${button.icon}</div>${button.title}`}
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
                value={`<div class="material-symbols-outlined text-button">${button.icon}</div>${button.title}`}
                className={button.class}
                title={button.title}
                type={changeClassButton()}
                onClick={button.onClick}
              />
            ))
            : ''}
        </div>
      </div>
    </>
  )
}

export default Sidebar
