/* eslint-disable handle-callback-err */

app.controller('HistoryController', function ($q, $scope, $http, $rootScope, $location, $localStorage, $timeout, $interval, $filter, HttpService, ngDialog, alertMsgService, Upload, xutils) {
  // 是否锁定
  $scope.locked = true
  // 是否是观察者
  $scope.watcher = false
  $scope.version = ''

  $scope.selectDataType = 'delta' // 默认选中的标签为

  // 首次加载
  isFirstLoad = true

  /**
   * 投票图标被点击
   **/
  var isVoting = false

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
   * 退出
   */
  $scope.logout = () => {
    HttpService.post('/auth/logout')
      .then(() => xutils.goHome())
      .catch(() => xutils.goHome())
  }

  /**
   * 是否锁定
   **/
  $scope.isLockedPeriod = function () {
    HttpService.post('/blacklist/isLocked')
      .then(({data}) => {
        if (data) $scope.locked = data.locked
      })
  }

  /**
   * 是否是观察者
   **/
  $scope.isWatcher = function () {
    HttpService.post('/auth/watcher')
      .then(({data}) => {
        if (data) $scope.watcher = data.isWatcher
      })
  }

  /**
   * 获取当前版本
   **/
  $scope.isWatcher = function () {
    HttpService.post('/auth/version')
      .then(({data}) => $scope.version = data.version || '')
  }

  /**
   * 初始化入口函数
   */
  function init () {
    // 加载blacklist历史
    $timeout(() => $scope.queryHistories(), 0.5 * 1000)

    $scope.isLockedPeriod()
    $scope.isWatcher()

    // 监听所有面板的选项中页面的变化
    $scope.$watch('showingTab.currentPage', (newCurPage, old) => {
      if (!isFirstLoad) $scope.queryHistories(newCurPage)
    })

    // 监听日期改变
    $scope.$watch('dateRange', () => {
      if (!isFirstLoad) $scope.queryHistories(1)
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
      controller: ['$scope', function ($scope) {
        $scope.selectFileName = '...'

        $scope.prog = 0
        let uploading = false

        $scope.confirmActionText = '上传'
        $scope.dataType = 'delta'
        $scope.uploadFile = undefined

        if ($scope.locked) $scope.selectType = 'publisherIp'

        /**
         * 上传黑名单
         */
        $scope.postBlacklist = function () {
          if (!$scope.uploadFile) {
            $scope.closeThisDialog()
            alertMsgService.alert('请先选择文件', false)
            return
          }

          if (uploading) return
          uploading = true

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
            .progress(e => $scope.prog = parseInt(e.loaded / e.total * 120))
            .success((data) => {
              if (data.success) {
                $timeout(() => {
                  alertMsgService.alert('提交成功', true)
                  $scope.closeThisDialog()
                  $scope.queryHistories(1)
                }, 2000)
              } else {
                $scope.closeThisDialog()
                alertMsgService.alert(data.message, false)
              }

              $timeout(() => uploading = false, 3000)
            })
            .error(() => {
              $scope.closeThisDialog()
              alertMsgService.alert('上传出错', false)
              $timeout(() => uploading = false, 3000)
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
          $scope.selectTypeLabel = '设备ID灰名单'
          break
      }
    }

    let dlgOpts = {
      template: 'views/dlgs/appeal-dlg.html',
      scope: $scope,
      controller: ['$scope', function ($scope) {
        $scope.selectFileName = '...'
        $scope.prog = 0
        $scope.confirmActionText = '上传'
        $scope.dataType = 'appeal'

        let appealing = false

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

          if (appealing) return
          appealing = true

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
            .success(function (data) {
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

              $timeout(() => appealing = false, 3000)
            })
            .error(function () {
              $scope.closeThisDialog()
              alertMsgService.alert('申诉出错', false)
              $timeout(() => appealing = false, 3000)
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

            versionNote: '--',
            pubDateNote: '--',
            validNote: '--', // 有效期

            all: true,
            selectedTypes: TYPES()
          },
          dev: {
            tipNote: '包含了联盟成员最新提交的数据，正在进行审查...',
            countDownNote: '--',

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
          jumpToMergesPage: () => {
            $scope.closeThisDialog()
            xutils.go('/merges')
          }
        }

        function handleVersionInfo (versionInfo) {
          let prod = $scope.downloadDlg.prod
          let dev = $scope.downloadDlg.dev

          let nextPubDate = new Date(versionInfo.nextPubDate)
          let newVersionInYM = xutils.dateToYM(nextPubDate)

          // 发布日期
          if (versionInfo.pubDate) {
            let pubDate = new Date(versionInfo.pubDate)

            prod.pubDateNote = '发布于：' + xutils.dateToFull(pubDate)

            if (xutils.newVersionRule(pubDate)) { // 新版本规则
              prod.versionNote = '版本号：' + newVersionInYM
              prod.validNote = '有效期：' + `${newVersionInYM}01 ~ ${newVersionInYM}${xutils.daysOfMonth(nextPubDate)}`
            } else { // 旧版本规则
              prod.versionNote = '版本号：' + xutils.dateToYMD(pubDate)
              prod.validNote = '有效期：' + `${xutils.dateToYMD(pubDate)}28 ~ ${newVersionInYM}28`
            }
          }

          // 倒计时
          $interval(() => dev.countDownNote = '预计发布时间：' + xutils.dateToFull(nextPubDate) + '，倒计时：' + xutils.leftTime(nextPubDate), 1000)
        }

        $scope.downloadDlg.showTab = $scope.downloadDlg.prod

        // 获取版本信息
        HttpService.post('/blacklist/versionInfo')
          .then(({data: versionInfo, success}) => {
            if (!success) return

            handleVersionInfo(versionInfo)
          })
      }]
    }

    ngDialog.open(dlgOpts)
  }

  $scope.jumpToJobsPage = () => xutils.go('/job-history')

  /**
   * 投票图标被点击
   **/
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
            .then(({success}) => {
              $scope.closeThisDialog()

              if (!success) return alertMsgService.alert('投票失败', false)

              alertMsgService.alert('投票成功', true)
              $scope.queryHistories($scope.showingTab.currentPage)
              isVoting = false
            })
            .catch(() => {
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
  $scope.mouseMoveAgainVote = (hist, action, mouseAction) => {
    if (hist.voteStatus !== 'unvote') {
      hist.showAgree = (action === 'agree' && mouseAction === 'enter')
      hist.showDisagree = (action === 'disagree' && mouseAction === 'enter')
    }
  }

  $scope.mouseInSummary = hist => {
    if (hist.details.summary.length > 30) {
      hist.showSummary = true
    }
  }

  $scope.mouseOutSummary = hist => hist.showSummary = false

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
      .then(function ({data, pageSize, success, total}) {
        let tab = $scope.showingTab

        if (success) {
          data.forEach(function (row) { // 转换时间戳
            let date = new Date()
            date.setTime(row.timestamp)
            row.date = xutils.dateToFull(date)
          })

          tab.histories = data

          // 转换类型
          tab.histories.forEach((hist, id) => hist.type = xutils.type2Name(hist.type))

          // 转换ipfs信息
          if (tab.type === 'appeal') {
            tab.histories.map((hist, id) => {
              let details = hist.details
              details.ipfsInfo = JSON.parse(details.ipfsInfo)

              if (details.summary.length > 30) details.summaryShort = details.summary.substr(0, 30) + '...'
              else details.summaryShort = details.summary
            })
          }

          tab.total = total
          tab.pageSize = pageSize
        } else {
          alertMsgService.alert('获取失败', false)
          tab.histories = []
          tab.total = 0
          tab.pageSize = 5
        }

        if (!pageNO) tab.currentPage = 1

        isFirstLoad = false
      })
      .catch(err => {
        isFirstLoad = false
        alertMsgService.alert(err, false)
      })
  }

  /**
   * 标签选择
   */
  $scope.selectTab = dataType => {
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

      let startDate = xutils.dateToSlashedYMD(xutils.addDays(nowDate, -180))
      let endDate = xutils.dateToSlashedYMD(xutils.addDays(nowDate, 1))

      dataRange = [startDate, endDate]
      $scope.dateRange = startDate + ' - ' + endDate
      return dataRange
    } else {
      dataRange = dataRange.split(' - ')
    }

    return dataRange
  }
})
