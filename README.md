# Animu / Warning This branch is not support anymore
The concept is simple: watching anime while having a powerful tool for synchronizing anime lists, downloading anime, tracking what you've watched, using plugins to enable viewing anime from all sites, receiving notifications when a new episode is released on a site, and syncing with anime lists with the ability to update what you've watched, etc.

The only problem is that my friend and I have no experience in creating such a project. So, if anyone wants to help, feel free to contact me: ofca666 on Discord.
# Planned features
- Automatic synchronization with platforms like anilist.co via plugins
- Plugins enabling viewing from various websites
- Saving watch history
- Downloading anime
- Notifications when a new episode is released
- User-friendly UI
# How to Compile
You need to have [Cargo/Rust](https://www.rust-lang.org/) and [Node,js](https://nodejs.org/en) installed. Then, clone the repository. if you using windows, install Microsoft Visual 2022
```bash
git clone https://github.com/Owca525/animu.git && cd ./animu
```
Installation of required libraries
```bash
npm install
```
Project compilation
```bash
npm run tauri build
```
Run developer version
```bash
npm run dev
```
The executable file should be in ./src/target/release
