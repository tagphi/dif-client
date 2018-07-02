/**
 * 全局的日志管理工具
 **/
var log4js = require('log4js')
let path = require('path')
let fs = require('fs-extra')

let appDir = path.join(__dirname, '../')

log4js.configure({
  levels: {
    'log_date': 'debug'
  },
  appenders: [{
    type: 'console',
    category: 'console'
  }, {
    type: 'dateFile',
    filename: appDir + 'logs/log', // 您要写入日志文件的路径
    alwaysIncludePattern: true, // （默认为false） - 将模式包含在当前日志文件的名称以及备份中
    pattern: '-yyyy-MM-dd-hh.log', // （可选，默认为.yyyy-MM-dd） - 用于确定何时滚动日志的模式。格式:.yyyy-MM-dd-hh:mm:ss.log
    encoding: 'utf-8', // default "utf-8"，文件的编码
    category: 'log_date'
  }],
  replaceConsole: true
})

;(function init () {
  let logDir = path.join(__dirname, '../logs')
  fs.ensureDirSync(logDir)
})()

module.exports.logger = log4js.getLogger('log_date')
