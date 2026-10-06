import { t } from "@renderer/utils/i18n";
import "./css/avatar.css";
import icon from '@resources/icon.png';
import { createSignal } from "solid-js";
import { animulistData, GetUser, GetUserAvatar, UpdateUserData } from "@renderer/utils/stores/global";
import { showCustomMenu } from "@renderer/utils/context/menuContext";
import Button from "@renderer/components/buttons";
import { DownloadIMGToBase64, openUrlFolder, User_Calculate_Watch_Time, User_Format_Time } from "@renderer/utils/functions";
import { UserData } from "@renderer/utils/types";
import Input from "@renderer/components/input";
import FilePicker from "@renderer/components/filePicker";
import { createStore } from "solid-js/store";
import { removeToast, toast } from "@renderer/utils/context/ToastNotification";
import { getInformationPlugin } from "@renderer/utils/stores/plugins";
import deeplink from "@renderer/utils/deeplinks";
import { showDialog } from "@renderer/utils/context/DialogContext";
import { SynchronizeAnimulistWithPlugin } from "@renderer/utils/FilesManager/animulist";

export default function Avatar() {
  const [avatar, setAvatar] = createSignal<string>(GetUserAvatar() ?? icon);

  return (
    <main class="avatar-container" onClick={() => showCustomMenu(User_Profile)}>
      <sheep-img src={avatar()} class="avatar-main-icon" onError={() => setAvatar(icon)} />
    </main>
  );
}

function GetBanner(user: UserData) {
  if (!user["banner"]) return {}

  if (user["banner"].startsWith("#")) return { "background-color": user["banner"] }

  return {
    "background-image": `url("${user["banner"]}")`
  }
}

export async function updateUser(user: UserData) {
  try {
    if (await window.api.user.change(JSON.parse(JSON.stringify(user)))) {
      UpdateUserData(user)
      toast(t("user.updated"), { type: "success" })
    } else {
      toast(t("user.failed_update"), { type: "error" })
    }
  } catch (error) {
    console.error("avatar/updateUser", error)
    toast(t("user.failed_update"), { type: "error" })
  }
}

export async function LoginToInformationPlugin() {
  const plugin = getInformationPlugin()

  if (!plugin["metadata"]["loginMethod"] || !plugin.login || !plugin.updateUser) return

  deeplink.add({
    name: plugin["metadata"]["name"],
    code: `${plugin["metadata"]["name"]}`.toLowerCase(),
    func: async function (content: string) {
      deeplink.remove(plugin["metadata"]["name"])

      const response = await plugin.login!({ code: content })

      updateUser({
        ...GetUser(),
        logged: true
      })

      const animuUser = GetUser()

      showDialog({
        type: "info",
        title: t("global.action"),
        description: t(`user.overwrite_profile`, { plugin: plugin["metadata"]["name"] }),

        onExit: () => {
          showDialog({
            type: "info",
            title: t("global.action"),
            description: t(`user.overwrite_animulist`, { plugin: plugin["metadata"]["name"] }),
            buttons: [{
              title: t(`user.button_overwrite_plugin`, { plugin: plugin["metadata"]["name"] }),
              onClick: async () => {
                SynchronizeAnimulistWithPlugin(true)
              }
            }, {
              title: t("user.button_overwrite_animulist"),
              onClick: SynchronizeAnimulistWithPlugin
            }]
          })
        },

        buttons: [{
          title: t("user.overwrite_animu"),
          onClick: async () => {
            await updateUser({
              ...response!,
              created_date: animuUser["created_date"],
              animu_time: window["animu_timer"],
              banner: await DownloadIMGToBase64(response!["banner"]),
              avatar: await DownloadIMGToBase64(response!["avatar"])
            })
          }
        }, {
          title: t(`user.overwrite_plugin`, { plugin: plugin["metadata"]["name"] }),
          onClick: async () => {
            const id = toast(t(`user.updateProfile`, { plugin: plugin["metadata"]["name"] }), { type: "loading", timer: false })

            try {
              const resp = await plugin.updateUser!(animuUser)
              removeToast(id)

              if (resp) toast(t(`user.updateProfile_success`, { plugin: plugin["metadata"]["name"] }), { type: "success" })
              else toast(t(`user.updateProfile_failed`, { plugin: plugin["metadata"]["name"] }), { type: "error" })
            } catch (error) {
              toast(t(`user.updateProfile_failed`, { plugin: plugin["metadata"]["name"] }), { type: "error" })
            }
          }
        }]
      })
    }
  })

  openUrlFolder(plugin["metadata"]["loginMethod"]["deepLinkurl"])
}

