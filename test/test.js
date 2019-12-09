function publishDate (monthOffset) {
  monthOffset = monthOffset || 0

  let date = new Date()
  let year = date.getFullYear()
  let month = date.getMonth()
  let curMothDate = new Date(year, month + monthOffset, 20)

  return curMothDate
}

function countdown(delta){
  let UNIT_SECOND = 1000
  let UNIT_MINUTE = UNIT_SECOND * 60
  let UNIT_HOUR = UNIT_MINUTE * 60

  let hour = Math.floor(delta / UNIT_HOUR)
  let minute = Math.floor((delta - hour * UNIT_HOUR) / UNIT_MINUTE)
  let seconds = Math.floor((delta - hour * UNIT_HOUR - minute * UNIT_MINUTE)/UNIT_SECOND)
  let countdown = hour + ':' + minute + ':' + seconds
  console.log('————>',countdown)
}

describe('1', function () {
  it('2', function () {
    countdown(10000)
  })
})
