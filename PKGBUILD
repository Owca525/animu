
pkgname=animu
pkgver=0.4.0
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('libxss' 'nss' 'glibc')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('c093788e2d3239afbc5511240802ae5f067ca92ed1f5b4bfd5614f8a8734ccdd')

package() {

  # Extract package data
  bsdtar -xf data.tar.* -C "$pkgdir"

}
