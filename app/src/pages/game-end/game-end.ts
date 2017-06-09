import { Component } from '@angular/core';
import {NavController} from 'ionic-angular';
import {GameService} from "../../services/game";
import {HomePage} from "../home/home";
import {Subscription} from "rxjs/Subscription";

@Component({
  selector: 'page-game-end',
  templateUrl: 'game-end.html'
})
export class GameEndPage {
  game: any;
  winner: any;
  players: any;
  gameSubscribe: Subscription;
  playersSubscribe: Subscription;

  constructor(public navCtrl: NavController,
              public gameService: GameService) {
    this.gameSubscribe = this.gameService.currentGame
      .subscribe(data => {
        this.game = data;
        if (this.game.progress && !this.playersSubscribe) {
          this.subscribePlayers();
        }
      });
  }

  subscribePlayers() {
    this.playersSubscribe = this.gameService
      .getGamePlayers(this.game.$key)
      .subscribe(data => {
        this.players = data;
        this.players.forEach(player => {
          if (!this.winner && this.game.progress.winner == player.playerId) {
            this.winner = player;
          }
        });
        // Sort by score desc
        this.players = this.players.sort((a, b) => a.score < b.score);
      })
  }

  done() {
    return this.navCtrl
      .setRoot(HomePage)
      .then(() => this.navCtrl.popToRoot());
  }

  ionViewWillLeave() {
    this.playersSubscribe.unsubscribe();
    this.gameSubscribe.unsubscribe();
  }
}
