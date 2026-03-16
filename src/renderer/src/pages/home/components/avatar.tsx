import { t } from "@renderer/utils/i18n";
import "./css/avatar.css";
import icon from '@resources/icon.png';
import { createEffect, createSignal, For, Match, onMount, Switch } from "solid-js";
import { globalNavigate, LoginToAnilist, openUrlFolder } from "@renderer/utils/functions";
import { getAnilistUserData } from "@renderer/utils/stores/global";

interface avatarOptions {
  title?: string
  seperator?: boolean
  func?: () => any
}

export default function Avatar() {
  const [genereted, setGenerated] = createSignal<avatarOptions[]>([
    {
      title: "Anilist Settings",
      func: () => openUrlFolder("https://anilist.co/settings")
    },
    {
      seperator: true,
    },
    {
      title: "Animu Settings",
      func: () => globalNavigate("/settings")
    },
  ]);
  const [avatar, setAvatar] = createSignal<string>(icon);
  const [isDropDownUpdate, setDropDownUpdate] = createSignal<boolean>(false);

  onMount(async () => {
    const tmp = getAnilistUserData()
    if (tmp) {
      setAvatar(tmp["avatar"]["large"])
      setGenerated((prev) => ([
        {
          title: t("Open Profile"),
          func: () => openUrlFolder(`https://anilist.co/user/${tmp["name"]}/`)
        }, ...prev
      ]))
      setDropDownUpdate(true)
    } else {
      /* IFDEF DEBUG|PROD */
      const configAvatar = await window.api.getConfigAvatar()
      if (configAvatar) setAvatar(`data:${configAvatar.mime};base64,${configAvatar.data}`)
      /* ENDIF */
      setGenerated((prev) => ([
        {
          title: t("Login"),
          func: LoginToAnilist
        }, ...prev
      ]))
    }
  })

  createEffect(async () => {
    try {
      const tmp = getAnilistUserData()
      if (!tmp) {
        /* IFDEF DEBUG|PROD */
        const configAvatar = await window.api.getConfigAvatar()
        if (configAvatar) setAvatar(`data:${configAvatar.mime};base64,${configAvatar.data}`)
        /* ENDIF */
        return
      }
      setAvatar(tmp["avatar"]["large"])
      if (isDropDownUpdate()) return
      setGenerated((prev) => ([
        {
          title: t("Open Profile"),
          func: () => openUrlFolder(`https://anilist.co/user/${tmp["name"]}/`)
        }, ...prev
      ]))
    } catch (error) {
      console.error("createEffect/avatar Error", error)
    }
  })

  return (
    <main class="avatar-container">
      <img src={avatar()} class="avatar-main-icon" onerror={() => setAvatar(icon)}/>
      <div class="avatar-options-container">
        <For each={genereted()}>
          {(item) => <Switch>
            <Match when={item.seperator}>
              <span class="avatar-option-space"></span>
            </Match>
            <Match when={item.title}>
              <span class="avatar-option" onClick={item.func}>{t(item.title!)}</span>
            </Match>
          </Switch>
          }
        </For>
      </div>
    </main>
  );
}
