import { IncomingMessage } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { promises as fs } from "fs";
import {
  encodeMuLawBuffer,
  generateWhiteNoise,
  streamPCMToTwilio,
} from "./audioUtils";

export interface TwilioSocket {
  ws: WebSocket;
  streamSid: string | null;
  callSid: string | null;
  phoneNumber: string | null;
}

export const twilioWss = new WebSocketServer({ noServer: true });

let noiseInterval: NodeJS.Timeout | null = null;

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
            // TODO - Send white noise or stream audio file
            /* if (!noiseInterval) {
              noiseInterval = setInterval(() => {
                sendNoiseChunk(connection);
              }, 20); // Send every 20ms for 8kHz audio
            } */

            streamPCMToTwilio(connection, "src/assets/ambient.raw");
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

const CHUNK_SIZE = 160; // Standard µ-law chunk size for 8kHz audio (20ms)
let outboundChunkCounter = 0;

function sendNoiseChunk(connection: TwilioSocket) {
  try {
    // 1. Generate noise for this chunk
    const noise = generateWhiteNoise(CHUNK_SIZE, 300); // Adjust amplitude as needed

    // 2. Convert to µ-law
    const encodedBuffer = encodeMuLawBuffer(noise);

    // 3. Create media message
    const mediaMessage = {
      event: "media",
      streamSid: connection.streamSid,
      media: {
        payload: encodedBuffer.toString("base64"),
        track: "outbound",
        chunk: (++outboundChunkCounter).toString(),
        timestamp: Date.now().toString(),
      },
    };

    // 4. Send to Twilio
    connection.ws.send(JSON.stringify(mediaMessage));
  } catch (err) {
    console.error("Error sending noise chunk:", err);
  }
}
