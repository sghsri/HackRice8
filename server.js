const express = require("express");
const app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var bodyParser = require("body-parser");
var SpotifyWebApi = require('spotify-web-api-node');

const ACCESS_TOKEN = "BQBZgcZ4m94nztwfUFi8cMJHMkjSOEaT0eD9t_yw48zRob7hzpXzeees3Sa-jtKXJf7RVVbwniu_US94Qh5zpBOiLAErzc9DwzQqkkvRRoueMA0rua12cBAnj4CB-aniMhETVkzP33gNc_7sh6eQdufW8c8e6oufQG-nakAV5H6I7990PveFDgoI";
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
    var songIDList = [];
    //console.log(party.spotify_id);
    spotifyApi.getUserPlaylists(party.spotify_id)
        .then(function (data) {
            console.log('Retrieved playlists', data.body);
            var roomid = generateRoomID();
            rooms.push({
                id: roomid,
                playlists: data.body,
                vote: party,
                roomstate: undefined,
                which: [],
                numpeople: 0
            });
            // for(let i = 0; i < data.body.items.length; i++) {
            //     songIDList.push(data.body.items[i].id);
            // }
            songIDList.push('0J6mQxEZnlRt9ymzFntA6z');
            songIDList.push('43ZyHQITOjhciSUUNPVRHc');
            songIDList.push('5xTtaWoae3wi06K5WfVUUH');
            songIDList.push('2YlZnw2ikdb837oKMKjBkW');

            console.log('idList: ' + songIDList);
            console.log(rooms);
            res.send(roomid);
            console.log(`Successfully created a party with id: ${roomid}`);

            /* Get Audio Features for several tracks */
            spotifyApi.getAudioFeaturesForTracks(songIDList)
                .then(function(data) {
                console.log('audio features:::: ' + JSON.stringify(data.body, undefined, 2));
            }, function(err) {
                done(err);
            });
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
    client.on('poll', function (data) {
        io.emit('update');
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