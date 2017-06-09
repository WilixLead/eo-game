import {Injectable} from '@angular/core';
import {AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable} from 'angularfire2/database';
import {AvatarsService} from "./avatars";
import {Http} from "@angular/http";
import 'rxjs/add/operator/map';
import {Observable} from "rxjs/Observable";
import {Md5} from 'ts-md5/dist/md5';

import { config } from '../environments/environment';

@Injectable()
export class GameService {
  currentGame: any;
  currentPlayerId: string = null;

  constructor(private afDb: AngularFireDatabase,
              private avatars: AvatarsService,
              private http: Http) {
    this.initPlayer();
  }

  /**
   * Load saved playerId or create new
   */
  initPlayer() {
    this.currentPlayerId = localStorage.getItem('playerId');
    if (this.currentPlayerId === null) {
      this.currentPlayerId = Md5.hashStr(Date.now() + '') + '';
      localStorage.setItem('playerId', this.currentPlayerId);
    }
  }

  /**
   * Return game list reference
   * @param state Filter by state
   * @return {FirebaseListObservable<any[]>}
   */
  getList(state: string = 'wait'): FirebaseListObservable<any> {
    return this.afDb.list(config.gameCollection, {
      query: {
        orderByChild: 'state',
        equalTo: state
      }
    });
  }

  /**
   * Return game reference
   * @param gameId
   * @return {FirebaseObjectObservable<any>}
   */
  getGame(gameId): FirebaseObjectObservable<any> {
    return this.afDb.object(config.gameCollection + '/' + gameId);
  }

  /**
   * Return game players
   * @param gameId
   * @return {FirebaseListObservable<any[]>}
   */
  getGamePlayers(gameId): FirebaseListObservable<any> {
    return this.afDb.list(config.gameEnv + '/' + gameId);
  }

  /**
   * Create new game and return game reference
   * @param name
   * @param playerCount
   * @return {firebase.Thenable<any>}
   */
  createGame(name:string, playerCount: number = 2) {
    return this.getList()
      .push({
        name: name,
        icon: this.avatars.get(name),
        playerCount: playerCount,
        state: 'wait'
      })
      .then(ref => {
        return ref;
      });
  }

  /**
   * Join to game by id
   * @param gameId
   * @param playerName
   * @return {Observable<R>}
   */
  joinGame(gameId: string, playerName: string): Observable<string> {
    return this.http
      .post(config.apiUrl + '/joinGame', {
        gameId: gameId,
        playerId: this.currentPlayerId,
        name: playerName,
        avatar: this.avatars.get(playerName)
      })
      .map(res => {
        let data = res.json();
        if (data.success) {
          this.currentGame = this.getGame(gameId);
          return data;
        }
        console.error(data.error);
        throw 'Join error';
      });
  }

  /**
   * Vote to game
   * @param gameId
   * @param answer
   * @param nextDigit
   * @return {Observable<R>}
   */
  vote(gameId: string, answer: number, nextDigit: number): Observable<boolean> {
    return this.http
      .post(config.apiUrl + '/vote', {
        gameId: gameId,
        playerId: this.currentPlayerId,
        answer: answer,
        nextDigit: nextDigit
      })
      .map(res => {
        let data = res.json();
        if (!data.success) {
          console.error(data.error);
          throw 'Vote error';
        }
        return true;
      });
  }
}
