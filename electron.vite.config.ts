import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
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
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false,
        },
        mangle: true,
     },
     reportCompressedSize: true,
     cssCodeSplit: false
    },
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: 'src/themes/*', 
            dest: 'assets/themes'
          },
          {
            src: 'src/themes/*', 
            dest: 'assets/themes'
          },
        ],
      }),
    ]
  }
})
