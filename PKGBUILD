
pkgname=animu
pkgver=0.4.14
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('libxss' 'nss' 'glibc')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('1dd7c2e51d8f3ece66a3d5f04beb0b0a8addfad191ebcbd5cc25b9f06d1cc7c6')

package() {

  # Extract package data
  bsdtar -xf data.tar.* -C "$pkgdir"

}
