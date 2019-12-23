function publishDate (monthOffset) {
  monthOffset = monthOffset || 0

  let date = new Date()
  let year = date.getFullYear()
  let month = date.getMonth()
  let curMothDate = new Date(year, month + monthOffset, 20)

  return curMothDate
}

function countdown (delta) {
  let UNIT_SECOND = 1000
  let UNIT_MINUTE = UNIT_SECOND * 60
  let UNIT_HOUR = UNIT_MINUTE * 60

  let hour = Math.floor(delta / UNIT_HOUR)
  let minute = Math.floor((delta - hour * UNIT_HOUR) / UNIT_MINUTE)
  let seconds = Math.floor((delta - hour * UNIT_HOUR - minute * UNIT_MINUTE) / UNIT_SECOND)
  let countdown = hour + ':' + minute + ':' + seconds
  console.log('————>', countdown)
}

function versionFromName (filename) {
  let timestamp = filename.replace('.log', '').split('-')[1]
  let pubDate = new Date(parseInt(timestamp))
  let month = pubDate.getMonth() + 1

  if (month < 10) {
    month = '0' + month
  }

  let version = pubDate.getFullYear() + '' + month + '' + pubDate.getDate()

  return version
}

describe('1', function () {
  it('2', function () {
    let times = 'ip-1574219524511.log'.replace('.log', '').split('-')[1]
    let pubDate = new Date(parseInt(times))
    let month = pubDate.getMonth() + 1
    if (month < 10) {
      month = '0' + month
    }
    let version = pubDate.getFullYear() + '' + month + '' + pubDate.getDate()
    console.log('————>', version)
  })
})
