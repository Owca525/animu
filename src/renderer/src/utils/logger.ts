const date = new Date();

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalDebug = console.debug;

type LogLevel = "INFO" | "WARNING" | "ERROR" | "DEBUG" | "CRITICAL" | "RESET";

// const LOG_COLORS = {
//     DEBUG: "\x1b[94m \x1b[0m", // Blue
//     INFO: "\x1b[92m \x1b[0m", // Green
//     WARNING: "\x1b[93m \x1b[0m", // Yellow
//     ERROR: "\x1b[91m \x1b[0m", // Red
//     CRITICAL: "\x1b[95m \x1b[0m", // Magenta
//     RESET: "\x1b[0m \x1b[0m", // Reset
// };

function CutTheText(str: string) {
  if (new TextEncoder().encode(str).length <= 64 * 1024) return str;
  return `${str.slice(0, 64)}...`
}

class Logger {
    loggingText: string[] = []
    maxSizeLog = 512

    // private decorateLevel(level: LogLevel): string {
    //     return LOG_COLORS[level].replace(" ", level);
    // }

    public saveLogs() {
        /* IFDEF DEBUG|PROD */
        window.backend.saveLog(this.loggingText)
        /* ENDIF */

        /* IFDEF WEB */
        const hour = new Date().toLocaleTimeString("en-EN", { hour12: false });
        const formatedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        const blob = new Blob([this.loggingText.join("\n")], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${formatedDate}-${hour}-logs.log`;
        a.click();

        URL.revokeObjectURL(url);
        /* ENDIF */
    }

    private convertMessageToString(str: any): string {
        if (str instanceof Error) return `${str.message} ${str.cause} ${str.stack}`
        if (typeof str == "object") return CutTheText(JSON.stringify(str))
        return str
    }

    private formatMessage(level: LogLevel, message: any[]) {
        if (this.loggingText.length > this.maxSizeLog) {
            this.loggingText.shift()
        }

        const date = new Date()
        const formatedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        this.loggingText.push(`[${formatedDate} ${date.toLocaleTimeString("en-EN", { hour12: false })}] [${level}] ${message.map((v) => this.convertMessageToString(v)).join(" ")}\n`)

        return message;
    }

    public AddLog(str: string, level: string) {
        this.formatMessage(level as any, [str])
    }

    info(...args: any[]) {
        originalLog(...this.formatMessage("INFO", args));
    }

    warn(...args: any[]) {
        originalWarn(...this.formatMessage("WARNING", args));
    }

    error(...args: any[]) {
        originalError(...this.formatMessage("ERROR", args));
    }

    debug(...args: any[]) {
        originalDebug(...this.formatMessage("DEBUG", args));
    }
}

const logger = new Logger();

console.log = (...args) => logger.info(...args);
console.error = (...args) => logger.error(...args);
console.warn = (...args) => logger.warn(...args);
console.debug = (...args) => logger.debug(...args);

(window as any).logger = logger

export default logger;
