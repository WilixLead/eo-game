## Even/Odd serverless functions

### Install

Make sure your have latest firebase-tools cli installed.

```bash
npm i
firebase functions:config:set game.player_steps=3
firebase deploy --only functions
```

You are ready to go

### Configuration

Use `firebase functions:config:set [option]=[value]` for setup options.
Options:  
- `[number] game.player_steps` Player steps. Default is 3
