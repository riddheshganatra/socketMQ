// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var amqp = require('amqplib');
const config = require(`./config.json`)



// var redis = require('socket.io-redis');
var port = process.env.PORT || 3000;
var serverName = process.env.NAME || 'Unknown';

// io.adapter(redis({ host: 'redis', port: 6379 }));

server.listen(port, function () {
  console.log('Server listening at port %d', port);
  console.log('Hello, I\'m %s, how can I help?', serverName);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;

io.use((socket, next) => {
  let token = socket.handshake.query.token;
  if (token) {
    return next();
  }
  console.error(`authentication error`);

  return next(new Error('authentication error'));
})

io.on('connection', function (socket) {
  console.log(`${socket.handshake.query.token} connected`);
  socket.join(socket.handshake.query.token)
  socket.emit('server', serverName)


  // socket.emit('my-name-is', serverName);

  // var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('send-message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.to(data).emit('message', 'hardcoded response');
  });

  // when the client emits 'add user', this listens and executes
  // socket.on('add user', function (username) {
  //   if (addedUser) return;

  //   // we store the username in the socket session for this client
  //   socket.username = username;
  //   ++numUsers;
  //   addedUser = true;
  //   socket.emit('login', {
  //     numUsers: numUsers
  //   });
  //   // echo globally (all clients) that a person has connected
  //   socket.broadcast.emit('user joined', {
  //     username: socket.username,
  //     numUsers: numUsers
  //   });
  // });

  // when the client emits 'typing', we broadcast it to others
  // socket.on('typing', function () {
  //   socket.broadcast.emit('typing', {
  //     username: socket.username
  //   });
  // });

  // // when the client emits 'stop typing', we broadcast it to others
  // socket.on('stop typing', function () {
  //   socket.broadcast.emit('stop typing', {
  //     username: socket.username
  //   });
  // });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    socket.leaveAll();
  });
});

async function rabitMQ() {
  let connection = await amqp.connect(config.rabitMqUrl)
  let rabbitMqChannel = await connection.createChannel()

  await rabbitMqChannel.assertExchange(`socketMsExchange`, `fanout`, {
    durable: true
  })

  let que = await rabbitMqChannel.assertQueue(``, {
    exclusive: true
  })
  console.log(que);


  rabbitMqChannel.bindQueue(que.queue, `socketMsExchange`, '');


  rabbitMqChannel.consume(que.queue, function (msg) {
    let message = JSON.parse(msg.content.toString())
    console.log(" [x] Received %s", msg.content.toString());
    io.to(message.user).emit('message', message.message);

  }, {
    noAck: true
  });
}

rabitMQ()
