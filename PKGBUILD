
pkgname=animu
pkgver=0.4.13
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('libxss' 'nss' 'glibc')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('74519a8fd0c731de1a524126b2cdccd5429769350691aa4d32259ac52e242dee')

package() {

  # Extract package data
  bsdtar -xf data.tar.* -C "$pkgdir"

}
