import initSqlJs from "sql.js";
import SQLWorker from "sql.js/dist/sql-wasm-browser.wasm?url"

const SQL = await initSqlJs({
    locateFile: () => SQLWorker
});

window["sql"] = SQL

export default SQL