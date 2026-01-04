import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import solid from 'vite-plugin-solid'
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  main: {
    build: {
      emptyOutDir: true,
      sourcemap: false,
      minify: true,
    }
  },
  preload: {
    build: {
      emptyOutDir: true,
      sourcemap: false,
      minify: true,
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

