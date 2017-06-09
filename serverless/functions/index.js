'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const _ = require('lodash');

admin.initializeApp(functions.config().firebase);

const playerSteps = functions.config().game.player_steps;

/**
 * Cors middlewire
 * @param req
 * @param res
 * @param fn
 * @return {Promise}
 */
function applyCors(req, res, fn) {
  return new Promise((resolve) => {
    cors(req, res, () => {
      resolve(fn())
    });
  })
}

/**
 * On Game object changed hook
 * @type {CloudFunction<DeltaSnapshot>}
 */
exports.onGameCreated = functions.database.ref('/games/{pushId}').onWrite(event => {
  // Only edit data when it is first created.
  if (event.data.previous.exists()) {
    let oldGame = event.data.previous.val();
    let newGame = event.data.val();
    // If state changed from wait to inprogress
    if (oldGame.state === 'wait' && newGame.state === 'inprogress') {
      console.log('Starting game. Filling progress');
      // game started. Time to setup
      let progress = {
        previousPlayer: null,
        previousDigit: null,
        currentPlayer: null,
        nextPlayer: null,
        winner: null,
        steps: 0
      };

      // Select first player for move
      return _getNextPlayer(null, event.params.pushId)
        .then(currentPlayer => {
          progress.currentPlayer = currentPlayer.key;
          return _getNextPlayer(progress.currentPlayer.key, event.params.pushId);
        })
        .then(nextPlayer => {
          progress['nextPlayer'] = nextPlayer.key;
          return progress;
        })
        .then((progress) => {
          return event.data.ref.child('progress').set(progress);
        })
    }
    // Skip this event if state not changed and game exists
    return Promise.resolve();
  }
  // On game created event
  return Promise.resolve();
});

/**
 * Join player to game
 * @type {HttpsFunction}
 */
exports.joinGame = functions.https.onRequest((req, res) => applyCors(req, res, () => {
  const gameId = req.body.gameId;
  const player = {
    playerId: req.body.playerId,
    name: req.body.name,
    avatar: req.body.avatar,
    score: 0,
    steps: playerSteps
  }

  if (!player.name || !player.playerId) {
    return res.send({
      success: false,
      error: 'Bad params'
    })
  }

  // Get game info
  const game = admin.database().ref('/games/' + gameId);
  const gameEnv = admin.database().ref('/gameEnv/' + gameId);
  let gameObject;

  return game.once('value') // Get game object
    .then(gameNode => {
      gameObject = gameNode.val();
      // Join player
      return gameEnv.child(player.playerId).set(player); // Add player to game
    })
    .then(playerNode => {
      // Count players
      return gameEnv
        .once('value')
        .then(playersData => playersData.numChildren())
        .then(count => {
          return game // Update ready counter
            .child('playersReady')
            .set(count)
            .then(() => count);
        })
        .then(count => { // Check player counters
          if (count === gameObject.playerCount) {
            // Time to start game
            return game.child('state').set('inprogress');
          }
          if (count > gameObject.playerCount) { // Too much players, remove last added
            return gameEnv
              .child(player.playerId)
              .remove()
              .then(() => game.child('state').set('inprogress'))
              .then(() => {
                throw 'Game is full';
              })
          }
        })
        .then(() => playerNode)
    })
    .then(() => {
      return res.send({
        success: true,
        player: {
          key: player.playerId,
          name: player.name,
          avatar: player.avatar,
          score: player.score,
          steps: player.steps
        },
        gameId: gameId
      });
    })
    .catch(err => {
      console.error(err);
      return res.send({
        success: false,
        error: err
      })
    })
}));

/**
 * Vote or ask a question
 * @type {HttpsFunction}
 */
