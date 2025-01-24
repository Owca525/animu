
pkgname=animu
pkgver=0.4.9
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('libxss' 'nss' 'glibc')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('c2737a06e3778bb530c7c7d24b1a1c68d61ced14f33928b66a0045a6cefcecc9')

package() {

  # Extract package data
  bsdtar -xf data.tar.* -C "$pkgdir"

}
