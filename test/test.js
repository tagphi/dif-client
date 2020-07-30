let CronJob = require('cron').CronJob

function call (a = {}) {
  console.log(a)
}

describe('$test groups$', function () {
  it('case 1', async function () {
    let date = new Date()
    console.log(new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 24,17)))
  });
});

