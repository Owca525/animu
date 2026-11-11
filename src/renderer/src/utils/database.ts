import initSqlJs, { ParamsObject } from "sql.js";
import SQLWorker from "sql.js/dist/sql-wasm-browser.wasm?url"

const SQL = await initSqlJs({
    locateFile: () => SQLWorker
});

export interface DatabaseConfig {
    storage?: string,
    createDatabase?: string[]
}

export class CreateDatabase {
    localstore = ""

    db = new SQL.Database

    constructor(config?: DatabaseConfig) {
        if (!config) return

        this.localstore = config["storage"] ?? ""

        this.LoadDatabase()

        if (config["createDatabase"]) {

            for (let index = 0; index < config["createDatabase"].length; index++) {
                const element = config["createDatabase"][index];
                try {
                    this.db.run(element, []);
                } catch (error) {
                    console.error("Database/constructor", error)
                }
            }

        }
    }

    private LoadDatabase = () => {
        try {

            if (this.localstore.length <= 0) return

            const savedDb = localStorage.getItem(this.localstore);

            console.time(`Loading Database ${this.localstore}`)
            if (savedDb) {
                this.db = new SQL.Database(new Uint8Array(JSON.parse(savedDb)))
            }
            console.timeEnd(`Loading Database ${this.localstore}`)

        } catch (error) {
            console.error("Database/LoadDatabase", error)
        }
    }

    get = (options: { table: string, row: string, value: string | number }) => {
        try {
            const stmt = this.db.prepare(`SELECT * FROM ${options.table} WHERE ${options.row} = ?`);

            stmt.bind([options.value]);

            let data: ParamsObject | undefined = undefined;

            if (stmt.step()) {
                data = stmt.getAsObject();
            }

            stmt.free();

            return data;
        } catch (error) {
            console.error("Database/get", error)
            return undefined
        }
    }

    updateDatabse = (content: { table: string, key: string, obj: { [key: string]: number | string | undefined } }) => {
        try {
            const columns = Object.keys(content.obj);

            const placeholders = columns.map(() => "?").join(", ");

            const updateColumns = columns.filter(col => col !== content.key).map(col => `"${col}" = excluded."${col}"`).join(", ");

            this.db.run(`
                INSERT INTO "${content.table}" (${columns.map((v) => `"${v}"`).join(", ")})
                VALUES (${placeholders})
                ON CONFLICT("${content.key}") DO UPDATE SET
                ${updateColumns}
            `, columns.map(col => typeof content.obj[col] == "undefined" ? null : content.obj[col]));


        } catch (error) {
            console.error("Database/updateDatabse", error)
        }
    }

    saveDatabase = () => {
        try {
            const data = this.db.export();

            const binary = Array.from(data)

            if (this.localstore.length <= 0) return binary

            localStorage.setItem(this.localstore, JSON.stringify(binary));
            return
        } catch (error) {
            console.error("Database/saveDatabase", error)
            return
        }
    }
}

export default SQL;