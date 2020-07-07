function call ({data}) {
  console.log(arguments)
  console.log(data)
}

describe('$test groups$', function () {
  it('case 1', async function () {
    call()
  });
});