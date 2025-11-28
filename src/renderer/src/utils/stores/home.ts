import { createStore } from 'solid-js/store';
import { FilterParams, homeData } from '../types';

const initialState: homeData = {
    isLoading: false,
    isError: false,
    data: { sections: [] },
    search: "",
    page: 1,
    stopScrolling: false,
    filterTags: undefined,
    mainContainer: undefined,
    activePage: ""
};

export const [globalState, setGlobalState] = createStore(initialState);

export const getHomeCache = () => globalState;
export const setAllHomeData = (tmp: homeData) => setGlobalState((prev) => ({...prev, ...tmp}));
export const setHomeSearch = (tmp: string | undefined) => setGlobalState((prev) => ({...prev, search: tmp}));
export const setHomeStopScrolling = (tmp: boolean) => setGlobalState((prev) => ({...prev, stopScrolling: tmp}));
export const setHomeSearchTags = (tmp: undefined | FilterParams) => setGlobalState((prev) => ({...prev, filterTags: tmp}));
export const setHomeSearchPage = (tmp: number) => setGlobalState((prev) => ({...prev, page: tmp}));
export const setHomeActivePage = (tmp: string) => setGlobalState((prev) => ({...prev, activePage: tmp}));
export const setHomeNewData = (tmp: homeData["data"]) => setGlobalState((prev) => ({...prev, data: tmp}));