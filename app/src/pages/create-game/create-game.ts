import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import {GameService} from "../../services/game";
import {WaitPlayersPage} from "../wait-players/wait-players";

@Component({
  selector: 'page-create-game',
  templateUrl: 'create-game.html'
})
export class CreateGamePage {
  nameError: boolean = false;

  name: string = '';
  playerCount: number = 2;

  constructor(public navCtrl: NavController,
              private gameService: GameService) {
  }

  create() {
    if (!this.name || !this.name.length) {
      this.nameError = true;
      return;
    }
    this.nameError = false;
    this.gameService
      .createGame(this.name, this.playerCount)
      .then(gameRef => {
        // Wait until onGameCreate done work
        gameRef.once('value', () => {
          return this
            .gameService
            .joinGame(gameRef.key, this.name)
            .subscribe(() => {
              return this.navCtrl.push(WaitPlayersPage);
            })
        });
      })
  }
}
