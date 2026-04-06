import Button from './buttons';
import Dropdown from '@renderer/components/dropDown';
import Input from './input';
import { AnimeData, animulistProps } from '@renderer/utils/types';
import { Component, createSignal, onMount, Show } from 'solid-js';
import { dateToUnix, unixToDateTime } from '@renderer/utils/functions';
import { unwrap } from 'solid-js/store';
import { t } from '@renderer/utils/i18n';
import { hideCustomMenu } from '@renderer/utils/context/menuContext';

interface ClipMenuProps {

}

const ClipMenu: Component<ClipMenuProps> = (props) => {
    return (
        <div class="custom-menu-box">
            <span class="custom-menu-content-title">{t("Edit Clip")}</span>
            <div class="custom-menu-content">

            </div>
        </div>
    );
};

export default ClipMenu;
