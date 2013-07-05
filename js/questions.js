$(document).bind("pageinit", function() {
    $('#prev-asked').on("pagebeforeshow", setPrevAskedData);
    $('#home').on("pagebeforeshow", homeLoaded);
    $('#ask').on("pagebeforeshow", askLoaded);
});

function clearAllMessageBoxes() {
    $('#home-error').css('display', 'none');
    $('#home-error').html('');
    $('#home-message').css('display', 'none');
    $('#home-message').html('');
}

function homeLoaded() {
    window.db.transaction(function(tx) {
        tx.executeSql('SELECT * FROM logged_user', [], function(tx, results) {
            $('#home_name').html(results.rows.item(0).full_name);
            $('#available_coins').html(results.rows.item(0).remaining_coins);
            window.availableCoins = results.rows.item(0).remaining_coins;
        }, null);
    });
}

function askLoaded() {
    // Reset homepage boxes
    clearAllMessageBoxes();

    // Set slider available coins
    $('#ask-coins').attr('max', window.availableCoins);
    $('#ask-coins').attr('value', Math.round(window.availableCoins / 2));
    $("#ask-coins").slider("refresh");
    
    // Reset form
    $('#question-preview').html('Question preview...');
    $('#question-preview').hide();
    $('#ask-form').trigger("reset");
}

////////////////////////////////// Answer others /////////////////////////////////
function getRandomQuestion(cameFromHome) {
    clearAllMessageBoxes();
    $.ajax({
        type: "GET",
        url: window.backendServerAddress + 'questions/rand',
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        complete: function() { $.mobile.loading('hide'); },
        beforeSend: function(data) {
            $.mobile.loading('show');
            $('#answer-question').html('');
            $('#answer-option-1').attr('src', '');
            $('#answer-option-2').attr('src', '');
            $('#vote-link-1').data('qid', 0);
            $('#vote-link-2').data('qid', 0);
        },
        success: function(data) {

            $('#answer-question').html(data.question_string);
            $('#answer-option-1').attr('src', data.image_1);
            $('#answer-option-2').attr('src', data.image_2);
            $('#vote-link-1').data('qid', data._id);
            $('#vote-link-2').data('qid', data._id);

            if (cameFromHome) {
                // Redirect to the prev asked page
                $.mobile.changePage("#answer", {
                    transition: "slide",
                    reverse: false,
                    changeHash: true
                });
            }
        },
        error: function(data) {
            $('#home-error').css('display', 'block');
            $('#home-error').html(data.responseText);

            if (cameFromHome === false) {
                $.mobile.changePage("#home", {
                    transition: "slide",
                    reverse: false,
                    changeHash: true
                });
            }
        }
    });
}

function vote(opt) {
    if (opt != 1 && opt != 2)
        return;

    $.ajax({
        type: "POST",
        url: window.backendServerAddress + 'questions/vote',
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        data: {question_id: $('#vote-link-' + opt).data('qid'), image_voted: opt},
        success: function(data) {
            window.availableCoins++;
            window.db.transaction(function(tx) {
                tx.executeSql('UPDATE logged_user SET remaining_coins = ' + window.availableCoins);
            });

            getRandomQuestion(false);
        },
        error: function(data) {
            $('#home-error').css('display', 'block');
            $('#home-error').html(data.responseText);
        }
    });


}


////////////////////////////////// Previously asked questions /////////////////////////////////
var prevAskedTotalNum = 0;
var prevAskedCurr = 1;
var prevAskedQuestions = new Array(); // ["Which street looks longer?", "Where are there more cars?", "Where would you like to live?"];
var prevAskedVotesTotalReq = new Array(); // [75, 65, 95];
var prevAskedVotesTotalReceived = new Array(); // [63, 53, 95];
var prevAskedVotesAns1 = new Array(); // [30, 30, 27];
var prevAskedVotesAns2 = new Array(); // [33, 23, 68];
var prevAskedVotesImg1 = new Array(); // ["img/temp_1.jpg", "img/temp_2.jpg", "img/temp_1.jpg"];
var prevAskedVotesImg2 = new Array(); // ["img/temp_2.jpg", "img/temp_1.jpg", "img/temp_2.jpg"];


