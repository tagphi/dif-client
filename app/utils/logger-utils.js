/**
 * 【日志服务】
 **/

const log4js = require('log4js')
const path = require('path')

// 支持的日志界别
const levels = {
  'trace': log4js.levels.TRACE,
  'debug': log4js.levels.DEBUG,
  'info': log4js.levels.INFO,
  'warn': log4js.levels.WARN,
  'error': log4js.levels.ERROR,
  'fatal': log4js.levels.FATAL
}

log4js.configure({
  appenders: {
    console: {'type': 'console'}, // 控制台输出
    access: { // 访问日志
      type: 'dateFile',
      filename: path.join(__dirname, '../logs/access/acc'), // 需要手动创建此文件夹
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true // 包含模型
    },
    error: { // 访问日志
      type: 'dateFile',
      filename: path.join(__dirname, '../logs/error/err'), // 需要手动创建此文件夹
      pattern: '-yyyy-MM-dd.log',
      alwaysIncludePattern: true // 包含模型
    }
  },
  categories: {
    default: { // debug模式
      appenders: ['console', 'access'],
      level: 'debug'
    },
    err: {
      appenders: ['console', 'error'],
      level: 'error'
    }
  },
  replaceConsole: true // 替换 console.log
})

exports.logger = function () {
  let stackInfos = stackInfo()
  let logger = log4js.getLogger(stackInfos.file)

  // 要包装的日志级别
  logger.info = logWrapper(logger, 'info')
  logger.debug = logWrapper(logger, 'debug')
  logger.error = logWrapper(logger, 'error')
  return logger
}

/**
 * 日志函数包装器
 *
 * @param level {string} 要包装的日志级别，如debug,info等
 **/
function logWrapper (logger, level) {
  logger['old' + level] = logger[level]

  return msg => {
    let stackInfos = stackInfo()
    logger['old' + level](` [${stackInfos.line}:${stackInfos.pos}] ` + msg)
  }
}

/**
 * 追踪日志输出文件名,方法名,行号等信息
 * @returns Object
 */
function stackInfo () {
  let path = require('path')
  let stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/i
  let stackReg2 = /at\s+()(.*):(\d*):(\d*)/i
  let stacklist = (new Error()).stack.split('\n').slice(3)
  let s = stacklist[0]
  let sp = stackReg.exec(s) || stackReg2.exec(s)
  let data = {}

  if (sp && sp.length === 5) {
    data.method = sp[1]
    data.path = sp[2]
    data.line = sp[3]
    data.pos = sp[4]
    data.file = path.basename(data.path)
  }

  return data
}
