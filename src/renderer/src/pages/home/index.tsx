import { useNavigate } from "react-router-dom"

// Home css
import "./home.css"
import Input from "@renderer/components/input"
import Sidebar from "@renderer/components/sidebar"
import Container from "./components/container"
import { useSelector } from "react-redux"
import { useEffect, useRef, useState } from "react"
import { containerData, FilterParams, homeData, informationPluginFormat, SettingsConfig } from "@renderer/utils/GlobalInterface"
import { t } from "i18next"
import store from "@renderer/utils/store"
import { homeStopScrolling, setHomeData, setHomeLocalSearch } from "@renderer/utils/pluginApi"
import { ReadContinue } from "@renderer/utils/history/continueWatch"
import { ReadHistory } from "@renderer/utils/history/history"
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu"
import { CreateContextMenuOptions, getGradientColor } from "@renderer/utils/functions"
import Filter from "./components/filter"
import Button from "@renderer/components/buttons"
import { useQuery } from "react-query"
import BigCardsContainer from "./components/bigCardsContainer"
// import WelcomeScreen from "./components/welcomeScreen"

const ANIME_DATA = {
    "id": 154768,
    "title": {
        "english": "My Dress-Up Darling Season 2",
        "romaji": "Sono Bisque Doll wa Koi wo Suru Season 2",
        "native": "その着せ替え人形は恋をする Season 2"
    },
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154768-DHHvNd4MjV1p.jpg",
    "startDate": {
        "year": 2025,
        "month": 7,
        "day": 6
    },
    "endDate": {
        "year": 2025,
        "month": 9,
        "day": 21
    },
    "bannerImage": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/154768-EuZd63IcqsVq.jpg",
    "season": "SUMMER",
    "seasonYear": 2025,
    "description": "The second season of <i>Sono Bisque Doll wa Koi wo Suru</i>.\n<br><br>\nWhen Marin Kitagawa and Wakana Gojo met, they grew close over their love for cosplay. Through interacting with classmates and making new cosplay friends, Marin and Wakana’s world keeps growing. New developments arise as Marin’s love for Wakana continues to be filled with endless excitement. In their ever-expanding world, Marin and Wakana’s story of cosplay and thrills continues!<br><br>\n(Source: Crunchyroll)",
    "type": "ANIME",
    "format": "TV",
    "source": "MANGA",
    "status": "FINISHED",
    "episodes": 12,
    "duration": 24,
    "genres": [
        "Comedy",
        "Ecchi",
        "Romance",
        "Slice of Life"
    ],
    "averageScore": 83,
    "popularity": 117565,
    "trailer": {
        "id": "Gx1QvE0wtgw",
        "site": "youtube"
    },
    "nextAiringEpisode": null,
    "characters": [
        {
            "role": "MAIN",
            "character": {
                "id": 133676,
                "image": "https://s4.anilist.co/file/anilistcdn/character/large/b133676-kV2czE3C8Qls.png",
                "name": "Marin Kitagawa"
            },
            "voiceActor": {
                "id": 136365,
                "image": "https://s4.anilist.co/file/anilistcdn/staff/large/n136365-5OQJgLSpO4Ja.jpg",
                "name": "Hina Suguta"
            }
        },
        {
            "role": "MAIN",
            "character": {
                "id": 133678,
                "image": "https://s4.anilist.co/file/anilistcdn/character/large/b133678-IitCgjDxQGgu.png",
                "name": "Wakana Gojou"
            },
            "voiceActor": {
                "id": 121940,
                "image": "https://s4.anilist.co/file/anilistcdn/staff/large/n121940-VsqIg2qO2RXF.png",
                "name": "Shouya Ishige"
            }
        },
        {
            "role": "SUPPORTING",
            "character": {
                "id": 133677,
                "image": "https://s4.anilist.co/file/anilistcdn/character/large/b133677-PqshvUeVFB7u.jpg",
                "name": "Sajuna Inui"
            },
            "voiceActor": {
                "id": 112215,
                "image": "https://s4.anilist.co/file/anilistcdn/staff/large/n112215-kfABGD8W2YSJ.jpg",
                "name": "Atsumi Tanezaki"
            }
        },
        {
            "role": "SUPPORTING",
            "character": {
                "id": 133675,
                "image": "https://s4.anilist.co/file/anilistcdn/character/large/b133675-x2ISBsL4jNuT.png",
                "name": "Kaoru Gojou"
            },
            "voiceActor": {
                "id": 100491,
                "image": "https://s4.anilist.co/file/anilistcdn/staff/large/n100491-6xlkDMFJdADo.png",
                "name": "Atsushi Ono"
            }
        },
        {
            "role": "SUPPORTING",
            "character": {
                "id": 207937,
                "image": "https://s4.anilist.co/file/anilistcdn/character/large/b207937-ytYjcNtNX77K.png",
                "name": "Shinju Inui"
            },
            "voiceActor": {
                "id": 205892,
                "image": "https://s4.anilist.co/file/anilistcdn/staff/large/n205892-gaMHjeUijh84.png",
                "name": "Hina Youmiya"
            }
        },
        {
            "role": "SUPPORTING",
            "character": {
                "id": 260978,
                "image": "https://s4.anilist.co/file/anilistcdn/character/large/b260978-uWmdkycWGumq.png",
                "name": "Daia Yahiro"
            },
            "voiceActor": {
                "id": 163941,
                "image": "https://s4.anilist.co/file/anilistcdn/staff/large/n163941-PXmQzEBR5sgL.png",
                "name": "Yuuka Amemiya"
            }
        },
        {
            "role": "SUPPORTING",
            "character": {
                "id": 260977,
                "image": "https://s4.anilist.co/file/anilistcdn/character/large/b260977-dtDIf91s9xkk.png",
                "name": "Nowa Sugaya"
            },
            "voiceActor": {
                "id": 123888,
                "image": "https://s4.anilist.co/file/anilistcdn/staff/large/n123888-Vt5drk9nogZu.png",
                "name": "Larissa Tago Takeda"
            }
        },
        {
            "role": "SUPPORTING",
            "character": {
                "id": 306939,
                "image": "https://s4.anilist.co/file/anilistcdn/character/large/b306939-kj8HQrsRd9sY.png",
                "name": "Kensei Morita"
            },
            "voiceActor": {
                "id": 162833,
                "image": "https://s4.anilist.co/file/anilistcdn/staff/large/n162833-lIRcWnPo20UV.png",
                "name": "Shuuichi Uchida"
            }
        },
        {
            "role": "SUPPORTING",
            "character": {
                "id": 262590,
                "image": "https://s4.anilist.co/file/anilistcdn/character/large/b262590-YUr2IDiN0GYB.jpg",
                "name": "Tae Hanaoka"
            },
            "voiceActor": {
                "id": 104108,
                "image": "https://s4.anilist.co/file/anilistcdn/staff/large/n104108-UXiBJxnycHhL.png",
                "name": "Ayaka Shimizu"
            }
        },
        {
            "role": "SUPPORTING",
            "character": {
                "id": 260979,
                "image": "https://s4.anilist.co/file/anilistcdn/character/large/b260979-NwQz8UAeFZ1e.png",
                "name": "Rune Yamauchi"
            },
            "voiceActor": {
                "id": 119155,
                "image": "https://s4.anilist.co/file/anilistcdn/staff/large/n119155-DCKagRHcI95J.png",
                "name": "Akira Sekine"
            }
        }
    ],
    "studios": [
        "CloverWorks"
    ]
}

