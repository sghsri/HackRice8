const express = require("express");
const app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var bodyParser = require("body-parser");
var SpotifyWebApi = require('spotify-web-api-node');

const ACCESS_TOKEN = "BQBrBmdD0Ko2to7ycPQW7AJpozKZgV1_psYf24Ulkw8yn-tRdWyFM5MA_QzFOkXkWqkOEjcx5APhBxgWuZUnq85X_-IuAQCQ4fhp-rmM8e6G_ME_Rqy68w8fJTWM9C-li6UEgtAI5s1W1vCCisQBqDnsYp9A7Z-NG16cQ9k";
// credentials are optional
var spotifyApi = new SpotifyWebApi({
    clientId: 'bac3e679960b44728036dbc217e16533',
    clientSecret: 'f2d9a60b59334794ab649087b1eaf12b',
    redirectUri: 'https://localhost:3000/'
});

//var code = 'BQD3g76qrzRG0ZlktktE7vUKdm2IdYOPzoB_g9MspI0rzJMC-ZIpqF6COWPI4sFkz87Fmusk_SsLan8Zw99pcJ7fwivdu9H_OZIx7dtky8Ig7zMhXy4bHPJUp7kV37N6DdMOKmBjgO4dbwQ2wSlM3d2A5RSW5WhF1AcqeiA';
spotifyApi.setAccessToken(ACCESS_TOKEN);
// https://accounts.spotify.com:443/authorize?client_id=5fe01282e44241328a84e7c5cc169165&response_type=code&redirect_uri=https://example.com/callback&scope=user-read-private%20user-read-email&state=some-state-of-my-choice

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
app.get("/create/", (req, res) => {
    res.sendFile(__dirname + "/create.html");
});
app.get("/party/:id", (req, res) => {
    res.sendFile(__dirname + "/party.html");
});
app.get("/host/:id", (req, res) => {
    res.sendFile(__dirname + "/host.html");
});


app.get("/api/party/:id", (req, res) => {
    var roomid = req.params.id;
    var theroom = rooms.find(x => {
        return x.id == roomid;
    });
    if (!theroom) {
        return res.status(404).send(`Could not find a room with id ${roomid}`);
    } else {
        res.send((theroom));
    }
});
app.get("*", (req, res) => {
    res.sendFile(__dirname + "/error.html");
});

app.post("/create", (req, res) => {
    var party = req.body;
    //console.log(party.spotify_id);
    spotifyApi.getUserPlaylists(party.spotify_id)
        .then(function (data) {
            var roomid = generateRoomID();
            rooms.push({
                id: roomid,
                playlists: data.body,
                vote: party,
                roomstate: undefined,
                which: [],
                numpeople: 0
            });
            console.log(rooms);
            res.send(roomid);
            console.log(`Successfully created a party with id: ${roomid}`);
        }, function (err) {
            console.log('Something went wrong!', err);
        });
});

app.post("/join/:id", (req, res) => {
    var roomid = req.params.id;
    var theroom = rooms.find(x => {
        return x.id == roomid;
    });
    if (!theroom) {
        return res.status(404).send(`Could not find a room with id ${roomid}`);
    } else {
        res.send(theroom);
    }
});

app.put("/party/:id", (req, res) => {
    var party = req.body;
    console.log(party.vote.answers);
    var foundIndex = rooms.findIndex(x => x.id == req.params.id);
    rooms[foundIndex] = party;
    io.emit('update', party);
    res.send("updated");
    console.log("updated host");
});

app.delete("/api/party/:id", (req, res) => {
    var roomid = req.params.id;
    var theroom = rooms.indexOf(x => {
        return x.id == roomid;
    })
    if (theroom) {
        rooms.splice(theroom, 1);
        res.send(`removed ${roomid}`);
        console.log(`removed ${roomid}`);

    } else {
        res.send(`could not find ${roomid}`);
    }
});
io.on('connection', function (client) {
    console.log('Client connected...');

    client.on('room_state', function (data) {
        var roomid = data.id;
        var theroom = rooms.find(x => {
            return x.id == roomid;
        });
        if (theroom) {
            theroom.roomstate = data.roomstate;
            // console.log(theroom);
        }
    });
    client.on('voted', function (data) {
        console.log(data);
        io.emit('voted', data.voted);
        // var roomid = data.id;
        // var theroom = rooms.find(x => {
        //     return x.id == roomid;
        // });
        // if (theroom) {
        //     theroom.roomstate = data.roomstate;
        //     console.log(theroom);
        // }
    });

});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});

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