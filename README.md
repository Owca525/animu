# Animu
The concept is simple: watching anime while having a powerful tool for synchronizing anime lists, downloading anime, tracking what you've watched, using plugins to enable viewing anime from all sites, receiving notifications when a new episode is released on a site, and syncing with anime lists with the ability to update what you've watched, etc.

The only problem is that my friend and I have no experience in creating such a project. So, if anyone wants to help, We have [Discord server](https://discord.gg/p4fTqGKgqr)

⚠️ Please note that Windows Defender does not consider this application to be safe because it has few users on Windows and I cannot afford certificates. ⚠️

[Animu Documentation](documentation.md)

NOTE: Animu does not host or possess any anime and does not promote piracy; it only provides links to these anime.

## Screenshots
![home](assets/home.png)
![information](assets/information.png)
![information](assets/player.png)
![information](assets/settings.png)

# Planing Features
- [ ] Automatic synchronization with platforms like anilist.co via plugins
- [x] Plugins enabling viewing from various websites
- [x] Saving watch history
- [ ] Downloading anime
- [ ] AnimuList
- [ ] Week Schedule
- [x] External Plugins
- [x] Customization with CSS
- [ ] Notifications when a new episode is released
- [x] User-friendly UI
- [ ] Gamepad Navigation

## How to Compile
You need to have [Node.js](https://nodejs.org/en) and yarn installed. Then, clone the repository.
```bash
git clone https://github.com/Owca525/animu.git && cd ./animu
```
Installation of required libraries
```bash
yarn
```
Project compilation
```bash
yarn run build:win or build:linux
```
Run developer version
```bash
yarn run dev
```

## License

[GPL-3.0](https://choosealicense.com/licenses/gpl-3.0/)
