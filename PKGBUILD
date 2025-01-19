
pkgname=animu
pkgver=0.4.4
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('libxss' 'nss' 'glibc')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('66263462638aafd8a518f4b32a5b7c0c218d9f955aa2616c81cf110fc58fd681')

package() {

  # Extract package data
  bsdtar -xf data.tar.* -C "$pkgdir"

}
