/**
 * 数组工具
 **/

/**
 * 合并并去重复
 **/
function mergeWithoutDup (...arrs) {
  let mergedSet = new Set()

  arrs.forEach(arr => {
    arr.forEach(item => {
      mergedSet.add(item)
    })
  })

  let mergedSortedArr = Array.from(mergedSet).sort()
  return mergedSortedArr
}

exports.mergeWithoutDup = mergeWithoutDup