// This function will be called upon moving from home to prev asked page in order to reset the curr page counter
function moveFromHomeToPrevAsked() {
    // Reset homepage boxes
    clearAllMessageBoxes();

    // Reset prev asked counter
    prevAskedCurr = 1;

    // Retrieve data
    $.ajax({
        type: "GET",
        url: window.backendServerAddress + 'questions/user',
        crossDomain: true,
        async: false,
        xhrFields: {
            withCredentials: true
        },
        success: function(data) {
            result = jQuery.parseJSON(data);
            prevAskedTotalNum = 0;
            for (var i in result) {
                prevAskedQuestions.push(result[i].question_string);
                prevAskedVotesTotalReq.push(result[i].required_answers);
                prevAskedVotesTotalReceived.push(result[i].image_1_votes + result[i].image_2_votes);
                prevAskedVotesAns1.push(result[i].image_1_votes);
                prevAskedVotesAns2.push(result[i].image_2_votes);
                prevAskedVotesImg1.push(result[i].image_1);
                prevAskedVotesImg2.push(result[i].image_2);
                prevAskedTotalNum++;
            }

            // Redirect to the prev asked page
            $.mobile.changePage("#prev-asked", {
                transition: "slide",
                reverse: false,
                changeHash: true
            });
        },
        error: function(data) {
            $('#home-error').css('display', 'block');
            $('#home-error').html(data.responseText);
        }
    });
}

// Callback function references the event target and adds the 'swipe' class to it
function prevAskedSwipeLeftHandler(event) {
    event.stopImmediatePropagation();
    moveToPrevPrevAskedQuestion();
}

// Callback function references the event target and adds the 'swipe' class to it
function prevAskedSwipeRightHandler(event) {
    event.stopImmediatePropagation();
    moveToNextPrevAskedQuestion();
}
function moveToNextPrevAskedQuestion() {
    // For safety...
    if (prevAskedCurr >= prevAskedTotalNum) {
        return;
    }

    prevAskedCurr++;
    $.mobile.changePage("#prev-asked", {
        transition: "slidefade",
        reverse: false,
        changeHash: true,
        allowSamePageTransition: true
    });
}

function moveToPrevPrevAskedQuestion() {
    // For safety...
    if (prevAskedCurr <= 1) {
        return;
    }

    prevAskedCurr--;
    $.mobile.changePage("#prev-asked", {
        transition: "slidefade",
        reverse: true,
        changeHash: true,
        allowSamePageTransition: true
    });
}

function setPrevAskedData() {

    $('#prev-asked').addClass('ui-page-active');

    var questionIndex = prevAskedCurr - 1;
    $("#current-question-num").html(prevAskedCurr);
    $("#total-questions-num").html(prevAskedTotalNum);

    $("#curr-prev-asked-question").html(prevAskedQuestions[questionIndex]);

    $("#votes-number-1").html(prevAskedVotesAns1[questionIndex]);
    if (prevAskedVotesTotalReceived[questionIndex] > 0)
        var ans1Percent = Math.round(prevAskedVotesAns1[questionIndex] / prevAskedVotesTotalReceived[questionIndex] * 100);
    else
        var ans1Percent = 0;
    $("#votes-percentages-1").html(ans1Percent);

    $("#prev-answer-img-1").attr("src", prevAskedVotesImg1[questionIndex]);

    var ans2Percent = 100 - ans1Percent;
    if (prevAskedVotesTotalReceived[questionIndex] == 0)
        ans2Percent = 0;
    $("#votes-percentages-2").html(ans2Percent);
    $("#votes-number-2").html(prevAskedVotesAns2[questionIndex]);

    $("#prev-answer-img-2").attr("src", prevAskedVotesImg2[questionIndex]);

    $("#received-votes").html(prevAskedVotesTotalReceived[questionIndex]);
    $("#expected-votes").html(prevAskedVotesTotalReq[questionIndex]);

    // Bind the swipeHandler callback function to the swipe event on div.box 
    // We will want to add the swipe bindings and the swipe arrows only on the question which aren't on the edges.
    if (prevAskedCurr > 1) { // Add left (prev) nevigation
        $("#prev-asked").on('swiperight', prevAskedSwipeLeftHandler);
        $("#left-swipe-icon").show();
    } else { // remove
        $("#prev-asked").off('swiperight', prevAskedSwipeLeftHandler);
        $("#left-swipe-icon").hide();
    }

    if (prevAskedCurr < prevAskedTotalNum) { // Add right (next) nevigation
        $("#prev-asked").on('swipeleft', prevAskedSwipeRightHandler);
        $("#right-swipe-icon").show();
    } else { // remove
        $("#prev-asked").off('swipeleft', prevAskedSwipeRightHandler);
        $("#right-swipe-icon").hide();
    }

}

