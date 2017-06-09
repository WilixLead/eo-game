## Event/Odd Game App

![Game List](screenshots/game-list.jpg?raw=true "Game List Page" width="40%")
![Game First Step](screenshots/game-first-step.jpg?raw=true "Game First Step Page" width="40%")
![Game Next Step](screenshots/game-next-step.jpg?raw=true "Game Next Step Page" width="40%")
![Game End](screenshots/game-end.jpg?raw=true "Game End Page" width="40%")

### Install
Make sure you have ionic and cordova installed

```bash
sudo npm install -g ionic cordova
```
Now get project source:

```bash 
npm i
ionic serve
```

Navigate to [localhost:8100](http://localhost:8100) in your browser and you will see app.  
**NOTE: Use mobile emulation for best UI experience**

### Configuration
All configuration parameters stored in *src/environments/environments.ts*  
You can override some or all parameters by placing additional files like *environments.prod.ts* and etc. 

### How to play

- Create new game or select game from "Active Games" list
- Enter your name and push "Join"
- Wait while another players join
- First player enter any digit and press "Vote"
- Second player select his answer "Even" or "Odd"
- Second player enter next digit question and press "Vote"
- Game continues while all players don't done their steps (Configured in server)
- When all steps end:
  - and one of players have score more then others, game is end
  - two or more players have same score, game continue for first win