exports.vote = functions.https.onRequest((req, res) => applyCors(req, res, () => {
  const playerId = req.body.playerId;
  const gameId = req.body.gameId;
  const answer = req.body.answer; // 0 or 1
  const nextDigit = req.body.nextDigit; // number

  // Get game info
  let game = admin.database().ref('/games/' + gameId);
  let gameObject;
  let gameEnv;

  return game
    .once('value')
    .then(gameRef => {
      gameObject = gameRef.val();
      gameObject.key = gameId;
      if (gameObject.state !== 'inprogress') {
        throw 'You cant vote to this game';
      }
      // Join player
      gameEnv = admin.database().ref('/gameEnv/' + gameId);
      return gameEnv.once('value')
    })
    // Check answer
    .then(gameEnvRef => {
      let playerRef = gameEnvRef.child(playerId);
      let playerObject = playerRef.val();

      if (gameObject.progress.previousDigit === null) {
        return playerObject;
      }

      if (playerObject.steps) {
        return admin.database()
          .ref(`/gameEnv/${gameId}/${playerId}/steps`)
          .set(playerObject.steps - 1)
          .then(() => playerObject);
      }
      return playerObject;
    })
    // Check player answer
    .then((playerObject) => {
      let isOdd = gameObject.progress.previousDigit % 2;
      if (isOdd === answer) {
        return admin.database()
          .ref(`/gameEnv/${gameId}/${playerId}/score`)
          .set(++playerObject.score) // Add score
          .then(() => playerObject);
      }
      return playerObject;
    })
    // Move to next player
    .then((playerObject) => {
      let previousPlayer = playerObject;
      let currentPlayer;
      let nextPlayer;

      return _getNextPlayer(previousPlayer.playerId, gameId)
        .then(player => {
          currentPlayer = player;
          return _getNextPlayer(currentPlayer.playerId, gameId);
        })
        .then(player => {
          nextPlayer = player;
        })
        .then(() => {
          gameObject.progress.previousPlayer = previousPlayer.playerId;
          gameObject.progress.previousDigit = nextDigit;
          gameObject.progress.currentPlayer = currentPlayer.playerId;
          gameObject.progress.nextPlayer = nextPlayer.playerId;
          gameObject.progress.steps++;

          return game.child('progress').set(gameObject.progress);
        })
    })
    .then(() => _checkProgress(gameObject))
    .then(() => {
      return res.send({
        success: true
      });
    })
    .catch(err => {
      console.log(err);
      return res.send({
        success: false,
        error: err
      })
    })
}));

/**
 * Check game progress and change state if need
 * @param gameObject
 * @return {*}
 * @private
 */
function _checkProgress(gameObject) {
  if (gameObject.progress.steps <= gameObject.playerCount * playerSteps) {
    return Promise.resolve();
  }

  return admin.database()
    .ref('/gameEnv/' + gameObject.key)
    .once('value')
    .then(players => {
      let playersArray = [];
      _.each(players.val(), player => playersArray.push(player));
      playersArray = _.sortBy(playersArray, ['score']);

      console.log('Sorted array', playersArray);

      // If only one winner at this moment
      if (playersArray[playersArray.length - 1].score !== playersArray[playersArray.length - 2].score) {
        // We can end this game
        gameObject.progress.winner = playersArray[playersArray.length - 1].playerId;
        gameObject.state = 'done';

        let game = admin.database().ref('/games/' + gameObject.key);
        return game
          .child('progress')
          .set(gameObject.progress)
          .then(() => game.child('state').set(gameObject.state))
      }
    })
}

/**
 * Return next player after currentPlayerKey. If currentPlayerKey is null, returned first
 * @param currentPlayerKey
 * @param gameId
 * @return {Promise.<Object>}
 * @private
 */
function _getNextPlayer(currentPlayerKey, gameId) {
  return admin.database()
    .ref('/gameEnv/' + gameId)
    .once('value')
    .then(players => {
      players = players.val();
      let keys = Object.keys(players);

      if (!currentPlayerKey) { // Return first player
        players[keys[0]].key = keys[0];
        return players[keys[0]];
      }

      let currentIndex = keys.indexOf(currentPlayerKey);
      currentIndex++;

      if (currentIndex >= keys.length) {
        currentIndex = 0;
      }

      // Add key for player object
      players[keys[currentIndex]].key = keys[currentIndex];
      return players[keys[currentIndex]];
    });
}
