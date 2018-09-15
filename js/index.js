function createParty() {
    window.location.href = `/create/`;
}

function joinParty() {
    var room = document.getElementById("joinParty").value;
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            window.location.href = `/party/${room}`;
        } else if (this.readyState == 4 && this.status == 404) {
            alert("No Party with that id could be found");
        }
    };
    xhttp.open("POST", `/join/${room}`, true);
    xhttp.send();
}