'use strict'

var errResonse = function (res, msg) {
  var response = {
    success: false,
    message: msg
  }

  res.json(response)
}

var succResponse = function (res, msg, data) {
  var respData = {
    success: true,
    message: msg
  }
  if (data) {
    respData.data = data
  }

  res.json(respData)
}

exports.errResonse = errResonse
exports.succResponse = succResponse
