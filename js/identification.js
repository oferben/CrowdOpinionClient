/* Check if the user is logged in or not upon app initialization */
$(document).bind("pageinit", function() {
    function isLoggedIn() {
        var loggedIn = false;
        $.ajax({
            type: "GET",
            url: window.backendServerAddress + 'users/isloggedin',
            crossDomain: true,
            async: false,
            xhrFields: {
                withCredentials: true
            },
            success: function(data) {
                loggedIn = true;
            },
            error: function (data) {
                loggedIn = false;
            }
         });
         return loggedIn;
    }
    
    $('#loading').on('pageshow',function() {
        var initial = '#login';
        if(isLoggedIn()) {
            initial = '#home';
        }
        window.location = initial;
    });
});

function resetLoginMessageBoxes() {
    $('#login-error').html('');
    $('#signup-error').html('');
    $('#login-message').html('');
    $('#login-error').css('display','none');
    $('#signup-error').css('display','none');
    $('#login-message').css('display','none');
}

/* Set default error messages */
jQuery.extend(jQuery.validator.messages, {
    required: "This field is required.",
    equalTo: "Password fields do not match.",
    email: "Please enter a valid email."
});

/* Login form */
var login_form = $("#login-form");
login_form.validate({
    submitHandler: function() {
        $.ajax({
            type: "POST",
            url: window.backendServerAddress + 'users/login',
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            beforeSend: function() {
                resetLoginMessageBoxes();
                $.mobile.loading('show');
            },
            complete: function() { $.mobile.loading('hide'); },
            data: { email_address: $('#login-email').val(),
                    password: $('#login-password').val() },
            success: function(data) {
                $('#login-email').val('');
                $('#login-password').val('');
                window.db.transaction(function (tx) {
                    tx.executeSql('CREATE TABLE IF NOT EXISTS logged_user (email_address, full_name, remaining_coins)');
                    tx.executeSql('DELETE FROM logged_user');
                    tx.executeSql('INSERT INTO logged_user (email_address, full_name, remaining_coins) VALUES (\'' + window.escapeString(data.email_address) + '\', \'' + window.escapeString(data.full_name) + '\', \'' + window.escapeString(data.remaining_coins) + '\')');
                });
                window.availableCoins = data.remaining_coins;
               window.location = '#home';
            },
            error: function (data) {
               /* Display error message */
               $('#login-error').css('display','block');
               $('#login-error').html(data.responseText);
            }
         });
    }
});

/* Signup form */
var signup_form = $("#signup-form");
signup_form.validate({
    rules: {
        'signup-fullname': {
          required: true,
          minlength: 3
        },
        'signup-email': {
          required: true,
        },
        'signup-password': {
          required: true,
          minlength: 3
        },
        'signup-password2': {
            required: true,
            equalTo: "#signup-password"
        }
    },
    submitHandler: function() {
         $.ajax({
            type: "POST",
            url: window.backendServerAddress + 'users',
            crossDomain: true,
            beforeSend: function() {
                resetLoginMessageBoxes();
                $.mobile.loading('show');
            },
            complete: function() { $.mobile.loading('hide'); },
            data: { email_address: $('#signup-email').val(),
                    full_name: $('#signup-fullname').val(),
                    password: $('#signup-password').val() },
            success: function(data) {

               /* Add success message to login screen */
               $('#login-message').css('display','block');
               $('#login-message').html('Welcome to CrowdOpinion. Please sign up with your newly created account.');

               /* Clear and set login screen form */
               $('#login-email').val($('#signup-email').val());
               $('#login-password').val('');

               /* Redirect to login screen */
               window.location = '#login';

               /* Clear signup & login form */
               $('#signup-email').val('');
               $('#signup-fullname').val('');
               $('#signup-password').val('');
               $('#signup-password2').val('');
            },
            error: function (data) {
               /* Display error message */
               $('#signup-error').css('display','block');
               $('#signup-error').html(data.responseText);
            }
         })
    }
});

function logout() {
    $.ajax({
        type: "POST",
        url: window.backendServerAddress + 'users/signout',
        crossDomain: true,
        async: false,
        xhrFields: {
            withCredentials: true
        },
        success: function(data) {            
            /* Clear data */
            $('#home_name').html('');
            $('#available_coins').html('');
            window.availableCoins = 0;
            window.db.transaction(function (tx) {
                tx.executeSql('DROP TABLE logged_user');
            });
            
            /* Redirect to login screen */
            $('#login-message').css('display','block');
            $('#login-message').html('Thank you for using CrowdOpinion. You have been logged out.');
            window.location = '#login';
            $.mobile.changePage( "#dialog", { role: "dialog" } );
        }
     });
}