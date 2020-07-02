/**
 * 分页器指令
 **/
angular.module('dif').directive('commonPagination', function ($http, $q, $timeout, alertMsgService) {
  return {
    restrict: 'AE',
    templateUrl: 'views/nav/pagination.html',
    scope: {
      total: '=',
      pageSize: '=',

      totalPage: '@',
      currentPage: '=',

      event: '@' // 事件名, 外部调用分页查询的事件,
    },
    link: function (scope, element) {
      // 初始化状态
      scope.total = scope.total || 10
      scope.pageSize = scope.pageSize || 3
      scope.pages = []
      scope.currentPage = 1

      scope.$watch('total', function (newVal, oldVal) {
        // 重置并计算页面
        scope.resetAndCalcPages()
      })

      scope.$watch('pageSize', function (newVal, oldVal) {
        // 重置并计算页面
        scope.resetAndCalcPages()
      })

      /**
       * 选中指定页
       */
      scope.selectPage = function (page) {
        if (scope.currentPage !== page) {
          scope.currentPage = page

          // 重置并计算页面
          scope.resetAndCalcPages(scope.currentPage)
        }
      }

      // 改变页大小
      scope.changePageSize = function (n) {
        scope.pageSize = n
        scope.currentPage = 1
      }

      scope.next = function () {
        if (scope.currentPage < scope.totalPage) {
          scope.currentPage++
          // 重置并计算页面
          scope.resetAndCalcPages(scope.currentPage)
        }
      }

      scope.prev = function () {
        if (scope.currentPage > 1) {
          scope.currentPage--
          // 重置并计算页面
          scope.resetAndCalcPages(scope.currentPage)
        }
      }

      /**
       * 生成页数
       */
      function genPages (curPage, forwordStep, backwordsStep) {
        let pages = []

        if (forwordStep && forwordStep >= 1) {
          for (let i = forwordStep; i > 0; i--) { // 生成小页码
            pages.push(curPage - i)
          }
        }

        pages.push(curPage)

        if (backwordsStep && backwordsStep >= 1) { // 生成大页码
          for (let i = 1; i < backwordsStep; i++) {
            pages.push(curPage + i)
          }
        }

        scope.pages = pages
      }

      /**
       * 重置并计算页面
       */
      scope.resetAndCalcPages = function (curPage = 1) {
        scope.currentPage = curPage
        scope.calcPages()
      }

      // 计算页码
      scope.calcPages = function () {
        let FIXED_PAGES = 5 // 固定页数
        // 计算总页数
        scope.totalPage = Math.ceil(scope.total / scope.pageSize)

        if (scope.totalPage <= 8) { // 8页以下，全部生成
          genPages(scope.currentPage, scope.currentPage - 1, scope.totalPage - scope.currentPage + 1)
        } else { // 8页以上，生成固定页数5
          let isFront = scope.currentPage <= FIXED_PAGES
          let isBackwords = ((scope.totalPage - scope.currentPage) <= FIXED_PAGES)

          // 处于中间
          if (!isFront && !isBackwords) {
            genPages(scope.currentPage, 2, 2) // 前后各移动2步
          }

          // 靠前
          if (isFront) {
            genPages(scope.currentPage, scope.currentPage - 1, FIXED_PAGES - scope.currentPage)
          }

          // 靠后
          if (isBackwords) {
            genPages(scope.currentPage
              , FIXED_PAGES - (scope.totalPage - scope.currentPage)
              , scope.totalPage - scope.currentPage - 1)
          }
        }
      }
    }
  }
})
