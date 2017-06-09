import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import {GameService} from "../../services/game";
import {CreateGamePage} from "../create-game/create-game";
import {FirebaseListObservable} from "angularfire2/database";
import {JoinGamePage} from "../join-game/join-game";
import {GameEndPage} from "../game-end/game-end";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  activeGameList: FirebaseListObservable<any>;
  oldGameList: FirebaseListObservable<any>;

  constructor(public navCtrl: NavController,
              private gameService: GameService) {
    this.activeGameList = gameService.getList('wait');
    this.oldGameList = gameService.getList('done');
  }

  join(game) {
    if (game.state === 'done') { // if selected game is ended
      this.gameService.currentGame = this.gameService.getGame(game.$key);
      return this.navCtrl.push(GameEndPage);
    }
    return this.navCtrl.push(JoinGamePage, {game: game});
  }

  create() {
    return this.navCtrl.push(CreateGamePage);
  }
}
