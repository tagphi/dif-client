async function call () {
  return 'in'
}

async function outer () {
  return await call()
}

describe('$test groups$', function () {
  it('case 1', async function () {
    console.log(await call() == 'in')
  });
});