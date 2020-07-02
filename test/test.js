/*
    * 是否是新的版本规则
    * 新旧版本日期分界线 2020-06-21
    * 新规则要求本月发布的版本是下个月
    * */
function newVersionRule (date) {
  const dividerDate = 1592668800000
  return date.getTime() > dividerDate
}

/*
* 获取指定日期的月天数
* */
function daysOfMonth (date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

describe('$test groups$', function () {
  it('case 1', async function () {

  });
});