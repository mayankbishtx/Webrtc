import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

let senderSocket: null | WebSocket = null;
let receiverSocket: null | WebSocket = null;

wss.on("connection", function connection(ws) {
    ws.on("error", console.error);

    ws.on("message", function message(data: any) {
        const message = JSON.parse(data.toString());

        if (message.type === "sender") {
            console.log("sender set");
            senderSocket = ws;
            
        } else if (message.type === "receiver") {
            console.log("receiver set");
            receiverSocket = ws;

        } else if (message.type === "createOffer") {
            if (ws !== senderSocket) return;
            console.log("Offer created");
            receiverSocket?.send(JSON.stringify({ type: "offer", sdp: message.sdp }));

        } else if (message.type === "createAnswer") {
            if (ws !== receiverSocket) return;
            console.log("Answer created");
            senderSocket?.send(JSON.stringify({ type: "createAnswer", sdp: message.sdp }));
            
        } else if (message.type === "iceCandidate") {
            if (ws === senderSocket) {
                receiverSocket?.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }));
            } else if (ws === receiverSocket) {
                senderSocket?.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }));
            }
        }

        console.log(message);
    });
})