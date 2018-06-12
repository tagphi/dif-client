/**
 * 文件上传助手
 **/

var path = require("path");
var multer=require("multer");

/**
 * 初始化上传助手
 **/
function initUploadHelper() {
    let uploadDir = path.join(__dirname, "../../upload");

    var storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, uploadDir)
        },
        filename: function (req, file, callback) {
            callback(null, file.originalname)
        }
    })

    let multerOpts = {
        dest: uploadDir,
        storage: storage,
        limits: {
            fileSize: 1000*1024  //限制为 1 M
        }
    };

    let uploadHelper = multer(multerOpts);
    return uploadHelper;
}

module.exports=initUploadHelper();


