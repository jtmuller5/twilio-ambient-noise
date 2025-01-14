import { IncomingMessage } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { promises as fs } from "fs";

export interface TwilioSocket {
  ws: WebSocket;
  streamSid: string | null;
  callSid: string | null;
  phoneNumber: string | null;
}

export const twilioWss = new WebSocketServer({ noServer: true });

twilioWss.on("connection", async (ws: WebSocket, request: IncomingMessage) => {
  console.log("Twilio WebSocket connected");

  const connection: TwilioSocket = {
    ws,
    streamSid: null,
    callSid: null,
    phoneNumber: null,
  };

  let chunkCounter = 0;

  ws.on("message", async (message: WebSocket.Data) => {
    if (message instanceof Buffer) {
      try {
        const jsonString = message.toString("utf8");
        const jsonMessage = JSON.parse(jsonString);

        if (!connection.streamSid && jsonMessage.streamSid) {
          connection.streamSid = jsonMessage.streamSid;
          console.log(`StreamSid set: ${connection.streamSid}`);
        }

        switch (jsonMessage.event) {
          case "connected":
            console.log("Twilio stream connected");
            console.log("Connected JSON: ", jsonMessage);
            break;

          case "start":
            console.log("Twilio stream started: ", jsonMessage);
            break;

          case "media":
            break;

          case "stop":
            console.log("Twilio stream stopped");

            ws.close();
            break;

          default:
            console.log(`Unhandled event type: ${jsonMessage.event}`);
        }
      } catch (error) {
        console.error("Error processing Twilio message:", error);
      }
    } else {
      console.error("Received unexpected message type from Twilio");
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("close", (code, reason) => {
    console.log(`WebSocket closed with code ${code}, reason: ${reason}`);
  });
});
