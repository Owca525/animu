import Dropdown from "@renderer/components/dropDown"
import "./css/Filter.css"
import Button from "@renderer/components/buttons"
import { FilterParams, homeData } from "@renderer/utils/types"
import { createSignal, onCleanup, onMount, Show } from "solid-js"
import { getHomeCache } from "@renderer/utils/stores/home"
import { useI18n } from "@renderer/utils/i18n"

interface filterProps { custonClass?: string, onChange: (params?: FilterParams, removeParam?: string) => void, filter: { genres: string[], seasons: string[], years: string[], format: string[], statuses: string[] } }

// { onChange, filter, custonClass }
export default function Filter(props: filterProps) {
    const { t } = useI18n()
    
    const [showFilter, setShowFilter] = createSignal<boolean>(false)
    const homeCache: homeData = getHomeCache();
    let containerRef: HTMLDivElement | undefined;

    const handleClickOutside = (event: MouseEvent) => {
        let data = event.target as HTMLElement
        if (data.classList.contains("home-filter-button")) return
        if (containerRef && !containerRef.contains(event.target as Node)) {
            setShowFilter(false);
        }
    };

    onMount(() => {
        document.addEventListener('mousedown', handleClickOutside);
    })
    onCleanup(() => {
        document.removeEventListener('mousedown', handleClickOutside);
    })

    return (
        <>
            <Button ButtonClass={`home-filter-button ${props.custonClass}`} iconClassName="home-filter-button" icon="tune" onClick={() => setShowFilter((prev) => !prev)} />
            <Show when={showFilter()}>
                <div tabIndex={-1} class="home-filter-container home-filter-container-horizontal-new" ref={containerRef}>
                    <div class="home-filter-space">
                        <div class="home-filter-title">{t("filter.genres")}</div>
                        <Dropdown onClickX={() => props.onChange(undefined, "genres")} buttonText={homeCache.filterTags?.genres ? t(`anime_genres.${homeCache.filterTags.genres[0].toLowerCase().replaceAll(" ", "")}`) : ""} options={props.filter.genres.map((element) => { return { label: t(`anime_genres.${element.toLowerCase().replaceAll(" ", "")}`), onClick: () => props.onChange({ genres: [element] }) } })} placeholder={t("filter.placeholderGenres")} />
                    </div>
                    <div class="home-filter-space">
                        <div class="home-filter-title">{t("filter.year")}</div>
                        <Dropdown onClickX={() => props.onChange(undefined, "years")} buttonText={homeCache.filterTags?.years ? homeCache.filterTags.years : ""} options={props.filter.years.map((element) => { return { label: element, onClick: () => props.onChange({ years: element }) } })} placeholder={t("filter.placeholderYears")} />
                    </div>
                    <div class="home-filter-space">
                        <div class="home-filter-title">{t("filter.season")}</div>
                        <Dropdown onClickX={() => props.onChange(undefined, "seasons")} buttonText={homeCache.filterTags?.seasons ? t(`anime_seasons.${homeCache.filterTags.seasons.toLowerCase().replaceAll(" ", "")}`) : ""} options={props.filter.seasons.map((element) => { return { label: t(`anime_seasons.${element.toLowerCase().replaceAll(" ", "")}`), onClick: () => props.onChange({ seasons: element }) } })} placeholder={t("filter.placeholderSeason")} />
                    </div>
                    <div class="home-filter-space">
                        <div class="home-filter-title">{t("filter.format")}</div>
                        <Dropdown onClickX={() => props.onChange(undefined, "format")} buttonText={homeCache.filterTags?.format ? t(`anime_formats.${homeCache.filterTags.format[0].toLowerCase().replaceAll(" ", "_")}`) : ""} options={props.filter.format.map((element) => { return { label: t(`anime_formats.${element.toLowerCase().replaceAll(" ", "_")}`), onClick: () => props.onChange({ format: [element] }) } })} placeholder={t("filter.placeholderFormat")} />
                    </div>
                    <div class="home-filter-space">
                        <div class="home-filter-title">{t("filter.airing")}</div>
                        <Dropdown onClickX={() => props.onChange(undefined, "airing")} buttonText={homeCache.filterTags?.airing ? t(`anime_statuses.${homeCache.filterTags.airing.toLowerCase().replaceAll(" ", "_")}`) : ""} options={props.filter.statuses.map((element) => { return { label: t(`anime_statuses.${element.toLowerCase().replaceAll(" ", "_")}`), onClick: () => props.onChange({ airing: element }) } })} placeholder={t("filter.placeholderAiring")} />
                    </div>
                </div>
            </Show>
        </>
    )
}