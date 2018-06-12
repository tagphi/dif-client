/**
 * csv文件助手
 **/

var fs=require("fs");
var path=require("path");


/**
 * 将csv文件转换格式化的字符串
 **/
function csvToFormattedStr(filepath) {
   let data=fs.readFileSync(filepath).toString();
   let dataLines=data.split("\n");

    let formattedDataStr = "";

    dataLines.forEach((line) =>  {
        formattedDataStr += line + "\t" + "1" + "\n";
    });

    return formattedDataStr;
}


exports.csvToFormattedStr=csvToFormattedStr;
