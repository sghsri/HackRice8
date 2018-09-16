const express = require("express");
const app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var bodyParser = require("body-parser");
var SpotifyWebApi = require('spotify-web-api-node');

const ACCESS_TOKEN = "BQDNNc_FkPAH2SHFkLs0CLa4bC73mPLbuzabn5tlU6_p9MDYscr7XA00c-WCQI1gh4AbLqKF2vfVlNfMboryu7yuMZ9dVXg3rxKMPPN0KD1vf9ebGML6V8qzmXxk_bAZ0YdbpQy6hP3ZZ-exVbj3ki_fIESFXImaDUvR";
// credentials are optional
var spotifyApi = new SpotifyWebApi({
    clientId: 'bac3e679960b44728036dbc217e16533',
    clientSecret: 'f2d9a60b59334794ab649087b1eaf12b',
    redirectUri: 'https://localhost:3000/main'
});
spotifyApi.setAccessToken(ACCESS_TOKEN);


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
        res.send(JSON.stringify(theroom));
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
            console.log('Retrieved playlists', data.body);
            var roomid = generateRoomID();
            rooms.push({
                id: roomid,
                playlists: data.body,
                vote: party

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
    io.to(party.id).emit('updatePoll', party);
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

    client.on('join', function (data) {
        client.join(data);
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