const Home = () => {
    const navigate = useNavigate()
    const plugin: informationPluginFormat = useSelector((plugin: any) => plugin.plugin.informationPlugin);
    const homeCache: homeData = useSelector((cache: any) => cache.home);
    const pluginPlayer = store.getState().plugin.playerPlugin;
    const config: SettingsConfig = useSelector((data: any) => data.config);
    const [homeFunc, setFunc] = useState<Promise<{ topCards?: containerData, sections: containerData[] }>>(plugin.info.home)
    const { data: homedata, isError: isError, isFetching: isLoading, refetch } = useQuery({
        queryFn: async () => {
            return await homeFunc
        },
        refetchOnWindowFocus: false,
        staleTime: 2 * 60 * 60 * 1000,
        cacheTime: 2 * 60 * 60 * 1000
    });
    console.log(homedata, homeFunc)

    const divRef = useRef<HTMLDivElement | null>(null);

    let sidebarData = {
        top: [
            {
                icon: "home",
                text: t("global.home"),
                onClick: () => wrapper(plugin.info.home())
            },
            {
                icon: "history",
                text: t("global.history"),
                onClick: () => wrapper(history())
            }
        ],
        bottom: [
            {
                icon: "settings",
                text: t("global.settings"),
                onClick: () => navigate("/settings")
            }
        ]
    }

    if (pluginPlayer.sidebarAddon) {
        sidebarData = {
            bottom: [...sidebarData.bottom],
            top: [...sidebarData.top, ...pluginPlayer.sidebarAddon]
        }
    }

    useEffect(() => {
        if (config.General.discordRPC) window.api.rpc.setActivity(undefined, t("discordrpc.home"))
    }, [])

    useEffect(() => {
        if (!divRef.current) return
        if (homeCache.data.length == 0) return
        if (homeCache.data.length > 1) return
        const { scrollHeight, clientHeight } = divRef.current;
        if (scrollHeight > clientHeight == false) handleScroll()
    }, [homeCache.data])

    async function wrapper(func: Promise<{ topCards?: containerData, sections: containerData[] }>) {
        setFunc(func)
        refetch()
    }

    async function history(): Promise<{ topCards?: containerData, sections: containerData[] }> {
        setHomeLocalSearch(true)
        return {
            sections: [
                {
                    title: t("global.continuewatch"),
                    data: await ReadContinue(20),
                    horizontal: true,
                    onTitleClick: () => setHomeData(async () => [{ title: t("global.continuewatch"), data: await ReadContinue(), horizontal: false }])
                },
                {
                    title: t("global.history"),
                    data: await ReadHistory(20),
                    horizontal: true,
                    onTitleClick: () => setHomeData(async () => [{ title: t("global.history"), data: await ReadHistory(), horizontal: false }])
                },
            ]
        }
    }

    const handleScroll = () => {
        if (homeCache.data.length > 1) return
        if (!divRef.current) return
        const currentPos = -divRef.current.scrollTop + divRef.current.scrollHeight
        const endPosition = divRef.current.offsetHeight
        const isFUCKINGBottom = parseInt(currentPos.toFixed(0)) <= endPosition + 30
        if (isFUCKINGBottom && homeCache.stopScrolling == false && homeCache.data.length === 1) {
            if (homeCache.data[0].onScrollDownFunction) {
                store.dispatch({ type: "setPage", payload: homeCache.page + 1 })
                homeCache.data[0].onScrollDownFunction(homeCache.page + 1)
            }
            return
        }
        if (isFUCKINGBottom && !homeCache.stopScrolling) {
            store.dispatch({ type: "setPage", payload: homeCache.page + 1 })
            plugin.info.search(homeCache.search, homeCache.page + 1, homeCache.filterTags)
        }
    }

    async function OnSearch(text: string) {
        if (!homeCache.localSearch) {
            store.dispatch({ type: "setSearch", payload: text });
            store.dispatch({ type: "setPage", payload: 1 });
            homeStopScrolling(false);
            plugin.info.search(text, 1, store.getState().home.filterTags)
            return
        }

        // if (text == "" || text == " ") {
        //     await wrapper(history())
        //     return
        // }

        // let HomeData = homeCache.data;
        // if (homeCache.data.length == 2 || homeCache.data.length == 0) {
        //     HomeData = await history()
        // }
        // if (homeCache.data.length == 1 && homeCache.data[0].title == t("global.history")) {
        //     HomeData = [{ ...homeCache.data[0], data: await ReadHistory() }]
        // }
        // if (homeCache.data.length == 1 && homeCache.data[0].title == t("global.continuewatch")) {
        //     HomeData = [{ ...homeCache.data[0], data: await ReadContinue() }]
        // }

        // let newData = HomeData.map((containerData) => {
        //     let data = containerData.data.filter(data => data.AnimeData.title.romaji.toLowerCase().includes(text.toLowerCase()));
        //     if (data.length == 0) return
        //     return { ...containerData, data: data }
        // })
        // setHomeData(async () => newData.filter((value) => value != undefined))
    }

    function onChange(params?: FilterParams, removeParam?: string) {
        if (removeParam) {
            const newParams: FilterParams = { ...homeCache.filterTags };
            if (newParams[removeParam] !== undefined) {
                delete newParams[removeParam];
            }
            store.dispatch({ type: "setTags", payload: newParams })
            OnSearch(homeCache.search)
            return
        }

        if (!homeCache.filterTags) store.dispatch({ type: "setTags", payload: params })
        else store.dispatch({ type: "setTags", payload: { ...homeCache.filterTags, ...params } })
        OnSearch(homeCache.search)
    }

    function CreateTagList() {
        if (!homeCache.filterTags) return
        let data: any = []
        for (const [key, type] of Object.entries(homeCache.filterTags)) {
            data.push({ remover: () => onChange(undefined, key), name: type })
        }

        return data
    }

    return (
        <main className="home" onContextMenu={(event) => OpenContextMenu(CreateContextMenuOptions(), event)}>
            <div className="home-header-container">
                <Button icon="menu" ButtonClass="home-header-background" />
                <div className="home-header-search">
                    <Input placeholder={t("home.search")} InputClass="home-header-search home-header-background" onKeyDown={OnSearch} />
                    <div className="home-filter-void">
                        <Filter onChange={onChange} filter={plugin.searchOption} custonClass="home-header-background"
                        />
                    </div>
                </div>
            </div>
            {/* ADD HERE SIDEBAR */}

            <div className="home-content">
                {homedata && <BigCardsContainer data={homedata?.sections[0]} />}
                <div ref={divRef} className={`home-container ${isLoading && "home-loading-container"} ${isError && "home-loading-container"} ${homedata && homedata.sections.length <= 0 && "home-loading-container"}`} onScroll={handleScroll}>
                    {isLoading && isError == false && <div className="material-symbols-outlined home-loading-animation">progress_activity</div>}
                    {isError && isLoading == false && <div className="home-error-container"><span className="material-symbols-outlined home-error-icon">error</span>{t("home.error")}</div>}
                    {isLoading == false && isError == false && homedata && homedata.sections.length > 0 && homedata.sections.map((element: containerData) => <Container tags={homeCache.filterTags && homedata.sections.length == 1 ? CreateTagList() : undefined} title={element.title} data={element.data} horizontal={element.horizontal} onScrollDownFunction={element.onScrollDownFunction} onTitleClick={element.onTitleClick} />)}
                    {isError == false && isLoading == false && homedata && homedata.sections.length <= 0 && <div className="home-empty-container"><span className="material-symbols-outlined home-empty-icon">search_off</span>{t("home.nothingfound")}</div>}
                </div>
            </div>
        </main>
    )
}

