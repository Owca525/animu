import http from "http"

export async function SheepRequest(url: string, options?: RequestInit) {
    try {
        const response = await fetch(url, options);

        const respTextClone = response.clone()
        let text = "";
        try {
            text = await respTextClone.text()
        } catch (error) { }

        const bufferCloned = response.clone()
        let jsontext;

        try {
            jsontext = await response.json()
        } catch (error) { }

        const convertedResponse = {
            text: text,
            json: jsontext,
            buffer: await bufferCloned.arrayBuffer(),
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            success: response.ok,
            responseHeader: new Map<string, string>(response.headers.entries()),
        }

        /* IFDEF DEBUG */
        // console.info("SheepRequest\n", response) // options
        /* ENDIF */

        return convertedResponse;
    } catch (error) {
        console.error(`Error in SheepRequest: ${(error as Error).message} ${(error as Error).name} ${(error as Error).cause} \n ${(error as Error).stack}`, url)
        return {
            text: (error as Error).message,
            json: undefined,
            buffer: [],
            status: 500,
            statusText: (error as Error).message,
            url: url,
            success: false,
            responseHeader: {}
        }
    }
}

const metadata = {
    path: "/api/request",
    handle: handler
}

async function handler(req, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage; }, _) {
    if (req.method === "POST") {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", async () => {
            try {
                const data = JSON.parse(body);

                const response = await SheepRequest(data["url"], data["requestOptions"])

                res.statusCode = response.status;
                res.statusMessage = response.statusText
                Object.entries(response.responseHeader).forEach(([k,v]) => {
                    res.setHeader(k, v);
                })

                res.end(response.text);
            } catch (e) {
                console.log(e)
                res.statusCode = 400;
                res.end("Missing Argument");
            }
        });

        return;
    }

    res.statusCode = 404;
    res.end("Not found");
}

export default metadata