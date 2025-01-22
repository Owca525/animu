
pkgname=animu
pkgver=0.4.7
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('libxss' 'nss' 'glibc')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('afcc2ad50b904d8a12ceb636e90c478f85a04578b9c40c18e5a4da694c65a7ee')

package() {

  # Extract package data
  bsdtar -xf data.tar.* -C "$pkgdir"

}
