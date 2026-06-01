const date = new Date();

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalDebug = console.debug;

type LogLevel = "INFO" | "WARNING" | "ERROR" | "DEBUG" | "CRITICAL" | "RESET";

const LOG_COLORS = {
    DEBUG: "\x1b[94m \x1b[0m", // Blue
    INFO: "\x1b[92m \x1b[0m", // Green
    WARNING: "\x1b[93m \x1b[0m", // Yellow
    ERROR: "\x1b[91m \x1b[0m", // Red
    CRITICAL: "\x1b[95m \x1b[0m", // Magenta
    RESET: "\x1b[0m \x1b[0m", // Reset
};

class Logger {
    loggingText: string[] = []

    private decorateLevel(level: LogLevel): string {
        return LOG_COLORS[level].replace(" ", level);
    }

    private convertMessageToString(str: any): string {
        if (typeof str == "object") return JSON.stringify(str)
        return str
    }

    private formatMessage(level: LogLevel, message: any[]) {
        const hour = new Date().toLocaleTimeString("en-EN", { hour12: false });

        const formatedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        this.loggingText.push(`[${formatedDate} ${hour}] [${this.decorateLevel(level)}] ${message.map((v) => this.convertMessageToString(v)).join(" ")}\n`)

        return message;
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
