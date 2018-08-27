/* eslint-disable handle-callback-err */
app.controller('HistoryController', function ($q, $scope, $http, $rootScope, $location, $localStorage, $timeout, $filter, HttpService, ngDialog, alertMsgService, Upload) {
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

  $scope.selectDataType = 'delta' // 默认选中的标签为
  $scope.showblacklist = true
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
        $scope.dataType = $scope.dataType || 'ip'
      }]
    }

    ngDialog.open(dlgOpts)
  }

  /**
   * 投票图标被点击
   **/
  var isVoting = false
  $scope.clickVoteHand = function (hist, action) {
    if (hist.details.status === 0) { // 尚未投票过
      action = action === 'agree' ? '1' : '0'
      let appealKey = hist.details.key

      let payload = {key: appealKey, action: action}
      isVoting = true
      HttpService.post('/blacklist/voteAppeal', payload)
        .then(function (respData) {
          if (!respData.success) return alertMsgService.alert('投票失败', false)

          alertMsgService.alert('投票成功', true)
          $scope.queryHistories($scope.showingTab.currentPage)
          isVoting = false
        })
        .catch(function (err) {
          alertMsgService.alert('投票失败', false)
          isVoting = false
        })
    }
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

    HttpService.post('/blacklist/histories', payload)
      .then(function (respData) {
        if (respData.success) {
          respData.data.forEach(function (row) { // 转换时间戳
            let date = new Date()
            date.setTime(row.timestamp)
            row.date = $filter('date')(date, 'yyyy-MM-dd HH:mm:ss')
          })

          $scope.showingTab.histories = respData.data
          // 转换ipfs信息
          if ($scope.showingTab.type === 'appeal') {
            $scope.showingTab.histories.map(function (hist, id) {
              hist.details.ipfsInfo = JSON.parse(hist.details.ipfsInfo)
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
