import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

// Components
import ContextMenu from '../../components/elements/context-menu'
import Sidebar from '../../components/elements/sidebar'
import Checkbox from '../../components/ui/checkbox'
import Keybind from './keybind'
import Input from './SettingsInput'
import Dropdown from '../../components/ui/dropdown'
// import MainInput from "../../components/ui/input"
// import CustomSlider from '@renderer/components/ui/customSlider'

// utils
import { checkPictureFolder, readConfig, saveConfig } from '../../utils/config'
import { ListItem, notificationProps, SettingsConfig } from '../../utils/interface'

import '../../css/pages/settings.css'
import { toast } from 'react-toastify'
import Button from '@renderer/components/ui/button'
import useHotkeys from '@reecelucas/react-use-hotkeys'
import { closeDialog, showDialog } from '@renderer/utils/context/DialogContext'
import { calculateZoomLevel } from '@renderer/utils/utils'

const Settings = () => {
  const navigate = useNavigate()

  const { t, i18n } = useTranslation()

  const [settingPage, setsettingPage] = useState<string>('general')
  const [config, setConfig] = useState<{ old: SettingsConfig, new: SettingsConfig } | undefined>(undefined)
  const [isConfigChanges, setisConfigChanges] = useState<boolean>(false)
  const [isLoading, setisLoading] = useState<boolean>(true)
  const [hideSidebar, setHideSidebar] = useState<boolean>(false)
  const [newSidebarTop, setnewSidebarTop] = useState<ListItem[]>([
    {
      value:
        '<div class="material-symbols-outlined text-button">manufacturing</div>' +
        t('settings.sidebar.General'),
      class: 'icon-button ',
      title: t('settings.sidebar.General'),
      page: "general",
      onClick: async () => setsettingPage('general')
    },
    {
      value:
        '<div class="material-symbols-outlined text-button">movie</div>' +
        t('settings.sidebar.Player'),
      class: 'icon-button ',
      title: t('settings.sidebar.Player'),
      page: "player",
      onClick: async () => setsettingPage('player')
    },
    {
      value:
        '<div class="material-symbols-outlined text-button">history</div>' + t('sidebar.History'),
      class: 'icon-button ',
      title: t('sidebar.History'),
      page: "history",
      onClick: async () => setsettingPage('history')
    },
  ]
  )

  const [theme, setTheme] = useState<{ label: string; value: string; onClick: () => void; }[]>()

  let sidebarSettingsBottomData = [
    {
      value:
        '<div class="material-symbols-outlined text-button">folder</div>' +
        t('settings.sidebar.ConfigFolder'),
      class: 'icon-button',
      title: t('settings.sidebar.ConfigFolder'),
      onClick: async () => await window.api.open(await window.api.os.getPath("userData"))
    },
    {
      value:
        '<div class="material-symbols-outlined text-button">home</div>' +
        t('settings.sidebar.Home'),
      class: 'icon-button',
      title: t('settings.sidebar.Home'),
      onClick: async () => { navigate('/'); window.location.reload() }
    }
  ]

  const language = [
    { label: t('lang.english'), value: 'en', onClick: () => changeLang('en') },
    { label: t('lang.polish'), value: 'pl', onClick: () => changeLang('pl') },
    { label: t('lang.hungary'), value: 'hu', onClick: () => changeLang('hu') }
  ]

  const playerType = [
    { label: "metadata", value: 'metadata', onclick: () => handleChange('Player.general.playerLoadType', "metadata") },
    { label: "auto", value: 'auto', onclick: () => handleChange('Player.general.playerLoadType', "auto") }
  ]

  const menuItems = [{ label: t('contextMenu.reload'), onClick: () => location.reload() }]

  function checkCurrentPage(page: ListItem[]): ListItem[] {
    return page.map((element) => {
      if (element.page == settingPage) return { ...element, class: element.class + " active" }
      return element
    })
  }

  useEffect(() => {
    readConfig().then((tmpConfig) => {
      setConfig({ old: structuredClone(tmpConfig), new: structuredClone(tmpConfig) })
    })
    checkThemes()

    window.api.rpc.setActivity(undefined, t("status.settings"))
    handleResize()
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, [])

  function handleResize() {
    if (window.innerWidth <= 870) setHideSidebar(() => false)
    else setHideSidebar(() => true)
  }

  useHotkeys("Escape", () => { closeDialog(); navigate("/"); window.location.reload() });

  async function saveConf() {
    if (!config) return
    if (await saveConfig(config.new)) {
      toast.info(t("toast.config"), notificationProps);
      setConfig((prev) => {
        if (!prev) return undefined
        return { old: structuredClone(prev.new), new: structuredClone(prev.new) }
      })
      window.BrowserWindow.setZoom(calculateZoomLevel(parseFloat(config.new.General.Window.Zoom.toString())))
    }
    else toast.error("Failed Save config", notificationProps);
  }

  useEffect(() => {
    if (!config) return
    if (JSON.stringify(config.old) != JSON.stringify(config.new)) setisConfigChanges(() => true)
    setisLoading(false)
    if (config.old.Developer.DeveloperMode) setDeveloper()
  }, [config])

  async function checkThemes() {
    const themes = await window.api.getlistThemes()
    setTheme(themes.map((elememnt) => {
      let name = elememnt.filename.replace(".css", "")
      return { label: name, value: name, onClick: () => changeTheme(name) }
    }))
  }

  const getKeybind = (key: string) => {
    if (key == ' ') return 'Space'
    if (key.length == 1) return key.toUpperCase()
    return key
  }

  const handleChange = (path: string, value: string | number | boolean) => {
    setConfig((prevConfig) => {
      if (!prevConfig) return prevConfig

      const keys = path.split('.')
      const newConfig = prevConfig.new

      let current: any = newConfig
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]

        if (!current[key]) current[key] = {}
        current = current[key]
      }

      current[keys[keys.length - 1]] = value
      return { old: prevConfig.old, new: newConfig }
    })
  }

  const setDeveloper = () => {
    const check: Array<boolean | undefined> = newSidebarTop.map((element) => {
      if (element.page == "developer") return true
      return undefined
    })

    if (check.filter(item => item !== undefined)[0]) return

    setnewSidebarTop((prev) => [...prev,
    {
      value:
        '<div class="material-symbols-outlined text-button">code</div>' +
        "Developer",
      class: 'icon-button ',
      title: "Developer",
      page: "developer",
      onClick: async () => setsettingPage('developer')
    }])
    if (config && config.new.Developer.DeveloperMode == false) handleChange('Developer.DeveloperMode', true)
  }

  useHotkeys("Control+Shift+d", () => {
    showDialog({
      header_text: "Animu", text: "Turn on Developer Mode?", buttons: [
        { title: "No", onClick: () => closeDialog() },
        { title: "Yes", onClick: () => { closeDialog(); setDeveloper() } },
      ]
    })
  });

  const changeTheme = async (theme: string) => {
    handleChange('General.theme', theme)
    const themes = await window.api.getlistThemes()
    themes.forEach((elememnt) => {
      if (elememnt.filename.replace(".css", "") == theme) {
        let link = document.getElementById("theme-stylesheet") as HTMLLinkElement
        if (link) link.href = elememnt.path
      }
    })
  }

  const checkLang = (lang: string) => {
    for (let i = 0; i < language.length; i++) {
      const element = language[i]
      if (element.value == lang) return element.label
    }
    return ''
  }

  async function changePathScreenshot(path: string) {
    if (path) {
      handleChange("Player.screenShot.path", path)
      return
    }
    handleChange("Player.screenShot.path", await checkPictureFolder())
  }

  const changeLang = (lang: string) => {
    i18n.changeLanguage(lang)
    handleChange('General.language', lang)
  }

  function convertUpdateOption(text: string): string { 
    switch (text){
      case "start":
        return "On Start"
      case "day":
        return "Every Day"
      case "week":
        return "Week"
    }
    return text
  }

  return isLoading ? (
    <div className="settings-container">
      <ContextMenu items={menuItems} />
      <Sidebar
        top={checkCurrentPage(newSidebarTop)}
        bottom={sidebarSettingsBottomData}
        class="sidebar-first"
        onlyMax={hideSidebar}
        showVersion={true}
        sidebarHover={false}
      />
      <div className="settings-content settings-loading">
        <div className="loading settings-loading-animation material-symbols-outlined">
          progress_activity
        </div>
      </div>
    </div>
  ) : (
    <>
      {isConfigChanges && (
        <div className="settings-save-container">
          <div className='settings-save-box'>
            <div className="settings-save-text">
              Hey! config has changed, please save.
            </div>
            <div className="settings-save-buttons">
              <Button value='reset' className='settings-save-button' onClick={() => {
                setConfig((prev) => {
                  if (!prev) return undefined
                  return { old: structuredClone(prev.old), new: structuredClone(prev.old) }
                })
                setisConfigChanges(() => false)
              }} />
              <Button value='save' className='settings-save-button' onClick={() => { saveConf(); setisConfigChanges(() => false) }} />
            </div>
          </div>
        </div>
      )}
      <div className="settings-container">
        <ContextMenu items={menuItems} />
        <div className="settings-shadow-element"></div>
        <Sidebar
          top={checkCurrentPage(newSidebarTop)}
          bottom={sidebarSettingsBottomData}
          class="sidebar-first"
          onlyMax={hideSidebar}
          sidebarHover={false}
          showVersion={true}
        />
        {settingPage == 'general' && config ? (
          <div className="settings-content">
            <div className="settings-space">
              <div className="text">{t('settings.sidebar.General')}</div>
              <Checkbox
                title={t('settings.general.HoverSidebar')}
                checked={config.new.General.HoverSidebar}
                onClick={(event) =>
                  handleChange('General.HoverSidebar', event.currentTarget.checked)
                }
              />
              <div className="border-settings"></div>
              <div className="same-space">
                {t('settings.general.language')}
                <Dropdown options={language} placeholder={checkLang(config.new.General.language)} />
              </div>
            </div>
            <div className="settings-space">
              <div className="text">{t('settings.general.theme')}</div>
              <div className="same-space">
                {t('settings.general.theme')}{' '}
                <Dropdown options={theme} placeholder={config.new.General.theme} />
              </div>
            </div>
            <div className="settings-space">
              <div className="text">Updates</div>
              <Checkbox
                title="Updates"
                checked={config.new.update.enable}
                onClick={(event) =>
                  handleChange('update.enable', event.currentTarget.checked)
                }
              />
              <div className="border-settings"></div>
              <div className="same-space">
                Check Update
                <Dropdown options={[
                  { label: "On Start", value: "On Start", onClick: () => handleChange('update.type', "start") },
                  { label: "Every Day", value: "Every Day", onClick: () => handleChange('update.type', "day") },
                  { label: "Week", value: "Week", onClick: () => handleChange('update.type', "week") }
                ]
                } placeholder={convertUpdateOption(config.new.update.type)}
                />
              </div>
            </div>
            <div className="settings-space">
              <div className="text">{t('settings.general.Window')}</div>
              <Checkbox
                helpDescription={t('tips.gAutoMaximize')}
                title={t('settings.general.AutoMaximize')}
                checked={config.new.General.Window.AutoMaximize}
                onClick={(event) =>
                  handleChange('General.Window.AutoMaximize', event.currentTarget.checked)
                }
              />
              <div className="border-settings"></div>
              <Checkbox
                helpDescription={t('tips.gAutoFullscreen')}
                title={t('settings.general.AutoFullscreen')}
                checked={config.new.General.Window.AutoFullscreen}
                onClick={(event) =>
                  handleChange('General.Window.AutoFullscreen', event.currentTarget.checked)
                }
              />
              <div className="border-settings"></div>
              <Input
                helpDescription={t('tips.gZoom')}
                title={t('settings.general.Zoom')}
                placeholder="100"
                value={parseInt(config.new.General.Window.Zoom.toString())}
                char='%'
                type='number'
                onChange={(event) => handleChange('General.Window.Zoom', event.currentTarget.value)}
              />
            </div>
          </div>
        ) : (
          ''
        )}
        {settingPage == 'history' && config ? (
          <div className="settings-content">
            <div className="settings-space">
              <div className="text">{t('sidebar.History')}</div>
              <Input
                title={t('settings.player.historysave')}
                placeholder="20"
                value={config.new.History.history.maxSave}
                onChange={(event) =>
                  handleChange('History.history.maxSave', event.currentTarget.value)
                }
              />
            </div>
            <div className="settings-space">
              <div className="text">{t('sidebar.ContinueWatching')}</div>
              <Input
                helpDescription={t('tips.hContinueMinimal')}
                title={t('settings.player.MinimalTimeSave')}
                placeholder="5"
                value={config.new.History.continue.MinimalTimeSave}
                char="s"
                type='number'
                onChange={(event) =>
                  handleChange('History.continue.MinimalTimeSave', event.currentTarget.value)
                }
              />
              <div className="border-settings"></div>
              <Input
                helpDescription={t('tips.hContinueMax')}
                title={t('settings.player.MaximizeTimeSave')}
                placeholder="120"
                value={config.new.History.continue.MaximizeTimeSave}
                char="s"
                type='number'
                onChange={(event) =>
                  handleChange('History.continue.MaximizeTimeSave', event.currentTarget.value)
                }
              />
            </div>
          </div>
        ) : (
          ''
        )}
        {settingPage == 'player' && config ? (
          <div className="settings-content">
            <div className="settings-space">
              <div className="text">{t('settings.sidebar.General')}</div>
              <Checkbox
                title={t('settings.player.autoPlay')}
                checked={config.new.Player.general.Autoplay}
                onClick={(event) =>
                  handleChange('Player.general.Autoplay', event.currentTarget.checked)
                }
              />
              <div className="border-settings"></div>
              <Checkbox
                helpDescription={t('tips.pAutoFullscreen')}
                title={t('settings.general.AutoFullscreen')}
                checked={config.new.Player.general.AutoFullscreen}
                onClick={(event) =>
                  handleChange('Player.general.AutoFullscreen', event.currentTarget.checked)
                }
              />
              <div className="border-settings"></div>
              <Checkbox
                title={"Auto skip episode"}
                checked={config.new.Player.general.AutoSkipEpisode}
                onClick={(event) =>
                  handleChange('Player.general.AutoSkipEpisode', event.currentTarget.checked)
                }
              />
              <div className="border-settings"></div>
              <Input
                title={t('settings.player.DefaultVolume')}
                placeholder="25"
                value={config.new.Player.general.Volume}
                char="%"
                type='number'
                onChange={(event) =>
                  handleChange('Player.general.Volume', event.currentTarget.value)
                }
              />
              <div className="border-settings"></div>
              <Input
                helpDescription={t('tips.pSkip')}
                title={t('settings.player.LongTimeSkipForward')}
                placeholder="80"
                value={config.new.Player.general.LongTimeSkipForward}
                char="s"
                type='number'
                onChange={(event) =>
                  handleChange('Player.general.LongTimeSkipForward', event.currentTarget.value)
                }
              />
              <div className="border-settings"></div>
              <Input
                helpDescription={t('tips.pSkip')}
                title={t('settings.player.LongTimeSkipBack')}
                placeholder="80"
                value={config.new.Player.general.LongTimeSkipBack}
                char="s"
                type='number'
                onChange={(event) =>
                  handleChange('Player.general.LongTimeSkipBack', event.currentTarget.value)
                }
              />
              <div className="border-settings"></div>
              <Input
                helpDescription={t('tips.pSkip')}
                title={t('settings.player.TimeSkipForward')}
                placeholder="5"
                value={config.new.Player.general.TimeSkipRight}
                char="s"
                type='number'
                onChange={(event) =>
                  handleChange('Player.general.TimeSkipRight', event.currentTarget.value)
                }
              />
              <div className="border-settings"></div>
              <Input
                helpDescription={t('tips.pSkip')}
                title={t('settings.player.TimeSkipBack')}
                placeholder="5"
                value={config.new.Player.general.TimeSkipLeft}
                char="s"
                type='number'
                onChange={(event) =>
                  handleChange('Player.general.TimeSkipLeft', event.currentTarget.value)
                }
              />
              <div className="border-settings"></div>
              <div className="same-space">
                Player preload type
                <Dropdown options={playerType} placeholder={config.new.Player.general.playerLoadType} />
              </div>
            </div>
            <div className="settings-space">
              <div className="text">{t('settings.screenshot.Screenshot')}</div>
              <Checkbox
                title={t('settings.screenshot.AlwaysAsk')}
                checked={config.new.Player.screenShot.alwaysAsk}
                onClick={(event) =>
                  handleChange('Player.screenShot.alwaysAsk', event.currentTarget.checked)
                }
              />
              <div className="border-settings"></div>
              <div className="same-space">
                <span style={{ marginTop: "10px", marginBottom: "10px" }}>{t("settings.screenshot.path")}<span className="curret-settings"> {config.new.Player.screenShot.path}</span></span> <Button value='Change path' className='settings-button' onClick={async () => await changePathScreenshot(await window.api.os.openDialog(undefined, undefined, ["openDirectory"]))} />
              </div>
            </div>
            <div className="settings-space">
              <div className="text">{t('settings.player.Keybinds')}</div>
              <Keybind
                title={t('settings.player.Pause')}
                value={getKeybind(config.new.Player.keybinds.Pause)}
                changeKey={(key) => handleChange('Player.keybinds.Pause', key)}
              />
              <Keybind
                title={t('settings.player.Fullscreen')}
                value={getKeybind(config.new.Player.keybinds.Fullscreen)}
                changeKey={(key) => handleChange('Player.keybinds.Fullscreen', key)}
              />
              <Keybind
                title={t('settings.player.ExitPlayer')}
                value={getKeybind(config.new.Player.keybinds.ExitPlayer)}
                changeKey={(key) => handleChange('Player.keybinds.ExitPlayer', key)}
              />
              <Keybind
                title={t('settings.player.LongTimeSkipForward')}
                value={getKeybind(config.new.Player.keybinds.LongTimeSkipForward)}
                changeKey={(key) => handleChange('Player.keybinds.LongTimeSkipForward', key)}
              />
              <Keybind
                title={t('settings.player.LongTimeSkipBack')}
                value={getKeybind(config.new.Player.keybinds.LongTimeSkipBack)}
                changeKey={(key) => handleChange('Player.keybinds.LongTimeSkipBack', key)}
              />
              <Keybind
                title={t('settings.player.TimeSkipForward')}
                value={getKeybind(config.new.Player.keybinds.TimeSkipRight)}
                changeKey={(key) => handleChange('Player.keybinds.TimeSkipRight', key)}
              />
              <Keybind
                title={t('settings.player.TimeSkipBack')}
                value={getKeybind(config.new.Player.keybinds.TimeSkipLeft)}
                changeKey={(key) => handleChange('Player.keybinds.TimeSkipLeft', key)}
              />
              <Keybind
                title={t('settings.player.FrameSkipBack')}
                value={getKeybind(config.new.Player.keybinds.FrameSkipBack)}
                changeKey={(key) => handleChange('Player.keybinds.FrameSkipBack', key)}
              />
              <Keybind
                title={t('settings.player.FrameSkipForward')}
                value={getKeybind(config.new.Player.keybinds.FrameSkipForward)}
                changeKey={(key) => handleChange('Player.keybinds.FrameSkipForward', key)}
              />
              <Keybind
                title={t('settings.player.VolumeUP')}
                value={getKeybind(config.new.Player.keybinds.VolumeUp)}
                changeKey={(key) => handleChange('Player.keybinds.VolumeUp', key)}
              />
              <Keybind
                title={t('settings.player.VolumeDown')}
                value={getKeybind(config.new.Player.keybinds.VolumeDown)}
                changeKey={(key) => handleChange('Player.keybinds.VolumeDown', key)}
              />
              <Keybind
                title={t('settings.player.VolumeMute')}
                value={getKeybind(config.new.Player.keybinds.VolumeMute)}
                changeKey={(key) => handleChange('Player.keybinds.VolumeMute', key)}
              />
              <Keybind
                title={t('settings.player.Screenshot')}
                value={getKeybind(config.new.Player.keybinds.ScreenShot)}
                changeKey={(key) => handleChange('Player.keybinds.ScreenShot', key)}
              />
            </div>
          </div>
        ) : (
          ''
        )}
        {settingPage == 'developer' && config ?
          <div className="settings-content">
            <div className="settings-space">
              <div className="text">DevTools</div>
              <Checkbox
                title="Turn on DevTools"
                checked={config.new.Developer.DevTools}
                onClick={(event) =>
                  handleChange('Developer.DevTools', event.currentTarget.checked)
                }
              />
              <div className="border-settings"></div>
              <Checkbox
                title="DevTools on start"
                checked={config.new.Developer.DevToolsOnStart}
                onClick={(event) =>
                  handleChange('Developer.DevToolsOnStart', event.currentTarget.checked)
                }
              />
              <div className="border-settings"></div>
              <Checkbox
                title="PlayerDebug Stats"
                checked={config.new.Developer.playerDebug}
                onClick={(event) =>
                  handleChange('Developer.playerDebug', event.currentTarget.checked)
                }
              />
            </div>
            {/* <div className="settings-space">
              <div className="text">Other</div>
              <div className="same-space">
                CSS Test
                <Button value='Test CSS' className='settings-button' onClick={() => showDialog({ type: "custom", content: DeveloperDialog() })} />
              </div>
            </div> */}
          </div> : ""}
      </div>
    </>
  )
}

// function DeveloperDialog() {
//   return (
//     <>
//       <div className="dev-header">Css Test</div>
//       <div className='dev-container'>
//         <div className="dev-elements">
//           <Button value='<div class="material-symbols-outlined text-button">code</div>' className='icon-button' type='icon' title='Sidebar Button' />
//           <Button value='<div class="material-symbols-outlined text-button">code</div> Sidebar Button' className='icon-button' type='icon-text' title='Sidebar Button' />
//           <Button value='<div class="material-symbols-outlined text-button">code</div>' className='player-buttons' type='icon' title='Player Button' />
//         </div>
//         <div className="dev-elements">
//           <MainInput placeholder='Input from header'/>
//           <CustomSlider min={0} max={100} current={0} step={0} />
//         </div>
//       </div>
//     </>
//   )
// }

export default Settings

