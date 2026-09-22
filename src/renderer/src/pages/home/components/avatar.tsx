import { t } from "@renderer/utils/i18n";
import "./css/avatar.css";
import icon from '@resources/icon.png';
import { createSignal } from "solid-js";
import { animulistData, GetUser, GetUserAvatar, UpdateUserData } from "@renderer/utils/stores/global";
import { showCustomMenu } from "@renderer/utils/context/menuContext";
import Button from "@renderer/components/buttons";
import { User_Calculate_Watch_Time, User_Format_Time } from "@renderer/utils/functions";
import { UserData } from "@renderer/utils/types";
import Input from "@renderer/components/input";
import FilePicker from "@renderer/components/filePicker";
import { createStore } from "solid-js/store";
import { toast } from "@renderer/utils/context/ToastNotification";

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

export function User_Profile() {
  const user = GetUser()
  const [avatar, setAvatar] = createSignal<string>(user["avatar"] ?? icon);

  return (
    <main class="user-profile-container">
      <Button icon="edit" ButtonClass="user-profile-edit-button" iconClassName="user-profile-edit-button-icon" onClick={() => showCustomMenu(Edit_User_Profile)} />
      <div class="user-profile-banner" style={GetBanner(user)}></div>

      <div class="user-profile-content">

        <sheep-img src={avatar()} class="user-profile-avatar" onError={() => setAvatar(icon)} />

        <div class="user-profile-top">
          <div class="user-profile-texts">

            <span class="user-profile-name">{user["username"]}</span>
            <span class="user-profile-description">{user["description"] || user["description"]!.length > 0 ? user["description"] : t("information.descriptionnotfound")}</span>

          </div>

          <Button content="Login To Anilist" ButtonClass="user-profile-button" />
        </div>

      </div>

      <div class="user-profile-bottom">
        <User_statistic
          icon="movie"
          text={`${animulistData().values().toArray().filter((v) => v["animulist"]["status"] == "COMPLETED").length}`}
          header={t("Completed Anime")}
        />

        <User_statistic
          icon="format_list_bulleted"
          text={`${animulistData().size}`}
          header={t("Animulist Entries")}
        />

        <User_statistic
          icon="video_library"
          text={`${User_Calculate_Watch_Time()}m`}
          header={t("Watch Time")}
        />

        <User_statistic
          icon="alarm"
          text={User_Format_Time(window["animu_timer"])}
          header={t("Time In Animu")}
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

  async function updateUser() {
    try {
      if (await window.api.user.change(JSON.parse(JSON.stringify(user)))) {
        UpdateUserData(user)
        toast(t("Succesfully Updated User Data"), { type: "success" })
      } else {
        toast(t("Failed Update User Data"), { type: "error" })
      }
    } catch (error) {
      console.error("avatar/updateUser", error)
      toast(t("Failed Update User Data"), { type: "error" })
    }
  }

  return (
    <main class="edit-user-profile-container">
      <span>Edit User Profile</span>

      <span class="edit-profile-span">
        User Name
        <Input defaultValue={user.username} onInput={(text) => setUser({ username: text })} />
      </span>

      <span class="edit-profile-span">
        Description
        <Input defaultValue={user.description} onInput={(text) => setUser({ description: text })} />
      </span>

      <span class="edit-profile-span">
        Avatar
        <Input defaultValue={user.avatar} />

        <FilePicker acceptFormat="image/*" onFileSelect={(file) => setUser({ avatar: file.content_base64 })} />
      </span>

      <span class="edit-profile-span">
        Banner
        <Input defaultValue={user.banner} />

        <FilePicker acceptFormat="image/*" onFileSelect={(file) => {
          console.log(file)
          setUser({ banner: file.content_base64 })
        }}/>
      </span>

      <Button content="Update Profile" onClick={updateUser}/>
    </main>
  )
}