import path, { resolve } from 'path';
import fs from 'fs';
import solid from 'vite-plugin-solid';
import { defineConfig } from 'electron-vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { transformWithEsbuild, type PluginOption } from "vite";
import pkg from './package.json'
import { execSync } from 'child_process';

function evalConditionOr(expr: string, flags: Record<string, boolean>) {
  const parts = expr.split("|").map(s => s.trim());
  return parts.some(flag => flags[flag] === true);
}

const globalFlags = {
  DEBUG: process.env.NODE_ENV !== 'production' && process.env.ANIMU_WEB_DEV == undefined,
  PROD: process.env.NODE_ENV == 'production' && process.env.ANIMU_WEB_DEV == undefined,
  WEB: process.env.ANIMU_WEB_DEV ? true : false
}

const cwd = process.cwd()

const pluginsDir = path.join(cwd, "compiledPlugins")

function readAllLangFiles() {
  const folderPath = path.join(path.resolve(__dirname), "src/renderer/src/utils/lang/")
  const files = fs.readdirSync(path.join(path.resolve(__dirname), "src/renderer/src/utils/lang/"));

  const jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json');

  const jsonData = jsonFiles.map(file => {
    if (!file.endsWith(".json")) return undefined
    const filePath = path.join(folderPath, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    try {
      return { [file.replaceAll(".json", "")]: JSON.parse(fileContent) };
    } catch (err) {
      console.error(`Error ${file}:`, err);
      return undefined;
    }
  });

  return jsonData.filter(item => item !== undefined);
}

function ConditionTransform(code: string, flags: Record<string, boolean>): string {
  const regex =
    /(\/\*\s*#?IFDEF\s+(.+?)\s*\*\/|\{\s*\/\*\s*IFDEF\s+(.+?)\s*\*\/\s*\}|\/\/\s*IFDEF\s+(.+))([\s\S]*?)(\/\*\s*#?ENDIF\s*\*\/|\{\s*\/\*\s*ENDIF\s*\*\/\s*\}|\/\/\s*ENDIF)/gi;

  code = code.replace(regex, (_, __, c1, c2, c3, inner) => {
    const condition = (c1 || c2 || c3 || "").trim();
    const enabled = evalConditionOr(condition, flags);

    return enabled ? inner : "";
  });

  return code
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

      return { code: ConditionTransform(code, flags), map: null };
    }
  };
}

function generateInfoFile(): PluginOption {
  return {
    name: 'generateInfoFile',
    enforce: "pre",
    transform(code: string, id: string) {
      if (!/\.(ts|tsx|js|jsx)$/.test(id)) return null;
      if (process.env.NODE_ENV !== 'production') {
        let tmp = {
          ver: pkg.version,
          branch: "Dev",
          commit: "Uknown",
          compiled: Math.floor(new Date().getTime() / 1000)
        }
        if (process.env.ANIMU_WEB_DEV) tmp["langs"] = readAllLangFiles()
        code = code.replace('"PLEASE_REPLACE_ME_ANIMU_FOR_NEW_INFORMATION"', JSON.stringify(tmp));
        return { code, map: null };
      }

      let branch = execSync('git rev-parse --abbrev-ref HEAD')
        .toString()
        .trim()

      let commit = execSync('git rev-parse --short HEAD')
        .toString()
        .trim()

      let generatedJson = {
        ver: pkg.version,
        branch: branch,
        commit: commit,
        compiled: Math.floor(new Date().getTime() / 1000)
      }

      if (process.env.ANIMU_WEB) generatedJson["langs"] = readAllLangFiles()

      code = code.replace('"PLEASE_REPLACE_ME_ANIMU_FOR_NEW_INFORMATION"', JSON.stringify(generatedJson));

      return { code, map: null };
    },
  }
}

function compileRawModule() {
  return {
    name: "compilerawmodules",

    async load(id: string) {
      if (!id.endsWith("?compiledRaw")) {
        return;
      }

      const file = id.replace("?compiledRaw", "");

      const code = fs.readFileSync(file, "utf8");
      let isDissabled = false
      if (code.startsWith("// DISSABLE")) isDissabled = true

      const result = await transformWithEsbuild(
        ConditionTransform(code, globalFlags),
        file,
        {
          loader: "ts",
          format: "esm",
          target: "esnext",
        }
      );

      const fixed = result.code.replace(
        /import\s+([\s\S]*?)\s+from\s+["']([^"']+)["']/g,
        (full, imports, path) => {
          if (path.startsWith(".") || path.startsWith("@renderer")) {
            return `import ${imports} from "./index.js"`
          }

          return full
        }
      )

      if (process.env.ONLY_PLUGINS) {
        if (!fs.existsSync(pluginsDir)) {
          fs.rmdirSync(pluginsDir)
          fs.mkdirSync(pluginsDir)
        }
        fs.writeFileSync(path.join(pluginsDir, path.basename(file).replace(".ts", ".js")), fixed, "utf-8")
      }

      return `export default ${JSON.stringify(isDissabled ? `` : `${fixed}`)}`;
    }
  };
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
      viteConditionPlugin(globalFlags),
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
    server: {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      cors: {
        origin: true
      }
    },
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
      minify: process.env.ANIMU_WEB ? true : false,
    },
    plugins: [
      solid(),
      viteConditionPlugin({
        DEBUG: process.env.NODE_ENV !== 'production' && process.env.ANIMU_WEB_DEV == undefined && process.env.ONLY_PLUGINS == undefined,
        PROD: process.env.NODE_ENV == 'production' && process.env.ANIMU_WEB_DEV == undefined && process.env.ONLY_PLUGINS == undefined,
        WEB: process.env.ANIMU_WEB ? true : false,
        ONLYPLUGINS: process.env.ONLY_PLUGINS ? true : false
      }),
      compileRawModule(),
      generateInfoFile(),
      viteStaticCopy({
        targets: [
          {
            src: 'src/themes/*',
            dest: 'assets/themes'
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