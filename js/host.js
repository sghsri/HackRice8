$(function () {
    var id = new URL(window.location.href).pathname.split('/')[2];
    getCourse();
    host = location.origin.replace(/^http/, 'ws');
    var socket = io.connect(host);
    socket.on('connect', function (data) {
        socket.emit('join', `${id}`);
    });
    socket.on('updatePoll', function (data) {
        refresh(data);
    });

    function refresh(question) {
        $('#id').text(`id: ${id}`);
        $("#question").text(question.vote.question);
        let arr = question.vote.answers;
        $("p").remove();
        for (var i = 0; i < arr.length; i++) {
            $("#delete").before(
                `<p class='subtitle is-5' style='margin-top:5px;'> ${arr[i].answertext}, votes: ${arr[i].votes}</p>`
            );
        }
    }

    function getCourse() {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var question = JSON.parse(this.responseText);
                console.log(question);
                refresh(question);
            } else if (this.readyState == 4 && this.status == 404) {
                window.location.href = "/*";
            }
        };
        xhttp.open("GET", `/api/party/${id}`, true);
        xhttp.send();
    }

    $("#delete").click(function () {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                window.location.href = `/`;
            } else if (this.readyState == 4 && this.status == 404) {
                window.location.href = "/*";
            }
        };
        xhttp.open("DELETE", `/api/party/${id}`, true);
        xhttp.send();
    });
    $("#share").on({
        mouseenter: function () {
            $(this).html(
                'Click to Copy'
            );
        },
        mouseleave: function () {
            $(this).html('Share Link');
        },
        click: function () {
            var link = (window.location.hostname + window.location.pathname).replace("/host/", "/party/");
            copyToClipboard(link);
            $(this).html(
                'Link Copied!');
        }
    });

    function copyToClipboard(link) {
        let input = document.createElement("input");
        document.body.appendChild(input);
        input.setAttribute('value', link);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
    }
});