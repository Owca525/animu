
pkgname=animu
pkgver=0.4.15
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('libxss' 'nss' 'glibc')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('be43f7ba6233054fb30383c8eb11222e5a48c528a587ddaa44cbb41ed7bef05f')

package() {

  # Extract package data
  bsdtar -xf data.tar.* -C "$pkgdir"

}
