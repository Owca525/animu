import { createStore } from 'solid-js/store';
import { FilterParams, homeData } from '../types';
import { anilistSearch, historySearch, setHistory, setHome } from '@renderer/pages/home/homeUtils';
import { globalNavigate } from '../functions';

const initialState: homeData = {
    isLoading: false,
    isError: false,
    data: { sections: [] },
    search: "",
    page: 1,
    stopScrolling: false,
    filterTags: undefined,
    mainContainer: undefined,
    activePage: "home",
    otherFilter: [{
        page: 'global.animulist',
        filter: [{
            type: 'watching',
            placeholder: 'Status Watching',
            title: 'Status Watching',
            langPath: 'animulist.status.',
            options: ["CURRENT", "PLANNING", "COMPLETED", "REPEATING", "PAUSED", "DROPPED"]
        }]
    }],
    sidebarData: {
        top: [
            {
                icon: "home",
                text: "global.home",
                onClick: setHome,
                onSearch: anilistSearch
            },
            {
                icon: "history",
                text: "global.history",
                onClick: setHistory,
                onSearch: historySearch
            },
            // {
            //     icon: "view_list",
            //     text: "global.animulist",
            //     onClick: setAnimuList,
            //     onSearch: AnimuListSearch
            // },
            // {
            //     icon: "calendar_month",
            //     text: "global.schedule",
            //     onClick: setCalendary,
            // }
        ],
        bottom: [
            {
                icon: "settings",
                text: "global.settings",
                onClick: () => globalNavigate("/settings"),
            },
        ],
    }
};

export const [globalState, setGlobalState] = createStore(initialState);

export const getHomeCache = () => globalState;
export const getHomeSidebarData = () => globalState.sidebarData;
export const getFilterParams = () => globalState.filterTags;
export const activeHomePage = () => globalState.activePage;
export const setAllHomeData = (tmp: homeData) => setGlobalState((prev) => ({ ...prev, ...tmp }));
export const setHomeSearch = (tmp: string | undefined) => setGlobalState((prev) => ({ ...prev, search: tmp }));
export const setHomeStopScrolling = (tmp: boolean) => setGlobalState((prev) => ({ ...prev, stopScrolling: tmp }));
export const setHomeSearchTags = (tmp: undefined | FilterParams) => setGlobalState((prev) => ({ ...prev, filterTags: tmp }));
export const setHomeSearchPage = (tmp: number) => setGlobalState((prev) => ({ ...prev, page: tmp }));
export const setHomeActivePage = (tmp: string) => setGlobalState((prev) => ({ ...prev, activePage: tmp }));
export const setHomeNewData = (tmp: homeData["data"]) => setGlobalState((prev) => ({ ...prev, data: tmp }));