let CronJob = require('cron').CronJob

function call (a = {}) {
  console.log(a)
}

describe('$test groups$', function () {
  it('case 1', async function () {
     call()
  });
});

