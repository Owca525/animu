
pkgname=animu
pkgver=0.3.1
pkgrel=1
pkgdesc="Simple Application To Watch Anime"
arch=('x86_64')
url="https://github.com/Owca525/animu"
license=('GNU')
depends=('cairo' 'desktop-file-utils' 'gdk-pixbuf2' 'glib2' 'gtk3' 'hicolor-icon-theme' 'libsoup' 'pango' 'webkit2gtk' 'gst-plugins-base-libs' 'gst-libav' 'gst-plugins-base' 'gst-plugins-good')
options=('!strip' '!emptydirs')
source_x86_64=("https://github.com/Owca525/animu/releases/download/v$pkgver/animu_"$pkgver"_amd64.deb")
sha256sums_x86_64=('708857b3139680b600de49b1e02baa80ba405dd43c8033a8f30b14f53ca47418')

package() {

  # Extract package data
  tar -xz -f data.tar.gz -C "${pkgdir}"

}