export async function LoginOut() {
  const plugin = getInformationPlugin()

  if (!plugin.unLogin) return console.error("Failed Log out beacuse missing functions")

  const resp = await plugin.unLogin()
  if (typeof resp == "object") {
    updateUser({
      ...GetUser(),
      logged: false
    })

    openUrlFolder(resp["redirect"])
    return
  }

  if (resp) {
    toast(t(`Sucessfully Logout from ${plugin["metadata"]["name"]}`), { type: "success" })
    updateUser({
      ...GetUser(),
      logged: false
    })
  } else {
    toast(t(`Failed Logout from ${plugin["metadata"]["name"]}`), { type: "success" })
  }
}

export function User_Profile() {
  const user = GetUser()
  const [avatar, setAvatar] = createSignal<string>(user["avatar"] ?? icon);
  const plugin = getInformationPlugin()

  return (
    <main class="user-profile-container">
      <Button icon="edit" ButtonClass="user-profile-edit-button" iconClassName="user-profile-edit-button-icon" onClick={() => showCustomMenu(Edit_User_Profile)} />
      <div class="user-profile-banner" style={GetBanner(user)}></div>

      <div class="user-profile-content">

        <sheep-img src={avatar()} class="user-profile-avatar" onError={() => setAvatar(icon)} />

        <div class="user-profile-top">
          <div class="user-profile-texts">

            <span class="user-profile-name">{user["username"]}</span>
            <span class="user-profile-description">{user["description"] || (user["description"] != undefined && user["description"].length > 0) ? user["description"] : t("information.descriptionnotfound")}</span>

          </div>

          <Button
            content={user.logged ? t(`Login Out From ${plugin.metadata["name"]}`) : t(`Login To ${plugin.metadata["name"]}`)}
            ButtonClass={`user-profile-button ${user.logged ? "red" : ""}`}
            onClick={user.logged ? LoginOut : LoginToInformationPlugin}
          />
        </div>

      </div>

      <div class="user-profile-bottom">
        <User_statistic
          icon="movie"
          text={`${animulistData().values().toArray().filter((v) => v["animulist"]["status"] == "COMPLETED").length}`}
          header={t("user.completed_anime")}
        />

        <User_statistic
          icon="format_list_bulleted"
          text={`${animulistData().size}`}
          header={t("user.animulist_entries")}
        />

        <User_statistic
          icon="video_library"
          text={`${User_Calculate_Watch_Time()}m`}
          header={t("user.watch_time")}
        />

        <User_statistic
          icon="alarm"
          text={User_Format_Time(window["animu_timer"])}
          header={t("user.time_animu")}
        />
      </div>
    </main>
  )
}

function User_statistic(content: { icon: string, text: string, header: string }) {
  return (
    <div class="user-static-container">

      <span class="user-static-top">{content["header"]}</span>

      <span class="user-static-content">

        <span class="material-symbols-outlined user-static-icon">{content["icon"]}</span>
        <span class="user-static-text">{content["text"]}</span>

      </span>
    </div>
  )
}

export function Edit_User_Profile() {

  const [user, setUser] = createStore<UserData>(JSON.parse(JSON.stringify(GetUser())));

  return (
    <main class="edit-user-profile-container">
      <span>{t("user.edit_user")}</span>

      <span class="edit-profile-span">
        {t("user.username")}
        <Input defaultValue={user.username} onInput={(text) => setUser({ username: text })} />
      </span>

      <span class="edit-profile-span">
        {t("user.description")}
        <Input defaultValue={user.description} onInput={(text) => setUser({ description: text })} />
      </span>

      <span class="edit-profile-span">
        {t("user.avatar")}
        <Input defaultValue={user.avatar} />

        <FilePicker acceptFormat="image/*" onFileSelect={(file) => setUser({ avatar: file.content_base64 })} />
      </span>

      <span class="edit-profile-span">
        {t("user.banner")}
        <Input defaultValue={user.banner} />

        <FilePicker acceptFormat="image/*" onFileSelect={(file) => {
          setUser({ banner: file.content_base64 })
        }} />
      </span>

      <Button content={t("user.update_user")} onClick={() => updateUser(user)} />
    </main>
  )
}