////////////////////////////////// Ask a question /////////////////////////////////
var ask_form = $("#ask-form");
ask_form.validate({
    ignore: ".ignore",
    rules: {
        'ask-question': {
            required: true,
            range: [1, 4]
        },
        'ask-uploadPreview1': {
            required: true,
            minlength: 1
        },
        'ask-uploadPreview2': {
            required: true,
            minlength: 1
        }
    },
    messages: {
        'ask-question': 'Please choose a question',
        'ask-uploadPreview1': 'Please upload photo #1.',
        'ask-uploadPreview2': 'Please upload photo #2.'
    },
    submitHandler: function() {
        $.ajax({
            type: "POST",
            url: window.backendServerAddress + 'questions',
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            complete: function() { $.mobile.loading('hide'); },
            beforeSend: function(data) { $.mobile.loading('show', { text: "Submitting question, please wait" }); },
            data: {question_string: finalQuestionToBeSent,
                required_answers: $('#ask-coins').val(),
                image_1: $('#uploadPreview1').attr('src'),
                image_2: $('#uploadPreview2').attr('src')},
            success: function(data) {
                window.availableCoins -= $('#ask-coins').val();
                window.db.transaction(function(tx) {
                    tx.executeSql('UPDATE logged_user SET remaining_coins = ' + window.availableCoins);
                });

                /* Reset form */
                finalQuestionToBeSent = null;
                $('#ask-question').val('');
                $('#ask-coins').val('');
                $('#uploadPreview1').attr('src', 'img/chooseImage1.png');
                $('#uploadPreview2').attr('src', 'img/chooseImage2.png');

                /* Set confirmation message */
                $('#home-message').html('Hooray! Question submitted sucessfully.');
                $('#home-message').css('display', 'block');

                /* Back to homepage */
                $.mobile.back();
            },
            error: function(data) {

                alert(data.responseText);
            }
        })
    }
});

function showImage(files, uploadPreviewId) {
    $('#' + uploadPreviewId).attr('src', 'img/loading.gif');
    $('#ask-' + uploadPreviewId).val('OK'); // used for jQuery validator
    var file = files[0];
    oFReader = new FileReader();
    oFReader.readAsDataURL(file);
    oFReader.onload = function(oFREvent) {
        $('#' + uploadPreviewId).attr('src', oFREvent.target.result);
        
        // used for jQuery validator
        $('#ask-' + uploadPreviewId).val('OK'); 
    };
}

function fileLoad(fileSelectorId) {
    $('#' + fileSelectorId).click();
}

finalQuestionToBeSent = null;
function updateQuestionPreview() {
    var currValue = $('#ask-completion').val();
    if (!currValue) {
        $('#question-preview').html('Question preview...');
    } else {
        var question = $("#ask-question option:selected").text().replace(/[_]+\?/g, "");
        $('#question-preview').html(question + currValue + '?');
    }
    finalQuestionToBeSent = $('#question-preview').html();
}

/* Ask a question form - control the visibility of the completion field */
function updateAskCompletionVisibility(value) {
    switch (value)
    {
        case '1':
            // Fall through
        case '2':
            // Fall through
        case '3':
            $('#ask-completion-container').show();
            $('#question-preview').show();
            $('#ask-completion').focus();
            updateQuestionPreview();
            break;
        default:
            $('#ask-completion-container').hide();
            $('#question-preview').hide();
            finalQuestionToBeSent = $("#ask-question option:selected").text();
    }
}