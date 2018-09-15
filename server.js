const express = require("express"); // Express web server framwork
const app = express();
var request = require('request'); // "Request" library
var server = require('http').createServer(app);
var cookieParser = require('cookie-parser');
var querystring = require('querystring');
var io = require('socket.io')(server);

var rooms = [];

const client_id = 'bac3e679960b44728036dbc217e16533'; // Your client id
const client_secret = 'f2d9a60b59334794ab649087b1eaf12b'; // Your secret
const redirect_uri = 'http://localhost:3000/main' // Your redirect uri

var stateKey = 'spotify_auth_state';

var refresh_token;
var access_token;
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept"
        );
        next();
    })
    .use(express.static(__dirname))
    .use(cookieParser());

app.get('/client', (req, res) => {
    res.sendFile(__dirname + "/client.html");
});

app.get('/login', function(req, res) {

    console.log('calling LOGIN');
    
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/main', function(req, res) {

    console.log('calling MAIN');

    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    console.log(JSON.stringify(req.query, undefined, 2));
    console.log(JSON.stringify(req.cookies, undefined, 2));

    if (state === null || state !== storedState) {
        res.redirect('/#' +
        querystring.stringify({
            error: 'state_mismatch'
        }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {

                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { 'Authorization': 'Bearer ' + access_token},
                    json: true
                };

                // use the access token to access the Spotify Web API
                request.get(options, function(error, response, body) {
                    console.log(body);
                });

                // we can also pass the token to the browser to make requests from there
                res.redirect('/#' +
                querystring.stringify({
                    access_token: access_token,
                    refresh_token: refresh_token
                }));
            } else {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
        })
    }
});

app.get('/refresh_token', function(req, res) {

    console.log('calling REFRESH_TOKEN!');

    // requesting access token from refresh token
    refresh_token = req.query.refresh_token;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            access_token = body.access_token;
            res.send({
                'access_token': access_token
            });
        }
    });
});

app.get('/get_creds', function(req, res) {

    console.log('calling GET_CREDS');

    res.send({
        'access_token': access_token,
        'refresh_token': refresh_token });
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
    client.on('room_state', function (data) {
        let room = getRoom(data.roomid);
        if (room) {

        } else {
            rooms.push(data);
        }
        console.log(rooms);
    });
});

function Room(roomid, people, playlist, current, next, prevSongs) {
    this.roomid = roomid;
    this.people = people;
    this.playlist = playlist;
    this.current = current;
    this.next = next;
    this.prevSongs
}

function getRoom(roomid) {
    for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].id == roomid) {
            return rooms[i];
        }
    }
    return;
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