import express, { Express, Request, Response } from "express";
import http from "http";
import ngrok from "ngrok";
import { twiml } from "twilio";
import { twilioWss } from "./twilioSocket";

const app: Express = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

app.post("/", (req: Request, res: Response) => {
  console.log("Received voice call:", JSON.stringify(req.body));

  const twimlResponse = new twiml.VoiceResponse();

  const connect = twimlResponse.connect();
  const stream = connect.stream({
    url: `wss://${req.headers.host}/stream`,
  });

  res.type("text/xml");
  res.send(twimlResponse.toString());
});

server.listen(port, async () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);

  // Set up ngrok
  try {
    const url = await ngrok.connect({
      addr: port,
      subdomain: process.env.NGROK_SUBDOMAIN,
    });
    console.log(`ngrok URL: ${url}`);
  } catch (error) {
    console.error("Error setting up ngrok:", error);
  }
});

server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url!, `http://${request.headers.host}`)
    .pathname;

  console.log(`Upgrade request received for path: ${pathname}`);

  console.log("Handling Twilio WebSocket upgrade");

  twilioWss.handleUpgrade(request, socket, head, (ws) => {
    twilioWss.emit("connection", ws, request);
  });
});
