const express = require("express");
const app = express();
var server = require('http').createServer(app);
var bodyParser = require("body-parser");
var io = require('socket.io')(server);


var rooms = [];

app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept"
        );
        next();
    })
    .use(express.static(__dirname))
    .use(bodyParser.json());

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});
app.get("/client", (req, res) => {
    res.sendFile(__dirname + "/client.html");
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});

io.on('connection', function (client) {
    console.log('Client connected...');
    client.on('player', function (data) {
        console.log("hello");
        io.emit('pause');
    });
    client.on('join', function (data) {
        client.join(data);
    });

});


function getRoom(roomid) {
    for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].id == roomid) {
            return rooms[i];
        }
    }
    return -1;
}

function generateRoomID() {
    var roomid = getIDString();
    while (!isUniqueID(roomid)) {
        roomid = getIDString();
    }
    return roomid;
}

function getIDString() {
    return Math.random()
        .toString(36)
        .slice(-6)
        .toLowerCase();
}

function isUniqueID(roomid) {
    for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].id == roomid) {
            return false;
        }
    }
    return true;
}