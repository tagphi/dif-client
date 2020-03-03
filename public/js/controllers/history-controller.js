/* eslint-disable handle-callback-err */
app.controller('HistoryController', function ($q, $scope, $http, $rootScope, $location, $localStorage, $timeout, $interval, $filter, HttpService, ngDialog, alertMsgService, Upload) {
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
      preCloseCallback: function () {
        $scope.queryHistories(1)
      },
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
              $scope.prog = 0
              $scope.closeThisDialog()
              if (data.success) {
                alertMsgService.alert('提交成功', true)
                $scope.queryHistories()
              } else {
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
    let dlgOpts = {
      template: 'views/dlgs/appeal-dlg.html',
      scope: $scope,
      preCloseCallback: function () {
        $scope.queryHistories(1)
      },
      controller: ['$scope', 'HttpService', function ($scope, HttpService) {
        $scope.selectFileName = '...'
        $scope.prog = 0
        $scope.confirmActionText = '上传'
        $scope.dataType = 'appeal'

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
              $scope.closeThisDialog()
              if (data.success) {
                alertMsgService.alert('提交成功', true)
                $scope.queryHistories()
              } else {
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
        $scope.downloadDlg = {
          tab: 'prod',
          prod: {
            firstNote: undefined,
            secondNote: undefined,
            all: true,
            selectedTypes: ['default', 'ip', 'device', 'domain', 'ua_spider', 'ua_client']
          },
          dev: {
            firstNote: '包含了联盟成员最新提交的数据，正在进行审查...',
            secondNote: undefined,
            all: true,
            selectedTypes: ['default', 'ip', 'device', 'domain', 'ua_spider', 'ua_client']
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
            let all = !this.showTab.all
            this.showTab.all = all

            if (!all) {
              this.showTab.selectedTypes = []
            } else {
              this.showTab.selectedTypes = ['default', 'ip', 'device', 'domain', 'ua_spider', 'ua_client']
            }
          },
          jumpToMergesPage: function () {
            $scope.closeThisDialog()
            $location.path('/merges')
          }
        }

        $scope.downloadDlg.showTab = $scope.downloadDlg[$scope.downloadDlg.tab]

        function handleVersionInfo (versionInfo) {
          if (versionInfo.pubDate) {
            let pubDate = new Date(versionInfo.pubDate)
            let version = $filter('date')(pubDate, 'yyyyMMdd')
            let pubDateFormatted = $filter('date')(pubDate, 'yyyy/MM/dd HH:mm:ss')
            $scope.downloadDlg.prod.firstNote = '版本号：' + version
            $scope.downloadDlg.prod.secondNote = '发布于：' + pubDateFormatted
          }

          let nextPubDate = new Date(versionInfo.nextPubDate)

          let nextPubDateFormatted = $filter('date')(nextPubDate, 'yyyy/MM/dd HH:mm:ss')

          $scope.downloadDlg.dev.secondNote = '预计发布时间：' + nextPubDateFormatted

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
            $scope.downloadDlg.dev.secondNote = '预计发布时间：' + nextPubDateFormatted + '，倒计时：' + countdown
          }, 1000)
        }

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
          $scope.showingTab.histories.map(function (hist, id) {
            let type = hist.type

            if (!type) {
              return
            }

            switch (type) {
              case 'ip':
                hist.type = 'IP黑名单'
                break

              case 'ua_spider':
                hist.type = 'UA(已知爬虫)'
                break

              case 'ua_client':
                hist.type = 'UA(合规客户端)'
                break

              case 'domain':
                hist.type = '域名黑名单'
                break

              case 'device':
                hist.type = '设备号黑名单'
                break

              case 'default':
                hist.type = '设备号白名单'
                break

              case 'publisher_ip':
                hist.type = 'IP白名单'
                break
            }
          })

          // 转换ipfs信息
          if ($scope.showingTab.type === 'appeal') {
            $scope.showingTab.histories.map(function (hist, id) {
              hist.details.ipfsInfo = JSON.parse(hist.details.ipfsInfo)

              if (hist.details.summary.length > 30) {
                hist.details.summaryShort = hist.details.summary.substr(0, 30) + '...'
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
