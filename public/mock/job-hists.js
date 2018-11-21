/* eslint-disable no-undef,no-use-before-define */
/**
 * 模拟 任务历史列表
 **/
if (!mock) {
  var mock = {}
}

mock.jobHistories = mockJobHists(10)

function mockJobHists (size) {
  let hists = []
  let tmpl = {
    'jobID': 'rejsiojfiesii3939w92',
    'file': 'device-delta-1000.log',
    'type': 'device',
    'opt': '合并',
    'steps': '复制文件',
    'status': '运行中',
    'latestTime': '运行中'
  }

  for (let i = 0; i < size; i++) {
    hists.push(JSON.parse(JSON.stringify(tmpl)))
  }

  return hists
}
