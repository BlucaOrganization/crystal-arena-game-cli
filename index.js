var WebSocketClient = require('websocket').client;

var client = new WebSocketClient();

var inquirer = require('inquirer')

let connectingGameId = null

const REQUEST_EVENT = {
  PLANNING_COMPLETED: 'PLANNING_COMPLETED',
  USE_ACTION: 'USE_ACTION'
}

const RESPONSE_EVENT = {
  CONNECTED: 'CONNECTED',
  ACTION_REPLAY: 'ACTION_REPLAY',
  GAME_END: 'GAME_END',
  WAITING_FOR_ACTION: 'WAITING_FOR_ACTION'
}

const ACTION = {
  PASS: 'PASS',
  SWAP_BLUCAMON: 'SWAP_BLUCAMON'
}

let player1FortDetail = []
let player2FortDetail = []

const getQuestions = (i) => {
  return {type: 'list', message: `Choice #${i}`, name: `choice${i}`, choices: ['rock', 'scissor', 'paper']}
} 

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
      if (message.type === 'utf8') {
          const messageObject = JSON.parse(message.utf8Data)
          if (messageObject.event === RESPONSE_EVENT.CONNECTED) {
            if (connectingGameId === null) {
              connectingGameId = messageObject.gameId
            }
            connection.sendUTF(JSON.stringify({
              event: REQUEST_EVENT.PLANNING_COMPLETED,
              metadata: null,
              gameId: connectingGameId
            }))
            // inquirer.prompt([getQuestions(1), getQuestions(2), getQuestions(3), getQuestions(4), getQuestions(5)]).then(ans => {
            //   connection.sendUTF(JSON.stringify({
            //     event: REQUEST_EVENT.PLANNING_COMPLETED,
            //     metadata: {
            //       choices: [ans.choice1, ans.choice2, ans.choice3, ans.choice4, ans.choice5]
            //     },
            //     gameId: connectingGameId
            //   }))
            // })
          }
          else if (messageObject.event === RESPONSE_EVENT.ACTION_REPLAY) {
            console.log(messageObject.metadata.board)
            player1FortDetail = messageObject.metadata.player1
            player2FortDetail = messageObject.metadata.player2
          } else if (messageObject.event === RESPONSE_EVENT.GAME_END) {
            console.log('Winner is: ', messageObject.metadata.winner)
            console.log('Board:')
            console.log('')
            console.log(messageObject.metadata.board)
            connection.close()
          } else if (messageObject.event === RESPONSE_EVENT.WAITING_FOR_ACTION) {
            inquirer.prompt([{
              type: 'list',
              message: 'Action',
              name: 'action',
              choices: [ACTION.PASS, ACTION.SWAP_BLUCAMON]
            }]).then((ans) => {
              if (ans.action === ACTION.PASS) {
                connection.sendUTF(JSON.stringify({
                  event: REQUEST_EVENT.USE_ACTION,
                  metadata: {
                    action: ans.action,
                    args: []
                  },
                  gameId: connectingGameId
                }))
              } else if(ans.action === ACTION.SWAP_BLUCAMON) {
                inquirer.prompt([
                  {
                    type: 'list', 
                    message: 'Swap from:', 
                    name: 'from', 
                    choices: player1FortDetail.map(detail => { 
                      return {
                        name: detail.name, value: detail.id
                      }
                    })
                  },
                  {
                    type: 'list',
                    message: 'Swap from:', 
                    name: 'to', 
                    choices: player1FortDetail.map(detail => { 
                      return {
                        name: detail.name, value: detail.id
                      }
                    })
                  }
                ]).then(ans2 => {
                  if (ans2.from === ans2.to) {
                    return
                  }
                  connection.sendUTF(JSON.stringify({
                    event: REQUEST_EVENT.USE_ACTION,
                    metadata: {
                      action: ans.action,
                      args: [ans2.from, ans2.to]
                    },
                    gameId: connectingGameId
                  }))
                })
              }
            })
          }
        }
    });
});

client.connect('ws://34.87.177.196:8080/blucacard/single/uid1');