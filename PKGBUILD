
pkgname=animu
pkgver=0.4.5
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('libxss' 'nss' 'glibc')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('8744ea307170f06cc02bd6425c599fc5cf92ef587197c4668bc6fda2afcf491e')

package() {

  # Extract package data
  bsdtar -xf data.tar.* -C "$pkgdir"

}
