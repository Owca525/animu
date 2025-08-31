import React from 'react'
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import './css/containerWrong.css'
import Button from '@renderer/components/buttons';
import { motion } from 'framer-motion';
import { t } from 'i18next';
import Card from '@renderer/pages/home/components/card';
import { cardData } from '@renderer/utils/GlobalInterface';

interface containerwrongprops {
    name: string,
    refetchfunc: any,
    exitfunc: any,
}

const containerWrong: React.FC<containerwrongprops> = ({ name, exitfunc, refetchfunc }) => {
    const pluginPlayer = useSelector((plugin: any) => plugin.plugin.playerPlugin);
    const func = async () => await pluginPlayer.player.animeList(name)
    const { data, isError, isLoading } = useQuery(
        [func.toString()],
        func,
        {
            refetchOnWindowFocus: false,
            cacheTime: 0,
        }
    );

    function buildContainer(cardata: cardData[]) {
        return (
            <div className='information-containerwrong-container'>
                <div className='information-containerwrong-title'>{t("information.containerwrong.title", { name: name })}</div>
                <div className="information-containerwrong-cards">
                    {cardata.map(card => <Card AnimeData={card.AnimeData} deletionCard={card.deletionCard} onClick={card.onClick} />)}
                </div>
            </div>
        )
    }

    return (
        <div className='information-containerwrong-void'>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }} className='information-containerwrong'>
                {isLoading == false && isError == false && data && buildContainer(data.map((anime) => {return {...anime, onClick: () => refetchfunc(pluginPlayer.player.animeDataList, anime.AnimeData.player_ID)}}))}
                {isLoading && <div className='information-containerwrong-loading'><span className='information-loading material-symbols-outlined'>progress_activity</span></div>}
                {isError && isLoading == false && <div className='information-containerwrong-error'><span className='material-symbols-outlined'>error</span>{t("home.error")}</div>}
                <Button icon="arrow_back" ButtonClass="information-containerwrong-exit-button" onClick={exitfunc} />
            </motion.div>
        </div>
    )
}

export default containerWrong
