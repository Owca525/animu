
pkgname=animu
pkgver=0.4.8
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('libxss' 'nss' 'glibc')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('968c822d07475666df4fb20d7b7ba4bfc2b73f47bda7af92353619fd17d532fa')

package() {

  # Extract package data
  bsdtar -xf data.tar.* -C "$pkgdir"

}
