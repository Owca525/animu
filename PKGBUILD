
pkgname=animu
pkgver=0.4.1
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('libxss' 'nss' 'glibc')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('1578d6ab8ad2e7d43fd6c1d557507b8c1d0b92f60a97e61b203aa57802613141')

package() {

  # Extract package data
  bsdtar -xf data.tar.* -C "$pkgdir"

}
