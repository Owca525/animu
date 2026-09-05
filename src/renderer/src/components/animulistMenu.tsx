import Button from './buttons';
import Dropdown from '@renderer/components/dropDown';
import Input from './input';
import { AnimeData, animulistProps } from '@renderer/utils/types';
import { Component, createSignal, onMount, Show } from 'solid-js';
import { dateToUnix, unixToDateTime } from '@renderer/utils/functions';
import { unwrap } from 'solid-js/store';
import { t } from '@renderer/utils/i18n';
import { hideCustomMenu } from '@renderer/utils/context/menuContext';

interface AnimulistProps {
    anime: AnimeData
    animulist?: animulistProps
    save: (animulist: animulistProps, anime: AnimeData) => void
}

const AnimulistMenu: Component<AnimulistProps> = (props) => {

    const [animulistTMPData, setTMPAnimulist] = createSignal<animulistProps>({
        status: "CURRENT",
        score: 0,
        reapeat: 0,
        added: 0,
        lastUpdate: 0
    });

    function setAnimulistNewData(data: { [key: string]: number | string }) {
        setTMPAnimulist((v) => ({ ...v, ...data }))
    }

    onMount(() => {
        if (props.animulist) setTMPAnimulist(props.animulist)
    })

    return (
        <div class="custom-menu-box">
            <span class="custom-menu-content-title">{t(props.anime.title.romaji)}</span>
            <div class="custom-menu-content">
                <Show when={animulistTMPData()}>
                    <div class="custom-menu-space">
                        Status
                        <Dropdown disableX buttonText={t(`animulist.status.${animulistTMPData()?.status}`)} options={["CURRENT", "PLANNING", "COMPLETED", "REPEATING", "DROPPED", "PAUSED"].map((v) => ({ label: t(`animulist.status.${v}`), onClick: () => setAnimulistNewData({ status: v }) }))} />
                    </div>
                    <div class="custom-menu-space">
                        Score
                        <Input type={"number"} defaultValue={Number(animulistTMPData()?.score).toString()} onInput={(v) => { setAnimulistNewData({ score: parseInt(v) }) }} />
                    </div>
                    <div class="custom-menu-space">
                        Rewatch Number
                        <Input type={"number"} defaultValue={Number(animulistTMPData()?.reapeat).toString()} onInput={(v) => setAnimulistNewData({ reapeat: parseInt(v) })} />
                    </div>
                    <div class="custom-menu-space">
                        Start Date
                        <Input type={"date"}
                            defaultValue={parseInt(animulistTMPData()["startWatch"] as any) > 0 ? unixToDateTime(animulistTMPData().startWatch).split(" ")[0] : undefined}
                            onInput={(v) => setAnimulistNewData({ startWatch: dateToUnix(v) })}
                        />
                    </div>
                    <div class="custom-menu-space">
                        Finish Date
                        <Input type={"date"}
                            defaultValue={parseInt(animulistTMPData()["endWatch"] as any) > 0 ? unixToDateTime(animulistTMPData().endWatch).split(" ")[0] : undefined}
                            onInput={(v) => setAnimulistNewData({ endWatch: dateToUnix(v) })}
                        />
                    </div>
                    <div class="custom-menu-space">
                        Save To Animulist
                        <Button content="Save" onClick={() => {
                            props.save({ ...unwrap(animulistTMPData()), lastUpdate: dateToUnix(new Date().toString()), added: dateToUnix(new Date().toString()) } as any,
                                { ...props.anime, nextAiringEpisode: undefined });
                            hideCustomMenu()
                        }} />
                    </div>
                </Show>
            </div>
        </div>
    );
};

export default AnimulistMenu;
