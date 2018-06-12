'use strict';

var express = require('express');
var path = require('path');
var multer = require('multer');

var bodyParser = require('body-parser');

var log4js = require('log4js');
var logger = log4js.getLogger('app');

var CONFIG = require('../config.json');

var app = express();
var upload = multer();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: false
}));

app.listen(CONFIG.site.port, () => console.log('listen ' + CONFIG.site.port + ' , server started!'));

var chaincodeService = require('./services/chaincode-service');

app.post('/chaincode/delta-upload', upload.single('file'), chaincodeService.deltaUpload);
app.get('/chaincode/list-delta-upload-history', chaincodeService.listDeltaUploadHistory);