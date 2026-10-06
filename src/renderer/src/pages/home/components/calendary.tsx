import { t } from "@renderer/utils/i18n";
import "./css/calendary.css";
import { WeekDataFormat } from "@renderer/utils/types";
import { For } from "solid-js";
import Card from "./card";

export default function Calendary(props: WeekDataFormat) {

    return (
        <main class="calendary-main-container">
            <div class="calendary-card-container">
                <span class="calendary-header">{t("week.monday")}</span>
                <For each={props["monday"]}>
                    {(card) => (
                        <Card card={card}/>
                    )}
                </For>
            </div>

            <div class="calendary-card-container">
                <span class="calendary-header">{t("week.tuesday")}</span>
                <For each={props["tuesday"]}>
                    {(card) => (
                        <Card card={card}/>
                    )}
                </For>
            </div>

            <div class="calendary-card-container">
                <span class="calendary-header">{t("week.wednesday")}</span>
                <For each={props["wednesday"]}>
                    {(card) => (
                        <Card card={card}/>
                    )}
                </For>
            </div>

            <div class="calendary-card-container">
                <span class="calendary-header">{t("week.thursday")}</span>
                <For each={props["thursday"]}>
                    {(card) => (
                        <Card card={card}/>
                    )}
                </For>
            </div>

            <div class="calendary-card-container">
                <span class="calendary-header">{t("week.friday")}</span>
                <For each={props["friday"]}>
                    {(card) => (
                        <Card card={card}/>
                    )}
                </For>
            </div>

            <div class="calendary-card-container">
                <span class="calendary-header">{t("week.saturday")}</span>
                <For each={props["saturday"]}>
                    {(card) => (
                        <Card card={card}/>
                    )}
                </For>
            </div>

            <div class="calendary-card-container">
                <span class="calendary-header">{t("week.sunday")}</span>
                <For each={props["sunday"]}>
                    {(card) => (
                        <Card card={card}/>
                    )}
                </For>
            </div>
        </main>
    );
}
