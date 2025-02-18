
pkgname=animu
pkgver=0.4.11
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('libxss' 'nss' 'glibc')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('8afdf8efb8fef9a596344de2651b986c9f2d381532f2d0888ab04eb4367be1fd')

package() {

  # Extract package data
  bsdtar -xf data.tar.* -C "$pkgdir"

}
