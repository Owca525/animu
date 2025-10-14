import React, { useState } from 'react'
import { useQuery } from 'react-query';
import './css/containerWrong.css'
import Button from '@renderer/components/buttons';
import { motion } from 'framer-motion';
import { t } from 'i18next';
import Card from '@renderer/pages/home/components/card';
import Input from '@renderer/components/input';
import Dropdown from '@renderer/components/dropDown';
import store from '@renderer/utils/store';
import { segregatePlugins } from '@renderer/utils/functions';
import { ChangePlugin } from '@renderer/utils/pluginApi';

interface containerwrongprops { 
    name: string,
    refetchfunc: (id?: string) => void,
    exitfunc: () => void,
}

const containerWrong: React.FC<containerwrongprops> = ({ name, exitfunc, refetchfunc }) => {
    const [searchName, setSearchName] = useState<string>(name)

    const { data: searchData, isError, isLoading, refetch } = useQuery({
        queryKey: [searchName],
        queryFn: async ({ queryKey }) => {
            const [name] = queryKey;
            if (store.getState().plugin.playerPlugin.player) return await store.getState().plugin.playerPlugin.player.searchAnime(name, 1)
            return []
        },
        refetchOnWindowFocus: false,
        staleTime: 2 * 60 * 60 * 1000,
        cacheTime: 2 * 60 * 60 * 1000
    });

    return (
        <div className='information-containerwrong-void'>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }} className='information-containerwrong'>
                <div className="information-containerwrong-top">
                    <Input placeholder={t("home.search")} defaultValue={name} onKeyDown={(text) => setSearchName(() => text)}/>
                    <Dropdown options={segregatePlugins((name) => {ChangePlugin(name); refetch()})} disableX buttonText={store.getState().plugin.playerPlugin.name}/>
                    {/* <Button icon='tune'/> */}
                </div>
                <div className="information-containerwrong-center">
                    <div className="information-containerwrong-text-space">{t("information.containerwrong.search", { name: searchName })}</div>
                </div>
                <div className="information-containerwrong-down">
                    {isError || !isLoading && searchData && searchData.length <= 0 &&
                        <div className="information-containerwrong-error-container">
                            <span className='material-symbols-outlined information-containerwrong-error-icon'>search_off</span>
                            <span className='information-containerwrong-error-text'>{t("home.nothingfound")}</span>
                        </div>
                    }
                    {isLoading && !isError && !searchData &&
                        <div className="information-containerwrong-error-container">
                            <span className='material-symbols-outlined information-containerwrong-loading-icon'>progress_activity</span>
                        </div>
                    }
                    {!isLoading && !isError && searchData && searchData.length > 0 &&
                        <div className="information-containerwrong-cards">
                            {searchData.map(card => <Card card={{ AnimeData: card.AnimeData, onClick: () => refetchfunc(card.AnimeData.player_ID) }} disableinformation />)}
                        </div>
                    }
                </div>
                
                <Button icon="arrow_back" ButtonClass="information-containerwrong-exit-button" onClick={exitfunc} />
            </motion.div>
        </div>
    )
}

export default containerWrong
