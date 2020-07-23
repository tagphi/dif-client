let CronJob = require('cron').CronJob

//3 1 * * * ?
function onTick () {
  console.log(new Date() + ':ticking')
}

describe('$test groups$', function () {
  it('case 1', async function () {

    console.log(randomSecs)
    new CronJob(randomSecs + ' */1 * * * *', onTick, null, true)
  });
});
