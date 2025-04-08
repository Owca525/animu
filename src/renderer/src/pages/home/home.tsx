import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useContext, useEffect, useState } from 'react'
import useHotkeys from '@reecelucas/react-use-hotkeys'

// Components
import Sidebar from '../../components/elements/sidebar'
import Content from './content'
import Header from '../../components/elements/headers'
import ContextMenu from '../../components/elements/context-menu'
import { hideInformation, isInformationShow } from '@renderer/utils/context/InformationContext'

// utils
import { ContainerProps } from './content'
import { get_recent, get_search } from '../../utils/backend'
import { ReadContinue } from '../../utils/filesMange/continueWatch'
import { configContext } from '../../utils/context/small'
import { closeDialog, showDialog } from '@renderer/utils/context/DialogContext'

import '../../css/pages/home.css'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@renderer/utils/reducers'
import { setHover } from '@renderer/utils/reducers/sidebar'
import { CreateHomePage } from '@renderer/utils/anilistApi'
import { useQuery } from 'react-query'

function home() {
  const navigate = useNavigate()

  const config = useContext(configContext)

  // Language
  const { t } = useTranslation()
  const { state } = useLocation()

  const [ func, setfunc ] = useState<() => Promise<any>>(() => CreateHomePage)
  const { data, error, isLoading, refetch } = useQuery(
      [func.toString()],
      func,
      {
          refetchOnWindowFocus: false,
          cacheTime: 0,
      }
  );

  console.log(data)

  // const [data, setData] = useState<ContainerProps>({ title: '', data: [] })
  const dispatch = useDispatch();
  const sidebarHover = useSelector((state: RootState) => state.sidebar.hover);

  const sidebarHomeTopData = [
    {
      icon: "home",
      class: 'icon-button',
      title: t('sidebar.RecentAnime'),
      onClick: async () => {setfunc(() => CreateHomePage);refetch()},
      type: "home"
    },
    {
      icon: "history",
      class: 'icon-button',
      title: t('sidebar.ContinueWatching'),
      onClick: async () => {setfunc(() => ReadContinue);refetch()},
      type: "continue"
    },
    {
      icon: "history",
      class: 'icon-button',
      title: t('sidebar.History'),
      onClick: async () => {await import("../../utils/filesMange/history").then(async ({ ReadHistory }) => setfunc(() => ReadHistory));refetch()},
      type: "history"
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

  useEffect(() => {
    if (state && state.category) {
      sidebarHomeTopData.forEach((element) => {
        if (element.type == state.category) element.onClick()
      })
    } else {
      // get_recent().then((value) => {
      //   change_content({
      //     title: t('sidebar.RecentAnime'),
      //     data: value
      //   })
      // })
    }
    window.api.rpc.setActivity(undefined, t("status.home"))
    // LoadingPluginOfficial()
  }, [])

  const handleInputChange = (value: string) => {
    // get_search(value).then((data) => {
    //   change_content({ title: t('header.activeSearch', { name: value }), data: data })
    // })
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

  return (
    <>
      <ContextMenu items={menuItems} />
      <main className="container">
        <Header onInputChange={handleInputChange} className='home-header' />
        <Sidebar
          top={sidebarHomeTopData}
          bottom={sidebarHomeBottomData}
          sidebarHover={config.General.HoverSidebar}
          class='home-sidebar'
        />
        {isLoading ? (
          <div className="content loading-home">
            <div className="card-content-loading loading material-symbols-outlined">
              progress_activity
            </div>
          </div>
        ) : (
          <Content data={data} />
        )}
      </main>
    </>
  )
}

export default home
