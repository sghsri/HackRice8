$(function () {
    var socket = io();
    var id = new URL(window.location.href).pathname.split('/')[2];
    update();
    socket.on('update', function (msg) {
        update();
    });


    function update() {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var thequestion = JSON.parse(this.responseText);
                console.log(thequestion);
                $("#question").text(thequestion.vote.question);
                $("#1>.title").text(thequestion.roomstate.track_window.next_tracks[0].name)
                $("#2>.title").text(thequestion.roomstate.track_window.next_tracks[1].name)
                $("#1>.subtitle").text(thequestion.roomstate.track_window.next_tracks[0].artists[0].name);
                $("#2>.subtitle").text(thequestion.roomstate.track_window.next_tracks[1].artists[0].name);

                $(".button").click(function () {
                    socket.emit('voted', {
                        id: id,
                        voted: $(".button").index(this)
                    });
                });
            } else if (this.readyState == 4 && this.status == 404) {
                window.location.href = "/*";
            }
            console.log(this.readyState + " " + this.status);
        };
        xhttp.open("GET", `/api/party/${id}`, true);
        xhttp.send();
    }
});