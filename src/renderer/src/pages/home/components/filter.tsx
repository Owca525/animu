import Dropdown from "@renderer/components/dropDown"
import "./css/Filter.css"
import Button from "@renderer/components/buttons"
import { FilterParams, genres } from "@renderer/utils/types"
import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { useI18n } from "@renderer/utils/i18n"
import { getHomeCache, setHomeSearchTags } from "@renderer/utils/stores/home"

interface filterProps {
    custonClass?: string,
    onChange: (params: FilterParams) => void,
    filter: genres[]
}

export default function Filter(props: filterProps) {
    const { t } = useI18n()

    const [showFilter, setShowFilter] = createSignal<boolean>(false)
    const [currentFilter, setCurrentFilter] = createSignal<FilterParams>()
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

    createEffect(() => {
        setCurrentFilter(getHomeCache().filterTags)
    })

    function updateGenres(key: string, value: string | undefined) {
        let params = getHomeCache().filterTags
        if (!params && !value) return
        if (!params && value != undefined) {
            setCurrentFilter({ [key]: value })
            setHomeSearchTags({ [key]: value })
            return
        }
        if (!params) return

        if (value == undefined) {
            delete params[key]
            setCurrentFilter(params)
            setHomeSearchTags(params)
            return
        }

        setCurrentFilter({ ...params, [key]: value })
        setHomeSearchTags({ ...params, [key]: value })
    }

    return (
        <>
            <Button ButtonClass={`home-filter-button ${props.custonClass}`} iconClassName="home-filter-button" icon="tune" onClick={() => setShowFilter((prev) => !prev)} />
            <Show when={showFilter()}>
                <div tabIndex={-1} class="home-filter-container home-filter-container-horizontal-new" ref={containerRef}>
                    <For each={props.filter}>
                        {(item) => (
                            <div class="home-filter-space">
                                <div class="home-filter-title">{t(item.title)}</div>
                                <Dropdown onClickX={() => updateGenres(item.type, undefined)}   
                                    buttonText={currentFilter() && currentFilter()![item.type] ? currentFilter()![item.type] : ""}
                                    options={item.options.map((val) => ({
                                        label: t(`${item.langPath}${val.toLowerCase().replaceAll(" ", "_")}`),
                                        onClick: () => updateGenres(item.type, val)
                                    }))}
                                    placeholder={t(item.placeholder)}
                                />
                            </div>
                        )}
                    </For>
                </div>
            </Show>
        </>
    )
}