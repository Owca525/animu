import { getEpisodeDay, getGradientColor, getHistory } from '@renderer/utils/functions';
import { cardData, indentityPlayer } from '@renderer/utils/types';
import "./css/bigcard.css"
import Button from '@renderer/components/buttons';
import { useNavigate } from '@solidjs/router';
import { Component, createSignal, For, Show } from 'solid-js';
import { useI18n } from '@renderer/utils/i18n';
import { pluginManager } from '@renderer/utils/stores/plugins';
import { removeToast, toast, updateToast } from '@renderer/utils/context/ToastNotification';
import { animulistData } from '@renderer/utils/stores/global';
import { unwrap } from 'solid-js/store';

type bigCardProps = { data: cardData, ref?: any }

const BigCard: Component<bigCardProps> = ({ data, ref }) => {
    const { t } = useI18n()
    const navigate = useNavigate();

    const [isImageLoading, setLoadingImage] = createSignal<boolean>(true)
    const [isImageError, setErrorImage] = createSignal<boolean>(false)

    function formatEpisode(): string {
        if (!data.AnimeData.nextAiringEpisode) return ""
        if (data.AnimeData.nextAiringEpisode.episode == 1) return "1"
        return (data.AnimeData.nextAiringEpisode.episode - 1).toString()
    }

    function openInformation() {
        const animulist = unwrap(animulistData())
        const tmp = animulist.find((v) => v.AnimeData.id == data.AnimeData.id)
        localStorage.setItem("informationCache", JSON.stringify({ anime: data.AnimeData, animulist: tmp ? tmp.animulist : undefined }))
        navigate("/info");
    }

    async function goToPlayer(saveData?: indentityPlayer, id?: string): Promise<any> {
        let plugin = pluginManager().currentPlugin
        if (saveData) plugin = pluginManager().changePlugin(saveData.pluginName)
        if (!plugin) return toast(t("notification.failedplugin"), { type: "error" })
        
        const idToast = toast(t("notification.fetchinganime"), { type: "loading", removeTimer: true })
        if (!saveData && !id) {
            const response = await plugin.extractEpisodeList(data.AnimeData)
            if (!response || response.episodesData.length <= 0) return updateToast(idToast, t("notification.failedanime"), { type: "error", removeTimer: false })
            localStorage.setItem("playerCache", JSON.stringify({
                data: {
                    ...data.AnimeData,
                    player_ID: response.player_id
                },
                save: {
                    last_Time: 0,
                    type: response.episodesData[0].type,
                    pluginName: plugin.metadata.name,
                    episode: response.episodesData[0].episodes[0].ep
                },
                episodelist: response.episodesData[0].episodes,
                continewatch: true,
            }))
        }
        if (saveData && id) {
            const episodeList = await plugin.extractOnlyEpisodesList(saveData.type, id);
            if (episodeList.length <= 0) {
                updateToast(idToast, t("notification.failedepisodes"), { type: "error", removeTimer: false })
                return
            }

            localStorage.setItem("playerCache", JSON.stringify({
                data: {
                    ...data.AnimeData,
                    player_ID: id,
                },
                save: saveData,
                episodelist: episodeList,
                continewatch: true,
            }))
        }
        
        removeToast(idToast)
        navigate("/player")
    }

    function generateButton() {
        if (data.AnimeData.status && data.AnimeData.status.toUpperCase().replaceAll(" ", "_") == "NOT_YET_RELEASED") return <></>
        const history = getHistory()
        const animeContinue = history.continue.find((value) => value.AnimeData.id == data.AnimeData.id)
        const historyContinue = history.history.find((value) => value.AnimeData.id == data.AnimeData.id)
        let airing = data.AnimeData.nextAiringEpisode ? data.AnimeData.nextAiringEpisode.episode : 0

        try {
            if (!animeContinue && !historyContinue) return <Button content={t("home.bigcard.now")} ButtonClass='big-card-button' onClick={() => goToPlayer()} />
            if (animeContinue) return <Button content={t("history.continue", { ep: animeContinue.saveData?.episode })} ButtonClass='big-card-button' onClick={() => goToPlayer(animeContinue.saveData, animeContinue.AnimeData.player_ID)} />
            if (historyContinue && parseInt(historyContinue.saveData.episode!) <= historyContinue.AnimeData.episodes! && airing < parseInt(historyContinue.saveData.episode!)) {
                return <Button content={t("home.bigcard.start", { ep: parseInt(historyContinue.saveData.episode!)+1 })} ButtonClass='big-card-button' onClick={() => goToPlayer({...historyContinue.saveData, episode: `${parseInt(historyContinue.saveData.episode!)+1}`} as indentityPlayer, historyContinue.AnimeData.player_ID)} />
            }
        } catch (error) {}
        return <></>
    }

    return (
        <div class="big-card-content" ref={ref} style={{ "background-image": `url(${data.AnimeData.bannerImage ?? data.AnimeData.coverImage})` }}>
            <div class={`big-card-background ${!data.AnimeData.bannerImage ? "big-card-blur" : ""}`}>
                <div class="big-card-information">
                    <div class="big-card-information-image-container">
                        <img src={data.AnimeData.coverImage} onload={() => setLoadingImage(false)} onerror={() => setErrorImage(true)} class={`card-image big-card-information-image ${isImageLoading() ? "hidden" : ""}`} />
                        <Show when={isImageLoading() || isImageError()}>
                            <div class='big-card-image-placehorder-container'>
                                <Show when={isImageLoading()}>
                                    <span class='material-symbols-outlined loading-animation'>progress_activity</span>
                                </Show>
                                <Show when={isImageError()}>
                                    <span class='material-symbols-outlined'>error</span>
                                </Show>
                            </div>
                        </Show>
                        <Show when={data.AnimeData.averageScore}>
                            <div class="big-card-information-score" style={{ border: `3px solid ${getGradientColor(data.AnimeData.averageScore)}` }}>
                                {data.AnimeData.averageScore}%
                            </div>
                        </Show>
                    </div>
                    <div class="big-card-information-content">
                        <div class="big-card-information-title">{data.AnimeData.title.romaji}</div>
                        <div class="big-card-information-genres-content">
                            <Show when={data.AnimeData.genres}>
                                <For each={data.AnimeData.genres}>
                                    {(value) => (<div class="big-card-information-genres">{t(`anime_genres.${value.toLowerCase().replaceAll(" ", "")}`)}</div>)}
                                </For>
                            </Show>
                        </div>
                        <div class="big-card-information-others">
                            <Show when={data.AnimeData.format}>
                                <div class="big-card-information-format">{t(`anime_formats.${data.AnimeData.format?.toLowerCase()}`)}</div>
                            </Show>
                            <Show when={data.AnimeData.status}>
                                <div class="big-card-information-status">{t(`anime_statuses.${data.AnimeData.status?.toLowerCase()}`)}</div>
                            </Show>
                            <Show when={data.AnimeData.episodes}>
                                <div class="big-card-information-episode">{formatEpisode() != "" ? `${formatEpisode()} /` : ""} {data.AnimeData.episodes} {t("home.bigcard.episodes")}</div>
                            </Show>
                        </div>
                        <div class="big-card-information-bottom">
                            {generateButton()}
                            <Button content={t("home.bigcard.information")} ButtonClass='big-card-button' onClick={openInformation} />
                            <Show when={data.AnimeData.nextAiringEpisode}>
                                <div class="big-card-information-date">{getEpisodeDay(data.AnimeData.nextAiringEpisode?.timeUntilAiring!, data.AnimeData.nextAiringEpisode?.episode!)}</div>
                            </Show>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BigCard;