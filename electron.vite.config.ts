import path, { resolve } from 'path';
import fs from 'fs';
import solid from 'vite-plugin-solid';
import { defineConfig } from 'electron-vite';
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
  }).filter(item => item !== undefined);

  let final = {}
  jsonData.forEach((v) => {
    final = {
      ...final,
      ...v
    }
  })

  return final;
}

function getThemeList(themePath: string): { [key: string]: any }[] {
  let listFolder = fs.readdirSync(themePath)
  let finallist: { [key: string]: any }[] = []
  for (let index = 0; index < listFolder.length; index++) {
    const element = listFolder[index];
    const folderTheme = path.join(themePath, element)
    if (fs.statSync(folderTheme).isDirectory()) {
      let theme = getMetadataTheme(folderTheme)
      if (theme) finallist.push(theme)
    }
  }
  return finallist.map((theme) => {
    try {
      const theme_folder = path.dirname(theme.mainCSS)
      if (!theme.options) return { ...theme, mainCSS: theme.mainCSS }
      return {
        ...theme,
        mainCSS: theme.mainCSS,
        options: theme.options.map((value) => {
          if (value.css && value.css.replaceAll(" ", "") != "") return {
            ...value,
            css: path.join(`${theme_folder}`, value.css ?? "")
          }

          if (value.dropDown) return {
            ...value, dropDown: value.dropDown.map((css_drop) => ({
              ...css_drop,
              css: css_drop.css != "" ? path.join(`${theme_folder}`, css_drop.css ?? "") : ""
            }))
          }

          return value
        })
      }
    } catch (error) {
      console.error("Error in getThemeList", error, theme)

      return { ...theme, mainCSS: theme.mainCSS }
    }
  })
}

function themeParser(theme: { [key: string]: any }): { [key: string]: any } | undefined {
  try {
    if (!("author" in theme) || !("themeName" in theme) || !("mainCSS" in theme)) return
    let tmpTheme: { [key: string]: any } = {
      author: theme["author"],
      themeName: theme["themeName"],
      mainCSS: theme["mainCSS"],
    } as any

    if (theme["api"]) tmpTheme = { ...tmpTheme, api: theme["api"] }
    if (theme["version"]) tmpTheme = { ...tmpTheme, version: theme["version"] }
    if (theme["options"]) {
      const tmpOptions = theme["options"].map((option) => {
        let tmpDropdown: any = undefined
        if (option["dropDown"]) {
          tmpDropdown = option["dropDown"].map((v) => ({
            option: v["option"],
            css: v["css"],
          }))
        }

        return {
          name: option["name"],
          dropDown: tmpDropdown,
          css: option["css"],
          default: option["default"],
        }
      })

      tmpTheme = { ...tmpTheme, options: tmpOptions }
    }

    return tmpTheme
  } catch (error) {
    console.error("Failed Parse Theme", error)
    return
  }
}

function getMetadataTheme(path_theme: string): { [key: string]: any } | undefined {
  const pathTheme = path.join(`${path_theme}`, "/theme.json")

  if (!fs.existsSync(pathTheme)) return
  let themeJSON = JSON.parse(fs.readFileSync(pathTheme, "utf-8"))
  const theme = themeParser(themeJSON)
  if (!theme) return

  return { ...theme, mainCSS: path.join(`${path.basename(path_theme)}`, theme.mainCSS) }
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
    enforce: "pre",

    // How to Use
    // /* IFDEF DEBUG */
    // ...code...
    // /* ENDIF */
    transform(code: string, id: string) {
      if (!/\.(ts|tsx|js|jsx)$/.test(id)) return null;

      return { code: ConditionTransform(code, flags), map: null };
    }
  } as any;
}

function generateInfoFile(): PluginOption {
  return {
    enforce: "pre",
    transform(code: string, id: string) {
      if (!/\.(ts|tsx|js|jsx)$/.test(id)) return null;
      if (process.env.NODE_ENV !== 'production') {
        let tmp = {
          ver: pkg.version,
          branch: "Dev",
          commit: "Uknown",
          compiled: Math.floor(new Date().getTime() / 1000),
          langs: readAllLangFiles(),
          themes: getThemeList(path.join(path.resolve(__dirname), "src/renderer/src/themes")),
          flags: globalFlags
        }
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
        compiled: Math.floor(new Date().getTime() / 1000),
        langs: readAllLangFiles(),
        themes: getThemeList(path.join(path.resolve(__dirname), "src/renderer/src/themes")),
        flags: globalFlags
      }

      code = code.replace('"PLEASE_REPLACE_ME_ANIMU_FOR_NEW_INFORMATION"', JSON.stringify(generatedJson));

      return { code, map: null };
    },
  } as any
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

      if (process.env.ONLY_PLUGINS && !isDissabled) {
        if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir)
        fs.writeFileSync(path.join(pluginsDir, path.basename(file).replace(".ts", ".js")), fixed, "utf-8")
      }

      return `export default ${JSON.stringify(isDissabled ? `` : `${fixed}`)}`;
    }
  };
}

function copFiles(folderPath: string) {
  return {
    name: "copy-files",

    configureServer(server) {
      server.middlewares.use(`/${folderPath.split("/").pop()}`, (req, res, next) => {
        const filePath = path.join(path.resolve(folderPath), req.url);

        if (!fs.existsSync(filePath)) {
          return next();
        }

        const content = fs.readFileSync(filePath);

        res.end(content);
      });
    },

    closeBundle() {
      const source = path.resolve(folderPath);
      const destination = path.resolve(`out/renderer/${folderPath.split("/").pop()}`);

      fs.cpSync(source, destination, {
        recursive: true,
      })
    },
  };
}

export default defineConfig({
  main: {
    build: {
      emptyOutDir: true,
      sourcemap: false,
      minify: globalFlags.DEBUG ? false : true,
      externalizeDeps: false
    },
    plugins: [
      viteConditionPlugin(globalFlags),
    ]
  },
  preload: {
    build: {
      emptyOutDir: true,
      sourcemap: false,
      minify: globalFlags.DEBUG ? false : true,
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
        },
        input: {
          main: resolve(__dirname, "src/renderer/index.html"),
        },
      },
      minify: process.env.ANIMU_WEB ? true : false,
    },
    plugins: [
      viteConditionPlugin({
        DEBUG: process.env.NODE_ENV !== 'production' && process.env.ANIMU_WEB_DEV == undefined && process.env.ONLY_PLUGINS == undefined,
        PROD: process.env.NODE_ENV == 'production' && process.env.ANIMU_WEB_DEV == undefined && process.env.ONLY_PLUGINS == undefined,
        WEB: process.env.ANIMU_WEB ? true : false,
        ONLYPLUGINS: process.env.ONLY_PLUGINS ? true : false
      }),
      solid(),
      compileRawModule(),
      generateInfoFile(),
      copFiles("./src/renderer/src/themes")
    ]
  }
})