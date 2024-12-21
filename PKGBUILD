
pkgname=animu
pkgver=0.2.4
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('cairo' 'desktop-file-utils' 'gdk-pixbuf2' 'glib2' 'gtk3' 'hicolor-icon-theme' 'libsoup' 'pango' 'webkit2gtk', 'gst-plugins-base-libs', 'gst-libav', 'gst-plugins-base', 'gst-plugins-good')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('65f4dbbf6c00206af03394eddcc0d4084f0bba77344b3d114e04cb490e90bf8d')

package() {

  # Extract package data
  tar -xz -f data.tar.gz -C "${pkgdir}"

}
