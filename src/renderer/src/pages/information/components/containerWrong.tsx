import './css/containerWrong.css';
import Button from '@renderer/components/buttons';
import Card from '@renderer/pages/home/components/card';
import Input from '@renderer/components/input';
import Dropdown from '@renderer/components/dropDown';
import { segregatePlugins } from '@renderer/utils/functions';
import { Component, createSignal, For, onMount, Show } from 'solid-js';
import { useQuery } from '@tanstack/solid-query';
import { getPlayerPLugin, pluginManager } from '@renderer/utils/stores/plugins';
import { useI18n } from '@renderer/utils/i18n';

interface ContainerWrongProps {
    name: string;
    refetchfunc: (id?: string) => void;
    exitfunc: () => void;
}

const ContainerWrong: Component<ContainerWrongProps> = ({ name, exitfunc, refetchfunc }) => {
    const { t } = useI18n()
    
    const [searchName, setSearchName] = createSignal(name);
    let containerRef: HTMLDialogElement | undefined

    onMount(() => {
        if (containerRef) containerRef.showModal()
    })

    const response = useQuery(() => ({
        queryKey: [searchName()],
        queryFn: async ({ queryKey }) => {
            const [name] = queryKey;
            let plugin = getPlayerPLugin()
            if (plugin)
                return await plugin.searchAnime(name, 1);
            return [];
        },
        refetchOnWindowFocus: false,
        staleTime: 2 * 60 * 60 * 1000,
        cacheTime: 2 * 60 * 60 * 1000
    }))

    return (
        <dialog class='information-containerwrong' ref={containerRef}>
            <div class="information-containerwrong-top">
                <Input
                    placeholder={t("home.search")}
                    defaultValue={name}
                    onKeyDown={(text) => setSearchName(text)}
                />
                <Dropdown
                    options={segregatePlugins((name) => { pluginManager().changePlugin(name); response.refetch(); })}
                    disableX
                    buttonText={getPlayerPLugin()?.metadata.name}
                />
                {/* <Button icon='tune'/> */}
            </div>

            <div class="information-containerwrong-center">
                <div class="information-containerwrong-text-space">
                    {t("information.containerwrong.search", { name: searchName() })}
                </div>
            </div>

            <div class="information-containerwrong-down">
                <Show when={response.isError || (!response.isLoading && response.data && response.data.length <= 0)}>
                    <div class="information-containerwrong-error-container">
                        <span class='material-symbols-outlined information-containerwrong-error-icon'>search_off</span>
                        <span class='information-containerwrong-error-text'>{t("home.nothingfound")}</span>
                    </div>
                </Show>

                <Show when={response.isLoading && !response.isError && !response.data}>
                    <div class="information-containerwrong-error-container">
                        <span class='material-symbols-outlined information-containerwrong-loading-icon'>progress_activity</span>
                    </div>
                </Show>

                <Show when={!response.isLoading && !response.isError && response.data && response.data.length > 0}>
                    <div class="information-containerwrong-cards">
                        <For each={response.data}>
                            {(card) => (
                                <Card
                                    card={{ AnimeData: card.AnimeData, onClick: () => refetchfunc(card.AnimeData.player_ID) }}
                                    disableinformation
                                />
                            )}
                        </For>
                    </div>
                </Show>
            </div>

            <Button
                icon="arrow_back"
                ButtonClass="information-containerwrong-exit-button"
                onClick={exitfunc}
            />
        </dialog>
    );
};

export default ContainerWrong;
