import Dropdown from "@renderer/components/dropDown"
import "./css/Filter.css"
import Button from "@renderer/components/buttons"
import { FilterParams, genres } from "@renderer/utils/types"
import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { useI18n } from "@renderer/utils/i18n"
import { getHomeCache, setHomeSearchTags } from "@renderer/utils/stores/home"
import { unwrap } from "solid-js/store"

interface filterProps {
    custonClass?: string,
    onChange: (params: FilterParams | undefined) => void,
    filter: genres[]
}

export function updateGenres(key: string, value: string | undefined) {
    console.log(key)
    let params = unwrap(getHomeCache().filterTags)
    console.log(params)
    if (!params && !value) return
    if (!params && value != undefined) return setHomeSearchTags({ [key]: value })
    if (!params) return

    if (value == undefined) {
        delete params[key]
        setHomeSearchTags(params)
        return
    }

    setHomeSearchTags({ ...params, [key]: value })
}

export default function Filter(props: filterProps) {
    const { t, pathExist } = useI18n()

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
        const tmp = getHomeCache()
        setCurrentFilter(tmp.filterTags)
    })

    function checkWrapper(str: string, val: string) {
        if (pathExist(str)) return t(str)
        return val
    }

    return (
        <>
            <Button ButtonClass={`home-filter-button ${props.custonClass}`} iconClassName="home-filter-button" icon="tune" onClick={() => setShowFilter((prev) => !prev)} />
            <Show when={showFilter()}>
                <div tabIndex={-1} class="home-filter-container home-filter-container-horizontal-new" ref={containerRef}>
                    <For each={props.filter}>
                        {(item) => (
                            <div class="home-filter-space">
                                <div class="home-filter-title">{pathExist(item.title) ? t(item.title) : item.title}</div>
                                <Dropdown onClickX={() => {
                                    updateGenres(item.type, undefined);
                                    setCurrentFilter(unwrap(getHomeCache().filterTags))
                                    props.onChange(unwrap(currentFilter()))
                                }}
                                    buttonText={currentFilter() && currentFilter()![item.type] ?
                                        checkWrapper(`${item.langPath}${currentFilter()![item.type]}`, currentFilter()![item.type]) : ""}
                                    options={item.options.map((val) => ({
                                        label: checkWrapper(`${item.langPath}${val}`, val),
                                        onClick: () => {
                                            updateGenres(item.type, val)
                                            setCurrentFilter(unwrap(getHomeCache().filterTags))
                                            props.onChange(unwrap(currentFilter()))
                                        }
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