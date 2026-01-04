import { resolve } from 'path';
import solid from 'vite-plugin-solid';
import { defineConfig } from 'electron-vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  main: {
    build: {
      emptyOutDir: true,
      sourcemap: false,
      minify: true,
      externalizeDeps: false
    },
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: "node_modules/castv2/lib/cast_channel.proto",
            dest: "",
          }
        ],
      }),
    ]
  },
  preload: {
    build: {
      emptyOutDir: true,
      sourcemap: false,
      minify: true,
      externalizeDeps: false
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      solid(),
      viteStaticCopy({
        targets: [
          {
            src: 'src/themes/*',
            dest: 'assets/themes'
          },
          {
            src: "../../node_modules/jassub/dist/default.woff2",
            dest: "assets",
          },
          {
            src: 'src/utils/lang/*',
            dest: 'assets/lang'
          },
        ],
      }),
    ]
  }
})

