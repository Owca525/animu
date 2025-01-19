
pkgname=animu
pkgver=0.4.6
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('libxss' 'nss' 'glibc')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('9334c8c1b6e12355c5ece48b41320102cd491613ae920f2df8c6c86d23bb4080')

package() {

  # Extract package data
  bsdtar -xf data.tar.* -C "$pkgdir"

}
