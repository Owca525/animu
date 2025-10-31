import Dropdown from "@renderer/components/dropDown"
import "./css/Filter.css"
import Button from "@renderer/components/buttons"
import { t } from "i18next"
import { FilterParams, homeData } from "@renderer/utils/types"
import { Component, createSignal, onCleanup, onMount, Show } from "solid-js"
import { getHomeCache } from "@renderer/utils/stores/home"

const Filter: Component<{ custonClass?: string, onChange: (params?: FilterParams, removeParam?: string) => void, filter: { genres: string[], seasons: string[], years: string[], format: string[], statuses: string[] } }> = ({ onChange, filter, custonClass }) => {
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
            <Button ButtonClass={`home-filter-button ${custonClass}`} iconClassName="home-filter-button" icon="tune" onClick={() => setShowFilter((prev) => !prev)} />
            <Show when={showFilter()}>
                <div tabIndex={-1} class="home-filter-container home-filter-container-horizontal-new" ref={containerRef}>
                    <div class="home-filter-space">
                        <div class="home-filter-title">{t("filter.genres")}</div>
                        <Dropdown onClickX={() => onChange(undefined, "genres")} buttonText={homeCache.filterTags?.genres ? t(`anime_genres.${homeCache.filterTags.genres[0].toLowerCase().replaceAll(" ", "")}`) : ""} options={filter.genres.map((element) => { return { label: t(`anime_genres.${element.toLowerCase().replaceAll(" ", "")}`), onClick: () => onChange({ genres: [element] }) } })} placeholder={t("filter.placeholderGenres")} />
                    </div>
                    <div class="home-filter-space">
                        <div class="home-filter-title">{t("filter.year")}</div>
                        <Dropdown onClickX={() => onChange(undefined, "years")} buttonText={homeCache.filterTags?.years ? homeCache.filterTags.years : ""} options={filter.years.map((element) => { return { label: element, onClick: () => onChange({ years: element }) } })} placeholder={t("filter.placeholderYears")} />
                    </div>
                    <div class="home-filter-space">
                        <div class="home-filter-title">{t("filter.season")}</div>
                        <Dropdown onClickX={() => onChange(undefined, "seasons")} buttonText={homeCache.filterTags?.seasons ? t(`anime_seasons.${homeCache.filterTags.seasons.toLowerCase().replaceAll(" ", "")}`) : ""} options={filter.seasons.map((element) => { return { label: t(`anime_seasons.${element.toLowerCase().replaceAll(" ", "")}`), onClick: () => onChange({ seasons: element }) } })} placeholder={t("filter.placeholderSeason")} />
                    </div>
                    <div class="home-filter-space">
                        <div class="home-filter-title">{t("filter.format")}</div>
                        <Dropdown onClickX={() => onChange(undefined, "format")} buttonText={homeCache.filterTags?.format ? t(`anime_formats.${homeCache.filterTags.format[0].toLowerCase().replaceAll(" ", "_")}`) : ""} options={filter.format.map((element) => { return { label: t(`anime_formats.${element.toLowerCase().replaceAll(" ", "_")}`), onClick: () => onChange({ format: [element] }) } })} placeholder={t("filter.placeholderFormat")} />
                    </div>
                    <div class="home-filter-space">
                        <div class="home-filter-title">{t("filter.airing")}</div>
                        <Dropdown onClickX={() => onChange(undefined, "airing")} buttonText={homeCache.filterTags?.airing ? t(`anime_statuses.${homeCache.filterTags.airing.toLowerCase().replaceAll(" ", "_")}`) : ""} options={filter.statuses.map((element) => { return { label: t(`anime_statuses.${element.toLowerCase().replaceAll(" ", "_")}`), onClick: () => onChange({ airing: element }) } })} placeholder={t("filter.placeholderAiring")} />
                    </div>
                </div>
            </Show>
        </>
    )
}

export default Filter
