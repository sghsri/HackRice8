$(function () {
    $("#addMore").click(e => {
        $("#addMore").before(
            "<label class='subtitle'>Answer: </><input style = 'margin-left:5px; width:80%' placeholder='because...'class='input' type='text' name='answer'></><br><br>"
        );
    });
    $("#create").click(e => {
        var party = {
            question: $("#question").val(),
            answers: []
        }
        if (party.question.length > 0) {
            if ($('input[name="answer"]').length) {
                $('input[name="answer"]').each(function () {
                    party.answers.push({
                        answertext: $(this).val(),
                        votes: 0
                    })
                });
                var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200) {
                        console.log(this.responseText);
                        window.location.href = `/host/${this.responseText}`;
                    }
                };
                xhttp.open("POST", `/create`, true);
                xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                xhttp.send(JSON.stringify(party));
            } else {
                alert("Must have at least 1 answer choice!");
            }
        } else {
            alert("Must have a Question!");
        }
    });
});