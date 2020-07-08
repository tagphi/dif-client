function call ({data}) {
  console.log(arguments)
  console.log(data)
}

describe('$test groups$', function () {
  it('case 1', async function () {
    try {
      return
      throw new Error('错粗粮')

      console.log('body')
    } catch (e) {
      console.log('error ->', e)
    } finally {
      console.log('finnaly')
    }
  });
});