
pkgname=animu
pkgver=0.4.10
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('libxss' 'nss' 'glibc')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('f5f9110d2158964d50fa738bfbec1465dfa38efd4d6c818dd9333e8a12a72acc')

package() {

  # Extract package data
  bsdtar -xf data.tar.* -C "$pkgdir"

}
