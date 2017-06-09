import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import {CreateGamePage} from "../pages/create-game/create-game";
import {AvatarsService} from "../services/avatars";
import {GameService} from "../services/game";
import {WaitPlayersPage} from "../pages/wait-players/wait-players";
import {HttpModule} from "@angular/http";
import {JoinGamePage} from "../pages/join-game/join-game";
import {VotePage} from "../pages/vote/vote";
import {SwiperModule} from "angular2-useful-swiper";
import {GameEndPage} from "../pages/game-end/game-end";

import { config } from '../environments/environment';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    CreateGamePage,
    WaitPlayersPage,
    JoinGamePage,
    VotePage,
    GameEndPage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(config.firebaseConfig),
    AngularFireDatabaseModule,
    SwiperModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    CreateGamePage,
    WaitPlayersPage,
    JoinGamePage,
    VotePage,
    GameEndPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    AvatarsService,
    GameService,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
