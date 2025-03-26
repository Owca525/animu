import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useContext, useEffect, useState } from 'react'
import useHotkeys from '@reecelucas/react-use-hotkeys'

// Components
import Sidebar from '../components/elements/sidebar'
import Content from '../components/elements/card-content'
import Header from '../components/elements/headers'
import ContextMenu from '../components/elements/context-menu'
import { hideInformation, isInformationShow } from '@renderer/utils/context/InformationContext'

// utils
import { ContainerProps } from '../utils/interface'
import { get_recent, get_search } from '../utils/backend'
import { ReadContinue } from '../utils/continueWatch'
import { configContext } from '../utils/context/small'
import { closeDialog, showDialog } from '@renderer/utils/context/DialogContext'

import '../css/pages/home.css'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@renderer/utils/reducers'
import { setHover } from '@renderer/utils/reducers/sidebar'

function home() {
  const navigate = useNavigate()

  const config = useContext(configContext)

  // Language
  const { t } = useTranslation()

  const [data, setData] = useState<ContainerProps>({ title: '', data: [] })
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch();
  const sidebarHover = useSelector((state: RootState) => state.sidebar.hover);

  const sidebarHomeTopData = [
    {
      icon: "schedule",
      class: 'icon-button',
      title: t('sidebar.RecentAnime'),
      onClick: async () =>
        change_content({ title: t('sidebar.RecentAnime'), data: await functionHandler(get_recent) })
    },
    {
      icon: "history",
      class: 'icon-button',
      title: t('sidebar.ContinueWatching'),
      onClick: async () =>
        change_content({
          title: t('sidebar.ContinueWatching'),
          data: await functionHandler(ReadContinue)
        })
    },
    {
      icon: "history",
      class: 'icon-button',
      title: t('sidebar.History'),
      onClick: async () =>
        change_content({ title: t('sidebar.History'), data: await import("../utils/history").then(async ({ ReadHistory }) => await functionHandler(ReadHistory)) })
    }
  ]

  const sidebarHomeBottomData = [
    // {
    //   value:
    //     '<div class="material-symbols-outlined text-button">extension</div>' +
    //     t('sidebar.Extensions'),
    //   class: 'icon-button',
    //   title: t('sidebar.Extensions')
    // },
    {
      icon: "settings",
      class: 'icon-button',
      title: t('sidebar.settings'),
      onClick: async () => navigate('/settings')
    }
  ]

  const menuItems = [{ label: t('contextMenu.reload'), onClick: () => location.reload() }]

  const functionHandler = async (func: any): Promise<any> => {
    closeDialog()
    setLoading(true)
    return await func()
  }

  useEffect(() => {
    get_recent().then((value) => {
      change_content({
        title: t('sidebar.RecentAnime'),
        data: value
      })
      setLoading(false)
    })
    window.api.rpc.setActivity(undefined, t("status.home"))

    // LoadingPluginOfficial()
  }, [])

  const change_content = (newData: ContainerProps) => {
    if (newData.data && newData.data.length != 0 && newData.data[0].title == 'error') {
      showDialog({
        header_text: t('errors.connection'), text: "Error getting information from allmanga", buttons: [
          { title: t('general.exit'), onClick: () => window.BrowserWindow.exit() },
          { title: t('general.reload'), onClick: async () => change_content({ title: t('sidebar.RecentAnime'), data: await functionHandler(get_recent) }) }
        ]
      })
      setData({ title: t('sidebar.RecentAnime') })
      return
    }
    setData(newData)
    setLoading(false)
  }

  const handleInputChange = (value: string) => {
    setLoading(true)
    get_search(value).then((data) => {
      change_content({ title: t('header.activeSearch', { name: value }), data: data })
    })
  }

  useHotkeys("Escape", () => {
    if (isInformationShow()) hideInformation()
    else showDialog({
      header_text: "Animu", text: "Exit Animu?", buttons: [
        { title: t('general.exit'), onClick: () => window.BrowserWindow.exit() },
        { title: "Back", onClick: () => closeDialog() },
      ]
    })
  });

  useHotkeys("Tab", (event) => {
    event.preventDefault()
    dispatch(setHover(!sidebarHover))
  });

  function createSidebar() {
    return (
      <Sidebar
        top={sidebarHomeTopData}
        bottom={sidebarHomeBottomData}
        sidebarHover={config.General.HoverSidebar}
        class='home-sidebar'
      />
    )
  }

  if (config) {
    return (
      <>
        <ContextMenu items={menuItems} />
        <main className="container">
          <Header onInputChange={handleInputChange} className='home-header' />
          {createSidebar()}
          {loading ? (
            <div className="content loading-home">
              <div className="card-content-loading loading material-symbols-outlined">
                progress_activity
              </div>
            </div>
          ) : (
            <Content title={data.title} data={data.data} className='home-content' />
          )}
        </main>
      </>
    )
  }
  return
}

export default home
