import json
from pathlib import Path
import platform
import shutil
import tempfile
import subprocess

system = platform.system()
filePath = Path(__file__).parent
description = ""
ver = ""
homepage = ""

with open(f'{filePath}/package.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    description = data["description"]
    ver = data["version"]
    homepage = data["homepage"]
    f.close()

deb = f"{filePath}/dist/animu-{ver}.deb"
exe = f"{filePath}/dist/animu-{ver}-setup.exe"
if system == "Windows":
    subprocess.run([exe])
    exit(0)

if system != "Linux":
    exit(0)

if shutil.which("apt"):
    subprocess.run(["sudo", "apt", "install", deb])
    exit(0)

if shutil.which("pacman"):
    tmp_dir = tempfile.mkdtemp()
    tmpdeb = f"{tmp_dir}/animu-{ver}.deb"

    PKGBUILD = f"""
    pkgname=Animu
    pkgver={ver}
    pkgrel=1
    pkgdesc={description}
    arch=('x86_64')
    url="{homepage}"
    license=('GNU')
    depends=('libxss' 'nss' 'glibc')
    options=('!strip' '!emptydirs')
    source_x86_64=({tmpdeb})
    sha256sums_x86_64=('SKIP')

    package() {{
    bsdtar -xf data.tar.* -C "$pkgdir"
    }}
    """

    with open(f"{tmp_dir}/PKGBUILD", "w", encoding="utf-8") as f:
        f.write(PKGBUILD)
        f.close()

    shutil.move(deb, tmpdeb)
    subprocess.run(["makepkg", "-si"], cwd=tmp_dir)