describe('$test groups$', function () {
  it('case 1', async function () {
    let callInner

    function outer () {
      let num = 2

      callInner = function () {
        num++
        console.log(callInner, num)
      }
    }

    outer()

    console.log(callInner())
    console.log(callInner())
    console.log(callInner())
    console.log(callInner())
    console.log(callInner())
  });
});