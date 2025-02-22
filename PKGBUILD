
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
sha256sums_x86_64=('e0d05c53129d6f26e224c94ccc29840c1cfe24da9928a98783a9f9d3f9c9196d')

package() {

  # Extract package data
  bsdtar -xf data.tar.* -C "$pkgdir"

}
