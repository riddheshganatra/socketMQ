var amqp = require('amqplib');
const config = require(`./config.json`)


async function start() {
    let connection = await amqp.connect(config.rabitMqUrl)
    let rabbitMqChannel = await connection.createChannel()

    // rabbitMqChannel.assertQueue(`socketMS`, {
    //     durable: true
    // })
    rabbitMqChannel.assertExchange(`socketMsExchange`, `fanout`, {
        durable: true
    })

    rabbitMqChannel.publish(`socketMsExchange`, '', Buffer.from(JSON.stringify({
        user: `rohit`,
        message: `test`
    })), {
        persistent: true
    });
    rabbitMqChannel.publish(`socketMsExchange`, '', Buffer.from(JSON.stringify({
        user: `riddhesh`,
        message: `test`
    })), {
        persistent: true
    });

    // rabbitMqChannel.consume(`socketMS`, function (msg) {
    //     console.log(" [x] Received %s", msg.content.toString());
    // }, {
    //     noAck: true
    // });

    setTimeout(() => {
        connection.close()
        process.exit(0)
    }, 500);



}

start()