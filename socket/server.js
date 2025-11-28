import { WebSocketServer } from "ws";
import http from "http";

const server = http.createServer();
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 4000;

const clients = new Map();

wss.on("connection", (ws, req) => {
    const url = new URL(req.url, "http://localhost");
    const username = url.searchParams.get("username");

    // console.log("🟢 Connected:", username);

    if (username) {
        clients.set(username, ws);
    }

    ws.on("message", (raw) => {
        try {
            const data = JSON.parse(raw);

            if (data.type === "send") {
                const receiverSocket = clients.get(data.to);

                if (receiverSocket) {
                    receiverSocket.send(JSON.stringify({
                        type: "new_message",
                        from: data.from,
                        message: data.message,
                        sentAt: Date.now()
                    }));
                }
            }

        } catch (err) {
            console.log("Parse error", err);
        }
    });

    ws.on("close", () => {
        clients.delete(username);
        // console.log("🔴 Disconnected:", username);
    });
});

server.listen(PORT, () => {
    console.log("🔥 WebSocket running");
});