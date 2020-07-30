/*
* 定时器支持工具
* */

function cronTimeFromConfig (configTime) {
  configTime += ''

  // 随机秒数，减少并发概率
  let randomSecs = parseInt(Math.random() * 59)

  return configTime.indexOf('*') !== -1 ? randomSecs + configTime : '*/' + configTime + ' * * * * *';
}

exports.cronTimeFromConfig = cronTimeFromConfig