import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import solid from 'vite-plugin-solid'
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
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
