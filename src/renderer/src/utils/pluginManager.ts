import AnilistApi from "@renderer/plugins/newAnilistApi";
import { containerData, genresSearchFormat, informationPluginManagerFormat, newInformationPluginFormat } from "./types";
import { getHomeCache, setAllHomeData } from "./stores/home";

export class informationPluginManager implements informationPluginManagerFormat {
    //   private plugins: newInformationPluginFormat[] = [];
    currentPlugin: newInformationPluginFormat = new AnilistApi()

    searchAnime = (name: string, page: number, params?: genresSearchFormat) => {
        setAllHomeData({ data: { sections: [] }, isLoading: true, isError: false, } as any)
        this.currentPlugin.search({ name, page, params }, {
            onSuccess: (data: containerData) => {
                setAllHomeData({ data: { sections: [data] }, isLoading: false, isError: false, } as any)
            },
            onError: (_error: string) => {
                setAllHomeData({ data: { sections: [] }, isLoading: false, isError: true, } as any)
            }
        });
    };
    // schedule = (airingStart?: number, airingEnd?: number): void => {
    //     this.currentPlugin.schedule({ airingStart, airingEnd }, {
    //         onSuccess: function (data: containerData): void {
    //             throw new Error("Function not implemented.");
    //         },
    //         onError: function (error: string): void {
    //             throw new Error("Function not implemented.");
    //         }
    //     })
    // }
    home = () => {
        setAllHomeData({ data: { sections: [] }, isLoading: true, isError: false, } as any)
        this.currentPlugin.home({
            onSuccess: (data: { topCards?: containerData; sections: containerData[]; }) => {
                setAllHomeData({ data: { topCards: data.topCards, sections: data.sections.map((element) => ({ ...element, titlevent: { ...element.titlevent, onTitleClick: this.onTitleClick } })) }, 
                    isLoading: false, 
                    isError: false, 
                } as any)
            },
            onError: (_error: string) => {
                setAllHomeData({ data: { sections: [] }, isLoading: false, isError: true, } as any)
            }
        })
    }
    anime = async (id: string) => {
        return await this.currentPlugin.anime({ id: id })
    }
    onTitleClick = (content: any) => {
        setAllHomeData({ data: { sections: [] }, isLoading: true, isError: false, } as any)
        this.currentPlugin.onTitleClick({ content: content } ,{
            onSuccess: function (data: containerData): void {
                let tmp: { topCards?: containerData, sections: containerData[] } = getHomeCache().data
                let newData: containerData = data
                if (tmp.sections.length > 0) newData = { ...newData, data: { ...tmp.sections[0].data, ...newData.data } }
                setAllHomeData({ data: { sections: [newData] }, isLoading: false, isError: false, } as any)
            },
            onError: function (_error: string): void {
                setAllHomeData({ data: { sections: [] }, isLoading: false, isError: true, } as any)
            }
        })
    }
}