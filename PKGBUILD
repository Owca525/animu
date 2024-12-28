
pkgname=animu
pkgver=0.3.2
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('cairo' 'desktop-file-utils' 'gdk-pixbuf2' 'glib2' 'gtk3' 'hicolor-icon-theme' 'libsoup' 'pango' 'webkit2gtk' 'gst-plugins-base-libs' 'gst-libav' 'gst-plugins-base' 'gst-plugins-good')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('5392837a73aa75ee11fee49f206d501bdd993ebadb88a16d0bb3a0237ad9f741')

package() {

  # Extract package data
  tar -xz -f data.tar.gz -C "${pkgdir}"

}
