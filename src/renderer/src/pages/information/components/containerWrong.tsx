import React from 'react'
import Container from '../../home/components/container'
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import './css/containerWrong.css'
import Button from '@renderer/components/buttons';

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

    console.log(data, name)

    return (
        <div className='information-containerwrong-void'>
            <div className='information-containerwrong'>
                {isLoading == false && isError == false && data && <Container title={`Anime Found For name: ${name}`} data={data.map((anime) => {return {...anime, onClick: () => refetchfunc(anime.AnimeData.player_ID)}})} />}
                {isLoading && <div className='information-containerwrong-loading'><span className='information-loading material-symbols-outlined'>progress_activity</span></div>}
                {isError && isLoading == false && <div className='information-containerwrong-error'><span className='material-symbols-outlined'>error</span>Error Accured</div>}
                <Button icon="arrow_back" ButtonClass="information-containerwrong-exit-button" onClick={exitfunc} />
            </div>
        </div>
    )
}

export default containerWrong
