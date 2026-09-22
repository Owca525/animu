import Button from './buttons';
import Dropdown from '@renderer/components/dropDown';
import Input from './input';
import { AnimeData, animulistProps } from '@renderer/utils/types';
import { Component } from 'solid-js';
import { dateToUnix, detectTitleConfig, unixToDateTime } from '@renderer/utils/functions';
import { createStore } from 'solid-js/store';
import { t } from '@renderer/utils/i18n';
import { hideCustomMenu } from '@renderer/utils/context/menuContext';

import "./css/animulistmenu.css"
import { SheepShortcut } from '@renderer/utils/hooks/useKeyPress';

interface AnimulistProps {
    anime: AnimeData
    animulist?: animulistProps
    save: (animulist: animulistProps, anime: AnimeData) => void
}

const AnimulistMenu: Component<AnimulistProps> = (props) => {

    const [animulistTMPData, setTMPAnimulist] = createStore<animulistProps>(props.animulist ?? {
        status: "CURRENT",
        score: 0,
        reapeat: 0,
        added: 0,
        lastUpdate: 0
    });

    function ExitFromEditor() {
        hideCustomMenu()
        props.save(animulistTMPData, props["anime"])
    }

    SheepShortcut(["ctrl", "S"], ExitFromEditor)

    return (
        <div class='animulist-menu-container'>
            <div 
                class={`animulist-menu-banner ${props["anime"]["bannerImage"] ? "" : "blur"}`} 
                style={{ "background-image": `url("${props["anime"]["bannerImage"] ?? props["anime"]["coverImage"]}")` }}>    
            </div>

            <div class='animulist-menu-top'>
                <sheep-img src={props["anime"]["coverImage"]} class='animulist-menu-image'/>

                <span class='animulist-menu-title'>
                    {detectTitleConfig(props.anime["title"])}
                </span>

                <Button content='Save' ButtonClass='animulist-menu-button' onClick={ExitFromEditor}/>
            </div>

            <div class='animulist-menu-bottom'>
                <span class='animulist-menu-options'>
                    {t("Status")}
                    <Dropdown
                        disableX
                        buttonText={t(`animulist.status.${animulistTMPData.status}`)}
                        options={["CURRENT", "PLANNING", "COMPLETED", "REPEATING", "DROPPED", "PAUSED"].map((v) => ({
                            label: t(`animulist.status.${v}`),
                            onClick: () => setTMPAnimulist({ status: v as any })
                        }))} />
                </span>

                <span class='animulist-menu-options'>
                    {t("Score")}
                    <Input type="number" 
                        defaultValue={Number(animulistTMPData.score).toString()} 
                        onInput={(v) => { setTMPAnimulist({ score: parseInt(v) }) }}
                        InputClass='animulist-menu-input'
                    />
                </span>

                <span class='animulist-menu-options'>
                    {t("Rewatch Number")}
                    <Input type="number" 
                        defaultValue={Number(animulistTMPData.reapeat).toString()} 
                        onInput={(v) => setTMPAnimulist({ reapeat: parseInt(v) })}
                        InputClass='animulist-menu-input'
                    />
                </span>

                <span class='animulist-menu-options'>
                    {t("Start Date")}
                    <Input type="date"
                        defaultValue={Number(animulistTMPData["startWatch"]) > 0 ? unixToDateTime(animulistTMPData.startWatch).split(" ")[0] : undefined}
                        onInput={(v) => setTMPAnimulist({ startWatch: dateToUnix(v) })}
                        InputClass='animulist-menu-input'
                    />
                </span>

                <span class='animulist-menu-options'>
                    {t("Finish Date")}
                    <Input type="date"
                        defaultValue={Number(animulistTMPData["endWatch"]) > 0 ? unixToDateTime(animulistTMPData.endWatch).split(" ")[0] : undefined}
                        onInput={(v) => setTMPAnimulist({ endWatch: dateToUnix(v) })}
                        InputClass='animulist-menu-input'
                    />
                </span>
            </div>
        </div>
    );
};

export default AnimulistMenu;
