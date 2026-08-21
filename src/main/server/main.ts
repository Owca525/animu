import http from "node:http";
import crypto from "node:crypto";

import requestApi from "./api/request"

function isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = http.createServer();

        server.once("error", (err: NodeJS.ErrnoException) => {
            resolve(err.code !== "EADDRINUSE");
        });

        server.once("listening", () => {
            server.close(() => resolve(true));
        });

        server.listen(port, "127.0.0.1");
    });
}

let apiComponents = new Map<string, (v: http.IncomingMessage, q: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage; }, url: URL) => void>();
[requestApi].map((v) => apiComponents.set(v.path, v.handle))

export class Server {
    port = 3000
    instance = http.createServer()

    constructor() {
        let active = true

        while (active) {
            this.port = Math.floor(Math.random() * 9000) + 1000
            active = !isPortAvailable(this.port)
        }

        this.instance.listen(this.port)
        this.instance.on("request", this.listener)
        this.instance.on("upgrade", this.socket)

        console.info(`Server running on port ${this.port}`)
    }

    listener = async (request: http.IncomingMessage, response: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage; }) => {
        if (!request.url) {
            response.statusCode = 404
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify({ error: "Nothing Found" }))
            return
        }

        let url = new URL(`http://localhost:${this.port}${request.url}`)
        const findedHandler = apiComponents.get(url.pathname)

        if (!url.pathname.startsWith("/api") || !findedHandler) {
            response.statusCode = 404
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify({ error: "Nothing Found" }))
            return
        }

        try {
            await findedHandler(request, response, url)
        } catch (error) {
            console.error("Error", error)
            response.statusCode = 500
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify({ error: "Server Internal Error" }))
        }
    }

    socket = async (req, socket) => {
        const key = req.headers["sec-websocket-key"];

        if (!key) {
            socket.destroy();
            return;
        }

        const accept = crypto
            .createHash("sha1")
            .update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
            .digest("base64");

        const response = [
            "HTTP/1.1 101 Switching Protocols",
            "Upgrade: websocket",
            "Connection: Upgrade",
            `Sec-WebSocket-Accept: ${accept}`,
            "",
            "",
        ].join("\r\n");

        socket.write(response);

        console.log("WebSocket connected");

        socket.on("data", (buffer) => {
            console.log(buffer);
        });

        socket.on("close", () => {
            console.log("WebSocket disconnected");
        });
    }
}