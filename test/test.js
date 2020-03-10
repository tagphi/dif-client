function versionFromTimestamp (timestamp, adjustZone) {
  if (adjustZone) {
    timestamp += 1000 * 60 * 60 * 8
  }

  let pubDate = new Date(parseInt(timestamp))
  let month = pubDate.getMonth() + 1

  if (month < 10) {
    month = '0' + month
  }

  let day = pubDate.getDate()

  if (day < 10) {
    day = '0' + day
  }

  let version = pubDate.getFullYear() + '' + month + '' + day

  return version
}

console.log(versionFromTimestamp(1582131600000,true))