export default Home


{/* <div className="home-header">
                <div className="home-header-left">
                <div className="button home-header-sidebar-placeholder"><span className="material-symbols-outlined">menu</span></div>
                    <Input placeholder={t("home.search")} InputClass="home-header-search" onKeyDown={OnSearch} />
                    <div className="home-filter-void">
                        <Filter onChange={onChange} filter={plugin.searchOption}
                        />
                    </div>
                </div>
                <div></div>
                <div className="home-header-right"></div>
            </div>
            {!config.General.HideSidebar && <div className="shadow-sidebar"></div>}
            <div className="home-top-container" style={{ backgroundImage: `url(${ANIME_DATA.bannerImage})` }}>
                <div className="home-top-background"></div>
                <div className="home-top-content">
                    <img src={ANIME_DATA.coverImage} className="card-image" />
                </div>
            </div>
            <div ref={divRef} className={`home-container ${homeCache.isLoading && "home-loading-container"} ${homeCache.isError && "home-loading-container"} ${homeCache.data.length <= 0 && "home-loading-container"}`} onScroll={handleScroll}>
                {homeCache.isLoading && homeCache.isError == false && <div className="material-symbols-outlined home-loading-animation">progress_activity</div>}
                {homeCache.isError && homeCache.isLoading == false && <div className="home-error-container"><span className="material-symbols-outlined home-error-icon">error</span>{t("home.error")}</div>}
                {homeCache.isLoading == false && homeCache.isError == false && homeCache.data.length > 0 && homeCache.data.map((element) => <Container tags={homeCache.filterTags && homeCache.data.length == 1 ? CreateTagList() : undefined} title={element.title} data={element.data} horizontal={element.horizontal} onScrollDownFunction={element.onScrollDownFunction} onTitleClick={element.onTitleClick} />)}
                {homeCache.isError == false && homeCache.isLoading == false && homeCache.data.length <= 0 && <div className="home-empty-container"><span className="material-symbols-outlined home-empty-icon">search_off</span>{t("home.nothingfound")}</div>}
            </div>
            <Sidebar data={sidebarData} /> */}
{/* <WelcomeScreen /> */ }