> [!NOTE]
> If you need to suppress background noise on a Twilio call, check out my [twilio-voice-background-noise-suppression](https://github.com/jtmuller5/twilio-voice-background-noise-suppression) repo

# Setup

Since MP3 is a compressed audio format and not raw PCM, you need to first convert your MP3 file to raw PCM. It's easiest to do this manually using ffmpeg:

```bash
ffmpeg -i src/assets/typing.mp3 -ar 8000 -ac 1 -f s16le pipe:1 > output.raw
```

Sounds were downloaded from https://pixabay.com:

- Keyboard Typing: https://pixabay.com/sound-effects/keyboard-typing-250308/
- Ambient Noise: https://pixabay.com/sound-effects/ambient-noise-236388/

# Twilio Resources

## Start Payload

```
{
    event: 'start',
    sequenceNumber: '1',
    start: {
      accountSid: '1234',
      streamSid: 'MZ14f465fb39b99eb0b0efd4bd5456cc8d',
      callSid: '6789',
      tracks: [ 'inbound' ],
      mediaFormat: { encoding: 'audio/x-mulaw', sampleRate: 8000, channels: 1 },
      customParameters: { from: '+13152716606' }
    },
    streamSid: 'MZ14f465fb39b99eb0b0efd4bd5456cc8d'
}
```

## Media Payload
```
{
"event":"media",
"sequenceNumber":"3122",
"media":
  {
    "track":"inbound",
    "chunk":"3121",
    "timestamp":"62411",
    "payload":"////f39////////..."
  },
"streamSid":"MZe36496a19c2240a634016c64787ee984"
}
```

# Express.js + TypeScript Project Setup Steps

## 1. Initialize project
```bash
mkdir project-name
cd project-name
npm init -y
```

## 2. Install dependencies
```bash
npm install express
npm install -D typescript @types/node @types/express ts-node nodemon
```

## 3. Initialize TypeScript configuration
```bash
npx tsc --init
```

## 4. Configure tsconfig.json
Update tsconfig.json with these settings:
```json
{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## 5. Create project structure
```bash
mkdir src
touch src/index.ts
```

## 6. Add basic Express server code
In src/index.ts:
```typescript
import express, { Express, Request, Response } from 'express';

const app: Express = express();
const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:port`);
});
```

## 7. Update package.json scripts
Add these scripts to package.json:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon src/index.ts"
  }
}
```

## 8. Create .gitignore
```bash
echo 'node_modules\ndist\n.env' > .gitignore
```

## 9. Start development server
```bash
npm run dev
```