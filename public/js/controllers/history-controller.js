/* eslint-disable handle-callback-err */

app.controller('HistoryController', function ($q, $scope, $http, $rootScope, $location, $localStorage, $timeout, $interval, $filter, HttpService, ngDialog, alertMsgService, Upload, xutils) {
  /**
   * 退出
   */
  $scope.logout = function () {
    HttpService.post('/auth/logout')
      .then(function (respData) {
        $location.path('/')
      })
      .catch(function (err) {
        console.log(err)
        $location.path('/')
      })
  }

  /**
   * 是否锁定
   **/
  $scope.isLockedPeriod = function () {
    $scope.locked = true
    HttpService.post('/blacklist/isLocked')
      .then(function (respData) {
        if (respData.data) {
          $scope.locked = respData.data.locked
        }
      })
  }

  /**
   * 是否是观察者
   **/
  $scope.isWatcher = function () {
    $scope.watcher = false
    HttpService.post('/auth/watcher')
      .then(function (respData) {
        if (respData.data) {
          $scope.watcher = respData.data.isWatcher
        }
      })
  }

  $scope.selectDataType = 'delta' // 默认选中的标签为
  let initDateRange = ''

  /**
   * 面板状态
   */
  $scope.showingTab = {
    type: 'delta', // 默认黑名单
    histories: [], // 历史数据
    memberName: undefined,// 成员名

    total: 0, // 总历史记录数
    pageSize: 10,
    currentPage: 1 // 页面指针
  }

  /**
   * 初始化入口函数
   */
  function init () {
    // 加载blacklist历史
    $timeout(function () {
      $scope.queryHistories()
    }, 0.5 * 1000)

    $scope.isLockedPeriod()
    $scope.isWatcher()

    // 监听所有面板的选项中页面的变化
    $scope.$watch('showingTab.currentPage', function (newCurPage, old) {
      if (newCurPage === 1 && old === 1) return
      $scope.queryHistories(newCurPage)
    })

    // 监听日期改变
    $scope.$watch('dateRange', function () {
      if ($scope.dateRange === initDateRange) return

      $scope.queryHistories(1)
      initDateRange = ''
    })
  }

  init()

  /**
   * 上传黑名单对话框
   */
  $scope.openUploadDlg = function () {
    let dlgOpts = {
      template: 'views/dlgs/upload-dlg.html',
      scope: $scope,
      controller: ['$scope', 'HttpService', function ($scope, HttpService) {
        $scope.selectFileName = '...'
        $scope.prog = 0
        $scope.confirmActionText = '上传'
        $scope.dataType = 'delta'

        if ($scope.locked) {
          $scope.selectType = 'publisherIp'
        }

        /**
         * 上传黑名单
         */
        $scope.postBlacklist = function () {
          if (!$scope.uploadFile) {
            $scope.closeThisDialog()
            alertMsgService.alert('请先选择文件', false)
            return
          }
          $scope.selectType = $scope.selectType || 'ip'

          let request = {
            url: '/blacklist/upload',
            file: $scope.uploadFile,
            fields: {
              'dataType': $scope.dataType,
              'type': $scope.selectType
            }
          }

          Upload.upload(request)
            .progress(function (evt) {
              var prog = parseInt(evt.loaded / evt.total * 120)
              $scope.prog = prog
            })
            .success(function (data, status, headers, config) {
              // $scope.prog = 0

              if (data.success) {
                $timeout(function () {
                  alertMsgService.alert('提交成功', true)
                  $scope.closeThisDialog()
                  $scope.queryHistories(1)
                }, 2000)
              } else {
                $scope.closeThisDialog()
                alertMsgService.alert(data.message, false)
              }
            })
            .error(function () {
              $scope.closeThisDialog()
              alertMsgService.alert('上传出错', false)
            })
        }
      }]
    }
    ngDialog.open(dlgOpts)
  }

  /**
   * 上传申诉列表对话框
   */
  $scope.openAppealDlg = function () {
    if (!$scope.selectType) {
      $scope.selectType = 'ip'
    }

    labelByType($scope.selectType)

    function labelByType (type) {
      switch (type) {
        case 'ip':
          $scope.selectTypeLabel = 'IP黑名单'
          break

        case 'domain':
          $scope.selectTypeLabel = '域名黑名单'
          break

        case 'device':
          $scope.selectTypeLabel = '设备ID黑名单'
          break

        case 'default':
          $scope.selectTypeLabel = '设备ID白名单'
          break
      }
    }

    let dlgOpts = {
      template: 'views/dlgs/appeal-dlg.html',
      scope: $scope,
      controller: ['$scope', 'HttpService', function ($scope, HttpService) {
        $scope.selectFileName = '...'
        $scope.prog = 0
        $scope.confirmActionText = '上传'
        $scope.dataType = 'appeal'

        $scope.chooseAppealType = function (type) {
          labelByType(type)
        }

        /**
         * 上传黑名单
         */
        $scope.postAppealList = function () {
          if (!$scope.uploadFile) {
            $scope.closeThisDialog()
            alertMsgService.alert('请先选择文件', false)
            return
          }

          $scope.selectType = $scope.selectType || 'ip'

          let request = {
            url: '/blacklist/upload',
            file: $scope.uploadFile,
            fields: {
              'dataType': $scope.dataType,
              'type': $scope.selectType,
              'summary': $scope.summary
            }
          }

          Upload.upload(request)
            .progress(function (evt) {
              var prog = parseInt(evt.loaded / evt.total * 120)
              $scope.prog = prog
            })
            .success(function (data, status, headers, config) {
              $scope.prog = 0
              if (data.success) {
                $timeout(function () {
                  alertMsgService.alert('提交成功', true)
                  $scope.closeThisDialog()
                  $scope.queryHistories(1)
                }, 2000)
              } else {
                $scope.closeThisDialog()
                alertMsgService.alert(data.message, false)
              }
            })
            .error(function () {
              $scope.closeThisDialog()
              alertMsgService.alert('申诉出错', false)
            })
        }
      }]
    }
    ngDialog.open(dlgOpts)
  }

  /**
   * 下载对话框
   */
  $scope.openDownloadDlg = function () {
    let dlgOpts = {
      template: 'views/dlgs/download-dlg.html',
      scope: $scope,
      controller: ['$scope', 'HttpService', function ($scope, HttpService) {
        const TYPES = function () {
          return ['default', 'ip', 'device', 'domain', 'ua_spider', 'ua_client']
        }

        $scope.downloadDlg = {
          showTab: undefined,
          tab: 'prod',
          prod: {
            prod: true, // 生产面板

            versionNote: undefined,
            pubDateNote: undefined,
            validNote: undefined, // 有效期

            all: true,
            selectedTypes: TYPES()
          },
          dev: {
            tipNote: '包含了联盟成员最新提交的数据，正在进行审查...',
            countDownNote: 'countDownNote202001',

            all: true,
            selectedTypes: TYPES()
          },
          onTabClicked: function (clickedTab) {
            this.tab = clickedTab
            this.showTab = this[this.tab]
          },
          select: function (type) {
            let selectedTypes = this.showTab.selectedTypes

            let id = selectedTypes.indexOf(type)

            if (id !== -1) {
              selectedTypes.splice(id, 1)
            } else {
              selectedTypes.push(type)
            }

            this.showTab.all = selectedTypes.length === 6
          },
          selectAll: function () {
            let all = this.showTab.all = !this.showTab.all
            this.showTab.selectedTypes = !all ? [] : TYPES()
          },
          jumpToMergesPage: function () {
            $scope.closeThisDialog()
            $location.path('/merges')
          }
        }

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

        function handleVersionInfo (versionInfo) {
          let nextPubDate = new Date(versionInfo.nextPubDate)

          // 发布日期
          if (versionInfo.pubDate) {
            let pubDate = new Date(versionInfo.pubDate)

            $scope.downloadDlg.prod.pubDateNote = '发布于：' + $filter('date')(pubDate, 'yyyy/MM/dd HH:mm:ss')

            let versionInYM = $filter('date')(pubDate, 'yyyyMM')
            let newVersionInYM = $filter('date')(nextPubDate, 'yyyyMM')

            if (!newVersionRule(pubDate)) { // 旧规则
              $scope.downloadDlg.prod.versionNote = '版本号：' + versionInYM
              $scope.downloadDlg.prod.validNote = '有效期：' + `${versionInYM}20 ~ ${newVersionInYM}20`
            } else {
              $scope.downloadDlg.prod.versionNote = '版本号：' + newVersionInYM
              $scope.downloadDlg.prod.validNote = '有效期：' + `${newVersionInYM}01 ~ ${newVersionInYM}${daysOfMonth(nextPubDate)}`
            }
          }

          let nextPubDateFormatted = $filter('date')(nextPubDate, 'yyyy/MM/dd HH:mm:ss')
          $scope.downloadDlg.dev.countDownNote = '预计发布时间：' + nextPubDateFormatted

          // 倒计时
          $interval(function () {
            let delta = nextPubDate.getTime() - new Date().getTime()

            let UNIT_SECOND = 1000
            let UNIT_MINUTE = UNIT_SECOND * 60
            let UNIT_HOUR = UNIT_MINUTE * 60

            let hour = Math.floor(delta / UNIT_HOUR)
            let minute = Math.floor((delta - hour * UNIT_HOUR) / UNIT_MINUTE)
            let seconds = Math.floor((delta - hour * UNIT_HOUR - minute * UNIT_MINUTE) / UNIT_SECOND)
            let countdown = hour + ':' + minute + ':' + seconds
            $scope.downloadDlg.dev.countDownNote = '预计发布时间：' + nextPubDateFormatted + '，倒计时：' + countdown
          }, 1000)
        }

        $scope.downloadDlg.showTab = $scope.downloadDlg.prod

        // 获取版本信息
        HttpService.post('/blacklist/versionInfo', undefined)
          .then(function (respData) {
            if (!respData.success) return

            let versionInfo = respData.data

            handleVersionInfo(versionInfo)
          })
      }]
    }

    ngDialog.open(dlgOpts)
  }

  /**
   * 跳转到合并界面
   **/
  $scope.jumpToMergesPage = function () {
    $location.path('/merges')
  }

  $scope.jumpToJobsPage = function () {
    $location.path('/job-history')
  }
  /**
   * 投票图标被点击
   **/
  var isVoting = false
  $scope.clickVoteHand = function (hist, action) {
    // 已经票结束
    if (hist.details.status || hist.selfVoted) return

    // 自己尚未投票过
    let dlgOpts = {
      template: 'views/dlgs/vote-dlg.html',
      scope: $scope,
      controller: ['$scope', 'HttpService', function ($scope, HttpService) {
        $scope.vote = function () {
          action = action === 'agree' ? '1' : '0'
          let appealKey = hist.details.key

          let payload = {key: appealKey, action: action}
          isVoting = true
          HttpService.post('/blacklist/voteAppeal', payload)
            .then(function (respData) {
              $scope.closeThisDialog()

              if (!respData.success) return alertMsgService.alert('投票失败', false)

              alertMsgService.alert('投票成功', true)
              $scope.queryHistories($scope.showingTab.currentPage)
              isVoting = false
            })
            .catch(function (err) {
              $scope.closeThisDialog()
              alertMsgService.alert('投票失败', false)
              isVoting = false
            })
        }
      }]
    }

    ngDialog.open(dlgOpts)
  }

  /**
   * 鼠标在投票手势上的移动事件
   **/
  $scope.mouseMoveAgainVote = function (hist, action, mouseAction) {
    if (hist.voteStatus !== 'unvote') {
      hist.showAgree = (action === 'agree' && mouseAction === 'enter')
      hist.showDisagree = (action === 'disagree' && mouseAction === 'enter')
    }
  }

  $scope.mouseInSummary = function (hist) {
    if (hist.details.summary.length > 30) {
      hist.showSummary = true
    }
  }

  $scope.mouseOutSummary = function (hist) {
    hist.showSummary = false
  }
  /**
   * 查询
   */
  $scope.queryHistories = function (pageNO) {
    // 获取日期范围
    let dataRange = getDateRange()

    let payload = {
      startDate: dataRange[0],
      endDate: dataRange[1]
    }

    if ($scope.memberName) payload.memberName = $scope.memberName

    payload.dataType = $scope.selectDataType
    payload.pageNO = pageNO || $scope.showingTab.currentPage

    let api = $scope.selectDataType === 'publisherIP' ? '/blacklist/publisherIPs' : '/blacklist/histories'

    HttpService.post(api, payload)
      .then(function (respData) {
        if (respData.success) {
          respData.data.forEach(function (row) { // 转换时间戳
            let date = new Date()
            date.setTime(row.timestamp)
            row.date = $filter('date')(date, 'yyyy-MM-dd HH:mm:ss')
          })

          $scope.showingTab.histories = respData.data

          // 转换类型
          $scope.showingTab.histories.forEach((hist, id) => hist.type = xutils.type2Name(hist.type))

          // 转换ipfs信息
          if ($scope.showingTab.type === 'appeal') {
            $scope.showingTab.histories.map(function (hist, id) {
              hist.details.ipfsInfo = JSON.parse(hist.details.ipfsInfo)

              if (hist.details.summary.length > 30) {
                hist.details.summaryShort = hist.details.summary.substr(0, 30) + '...'
              } else {
                hist.details.summaryShort = hist.details.summary
              }
            })
          }
          $scope.showingTab.total = respData.total
          $scope.showingTab.pageSize = respData.pageSize
        } else {
          alertMsgService.alert('获取失败', false)
          $scope.showingTab.histories = []
          $scope.showingTab.total = 0
          $scope.showingTab.pageSize = 5
        }

        if (!pageNO) {
          $scope.showingTab.currentPage = 1
        }
      })
      .catch(function (err) {
        alertMsgService.alert(err, false)
      })
  }

  /**
   * 清空日期
   */
  $scope.clearDate = function () {
    $scope.dateRange = ''
  }

  /**
   * 标签选择
   */
  $scope.selectTab = function (dataType) {
    $scope.selectDataType = dataType
    $scope.showingTab.type = dataType

    // 查询
    $scope.queryHistories()
  }

  /**
   * 获取日期范围
   */
  function getDateRange () {
    let dataRange = $scope.dateRange

    if (!dataRange) { // 默认查询最近半年的记录
      let nowDate = new Date()

      let endDateStr = $filter('date')(new Date(nowDate.setDate(nowDate.getDate() + 1)), 'yyyy/MM/dd')
      let startDateStr = $filter('date')(new Date(nowDate.setDate(nowDate.getDate() - 180)), 'yyyy/MM/dd')

      dataRange = [startDateStr, endDateStr]
      $scope.dateRange = startDateStr + ' - ' + endDateStr
      initDateRange = $scope.dateRange
      return dataRange
    } else {
      dataRange = dataRange.split(' - ')
    }

    return dataRange
  }
})
