
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
sha256sums_x86_64=('20ede8e0bae71b7bd2e3342746b87be4e982caaa1f1b2a9b0b4209f81ebc0e99')

package() {

  # Extract package data
  bsdtar -xf data.tar.* -C "$pkgdir"

}
