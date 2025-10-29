import AnilistApi from "@renderer/plugins/newAnilistApi";
import { containerData, genresSearchFormat, informationPluginManagerFormat, newInformationPluginFormat } from "./GlobalInterface";
import store from "./store";

export class informationPluginManager implements informationPluginManagerFormat {
    //   private plugins: newInformationPluginFormat[] = [];
    currentPlugin: newInformationPluginFormat = new AnilistApi()

    searchAnime = (name: string, page: number, params?: genresSearchFormat) => {
        store.dispatch({
            type: "setAllHomeData", payload: {
                isLoading: true, isError: false, data: { sections: [] }
            }
        });
        this.currentPlugin.search({ name, page, params }, {
            onSuccess: (data: containerData) => {
                store.dispatch({
                    type: "setAllHomeData", payload: {
                        isLoading: false, isError: false, data: {
                            sections: [data]
                        }
                    }
                });
            },
            onError: (_error: string) => {
                store.dispatch({
                    type: "setAllHomeData", payload: {
                        isLoading: false, isError: true, data: { sections: [] }
                    }
                });
            }
        });
    };
    home = () => {
        store.dispatch({
            type: "setAllHomeData", payload: {
                isLoading: true, isError: false, data: { sections: [] }
            }
        })
        this.currentPlugin.home({
            onSuccess: (data: { topCards?: containerData; sections: containerData[]; }) => {
                store.dispatch({
                    type: "setAllHomeData", payload: {
                        isLoading: false, isError: false, data: { topCards: data.topCards, sections: data.sections.map((element) => ({ ...element, titlevent: { ...element.titlevent, onTitleClick: this.onTitleClick } })) }
                    }
                })
            },
            onError: (_error: string) => {
                store.dispatch({
                    type: "setAllHomeData", payload: {
                        isLoading: false, isError: true, data: { sections: [] }
                    }
                })
            }
        })
    }
    anime = async (id: string) => {
        return await this.currentPlugin.anime({ id: id })
    }
    onTitleClick = (content: any) => {
        store.dispatch({
            type: "setAllHomeData", payload: {
                isLoading: true, isError: false, data: { sections: [] }
            }
        })
        this.currentPlugin.onTitleClick({ content: content } ,{
            onSuccess: function (data: containerData): void {
                let tmp: { topCards?: containerData, sections: containerData[] } = store.getState().home.data
                let newData: containerData = data
                if (tmp.sections.length > 0) newData = { ...newData, data: { ...tmp.sections[0].data, ...newData.data } }
                store.dispatch({
                    type: "setAllHomeData", payload: {
                        isLoading: false, isError: false, data: { sections: [newData] }
                    }
                })
            },
            onError: function (_error: string): void {
                store.dispatch({
                    type: "setAllHomeData", payload: {
                        isLoading: false, isError: true, data: { sections: [] }
                    }
                })
            }
        })
    }
}