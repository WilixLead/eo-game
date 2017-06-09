import { Component } from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
import {GameService} from "../../services/game";
import {WaitPlayersPage} from "../wait-players/wait-players";
import {FirebaseListObservable} from "angularfire2/database";
import {Subscription} from "rxjs/Subscription";

@Component({
  selector: 'page-join-game',
  templateUrl: 'join-game.html'
})
export class JoinGamePage {
  nameError: boolean = false;

  playersSubscribe: Subscription;

  name: string = '';
  game: any;
  players: FirebaseListObservable<any>;

  constructor(public navCtrl: NavController,
              private navParams: NavParams,
              private gameService: GameService) {
    this.game = this.navParams.get('game');
    if (!this.game) {
      this.navCtrl.pop();
      return;
    }
    this.players = this.gameService.getGamePlayers(this.game.$key);
    this.playersSubscribe = this.players.subscribe((players) => {
      players.forEach(player => {
        if (player.playerId === this.gameService.currentPlayerId) {
          this.gameService.currentGame = this.gameService.getGame(this.game.$key);
          return this.navCtrl.push(WaitPlayersPage);
        }
      });
    })
  }

  join() {
    if (!this.name || !this.name.length) {
      this.nameError = true;
      return;
    }
    this.nameError = false;
    return this.gameService
      .joinGame(this.game.$key, this.name)
      .subscribe(() => {
        return this.navCtrl.push(WaitPlayersPage);
      })
  }

  ionViewWillLeave() {
    if (this.playersSubscribe) {
      this.playersSubscribe.unsubscribe();
    }
  }
}
