import path, { resolve } from 'path';
import fs from 'fs';
import solid from 'vite-plugin-solid';
import { defineConfig } from 'electron-vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import type { PluginOption } from "vite";
import pkg from './package.json'
import { execSync } from 'child_process';

function evalConditionOr(expr: string, flags: Record<string, boolean>) {
  const parts = expr.split("|").map(s => s.trim());
  return parts.some(flag => flags[flag] === true);
}

export function viteConditionPlugin(flags: Record<string, boolean>): PluginOption {
  return {
    name: "viteConditionPlugin",
    enforce: "pre",

    // How to Use
    // /* IFDEF DEBUG */
    // ...code...
    // /* ENDIF */
    transform(code: string, id: string) {
      if (!/\.(ts|tsx|js|jsx)$/.test(id)) return null;

      const regex =
        /(\/\*\s*#?IFDEF\s+(.+?)\s*\*\/|\{\s*\/\*\s*IFDEF\s+(.+?)\s*\*\/\s*\}|\/\/\s*IFDEF\s+(.+))([\s\S]*?)(\/\*\s*#?ENDIF\s*\*\/|\{\s*\/\*\s*ENDIF\s*\*\/\s*\}|\/\/\s*ENDIF)/gi;

      code = code.replace(regex, (_, __, c1, c2, c3, inner) => {
        const condition = (c1 || c2 || c3 || "").trim();
        const enabled = evalConditionOr(condition, flags);

        return enabled ? inner : "";
      });

      return { code, map: null };
    }
  };
}

function generateInfoFile() {
  let filePath: string
  let tempPath: string

  return {
    name: 'generateInfoFile',

    buildStart() {
      filePath = path.resolve(__dirname, 'src/renderer/src/app.placeholder.json')
      tempPath = path.resolve(__dirname, 'src/renderer/src/app.json')

      fs.renameSync(tempPath, filePath)
      let branch = execSync('git rev-parse --abbrev-ref HEAD')
        .toString()
        .trim()

      let commit = execSync('git rev-parse --short HEAD')
        .toString()
        .trim()

      fs.writeFileSync(tempPath, `
      {
        "ver": "${pkg.version}",
        "branch": "${branch}",
        "commit": "${commit}",
        "compiled": "${Math.floor(new Date().getTime() / 1000)}"
      }`)
    },

    closeBundle() {
      tempPath = path.resolve(__dirname, 'src/renderer/src/app.json')
      filePath = path.resolve(__dirname, 'src/renderer/src/app.placeholder.json')
      
      fs.rmSync(tempPath)
      fs.renameSync(filePath, tempPath)
    }
  }
}

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
        '@renderer': resolve('src/renderer/src'),
        '@resources': resolve('resources')
      },
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: "index.js",
          chunkFileNames: "[name].js",
          assetFileNames: "[name][extname]",
          minifyInternalExports: false
        }
      },
      minify: false,
    },
    plugins: [
      solid(),
      viteConditionPlugin({
        DEBUG: process.env.NODE_ENV !== 'production',
        PROD: process.env.NODE_ENV == 'production'
      }),
      generateInfoFile(),
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
      {
        name: 'delete',
        closeBundle() {
          const fileToDelete = path.resolve(__dirname, 'out/renderer/exports.js');
          if (fs.existsSync(fileToDelete)) fs.unlinkSync(fileToDelete)
        }
      }
    ]
  }
})