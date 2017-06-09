import { Component } from '@angular/core';
import {NavController} from 'ionic-angular';
import {GameService} from "../../services/game";
import {FirebaseListObservable} from "angularfire2/database";
import {VotePage} from "../vote/vote";
import {Subscription} from "rxjs/Subscription";

@Component({
  selector: 'page-wait-players',
  templateUrl: 'wait-players.html'
})
export class WaitPlayersPage {
  game: any;
  players: FirebaseListObservable<any>;
  gameSubscribe: Subscription;

  constructor(public navCtrl: NavController,
              public gameService: GameService) {
    this.gameSubscribe = this.gameService
      .currentGame
      .subscribe(data => {
        this.game = data;
        // If game change state to inprogress go to vote page
        if (this.game.state === 'inprogress' && this.game.progress) {
          return this.navCtrl
            .setRoot(VotePage)
            .then(() => this.navCtrl.popToRoot());
        }
      });

    this.players = this.gameService
      .getGamePlayers(this.game.$key);
  }

  ionViewWillLeave() {
    this.gameSubscribe.unsubscribe();
  }
}
