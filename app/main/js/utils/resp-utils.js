'use strict';

var errResonse = function(res, msg) {
    var response = {
        success: false,
        message: msg
    };

    res.json(response);
}

exports.errResonse = errResonse;