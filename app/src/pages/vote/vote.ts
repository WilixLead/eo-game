import {Component, ElementRef, ViewChild} from '@angular/core';
import { NavController } from 'ionic-angular';
import {GameService} from "../../services/game";
import {Subscription} from "rxjs/Subscription";
import {GameEndPage} from "../game-end/game-end";
import {HomePage} from "../home/home";

@Component({
  selector: 'page-vote',
  templateUrl: 'vote.html'
})
export class VotePage {
  @ViewChild('playerSwiper') playerSwiper: ElementRef;
  swiperConfig: Object = {
    effect: 'coverflow',
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: 3,
    coverflow: {
      rotate: 50,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows : true
    }
  };
  game: any;
  players: any = {};
  playersKeys: string[] = [];
  questionError: boolean = false;
  stage: string = 'answer';

  title: string = 'Your move';
  prevPlayer: any;
  nextPlayer: any;
  answer: number;
  question: string;

  gameSubscribe: Subscription;
  playersSubscribe: Subscription;

  constructor(public navCtrl: NavController,
              private gameService: GameService) {
  }

  ionViewDidLoad() {
    this.initPlayers();
  }

  ans(answer: number) {
    this.answer = answer;
    this.stage = 'question';
  }

  vote() {
    if (!this.question || !this.question.length) {
      this.questionError = true;
      return;
    }
    let digit = parseInt(this.question);
    if (digit === 0) {
      this.questionError = true;
      return;
    }
    this.questionError = false;
    this.gameService
      .vote(
        this.gameService.currentGame.$ref.key,
        this.answer,
        digit
      )
      .subscribe(() => {
        this.answer = null;
        this.question = '';
      })
  }

  changePlayer(key) {
    this.playerSwiper['Swiper']
      .slideTo(this.playersKeys.indexOf(key), 500);
  }

  initPlayers() {
    // load all players
    this.playersSubscribe = this.gameService
      .getGamePlayers(this.gameService.currentGame.$ref.key)
      .subscribe(data => {
        data.forEach(player => {
          if (!this.players[player.playerId]) {
            this.players[player.playerId] = player;
            this.playersKeys.push(player.playerId);
          }
          this.players[player.playerId].score = player.score;
        });
        if (!this.gameSubscribe) {
          this.initGameSubscribe();
        }
      });
  }

  initGameSubscribe() {
    // Subscribe to game updates
    this.gameSubscribe = this.gameService
      .currentGame
      .subscribe(data => {
        this.game = data;
        if (data.state === 'done') {
          // Time to finish game
          this.navCtrl
            .setRoot(HomePage)
            .then(() => {
              return this.navCtrl
                .insert(this.navCtrl.getActive().index, GameEndPage);
            })
            .then(() => this.navCtrl.pop())
        }
        // Hotfix for slider
        setTimeout(() => {
          this.changePlayer(this.game.progress.currentPlayer);
        }, 100);

        // Check player queue
        if (this.game.progress.previousPlayer) {
          this.prevPlayer = this.players[this.game.progress.previousPlayer];
        }
        if (this.game.progress.nextPlayer) {
          this.nextPlayer = this.players[this.game.progress.nextPlayer];
        }

        if (this.game.progress.currentPlayer !== this.gameService.currentPlayerId) {
          this.stage = 'wait';
          this.title = 'Waiting';
        } else {
          this.stage = this.prevPlayer ? 'answer' : 'question';
          this.title = 'Your move';
        }
      });
  }

  ionViewWillLeave() {
    this.gameSubscribe.unsubscribe();
    this.playersSubscribe.unsubscribe();
  }
}
