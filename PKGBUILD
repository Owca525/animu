
pkgname=animu
pkgver=0.4.12
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('libxss' 'nss' 'glibc')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('d4abe90d89a1a86144a87c2d650792baf340a284ed3fd4634c3d147794f14488')

package() {

  # Extract package data
  bsdtar -xf data.tar.* -C "$pkgdir"

}
