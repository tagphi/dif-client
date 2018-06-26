app.directive('ngDatePicker', function() {
    return {
        restrict: 'A',
        require: '?ngModel',
        scope: {
            ngModel: '=',
            maxDate: '@',
            minDate: '@'
        },
        link: function(scope, element, attr, ngModel) {
            var _date = null,
                _config = {};

            if (!attr.id) {
                element.attr('id', '_laydate' + (Date.now()));
            }
            
            // 日期配置参数
            _config = {
                elem: '#' + element.attr('id'),
                // format: attr.hasOwnProperty('format') && attr.format ? attr.format : 'YYYY-MM-DD',
                format:'yyyy/MM/dd',
                done: function(value, date, endDate) {
                    scope.$apply(setDateVal);
                }
            }


            if (attr.hasOwnProperty('minDate') && attr.minDate != null) {
                _config.min = attr.minDate
            }

            if (attr.hasOwnProperty('maxDate') && attr.maxDate != null) {
                _config.max = attr.maxDate
            }

            if (attr.hasOwnProperty('dateType') && attr.dateType != null) {
                _config.type = attr.dateType
            }

            if (attr.hasOwnProperty('range') && attr.range != null) {
                _config.range = attr.range === 'true' ? true : false
            }

            // 初始化日期
            _date = laydate.render(_config);

            // 监听 maxDate 变化
            if (attr.hasOwnProperty('maxDate')) {
                attr.$observe('maxDate', function(val) {
                    _config.max = val;
                })
            }

            // 监听 minDate 变化
            if (attr.hasOwnProperty('minDate')) {
                attr.$observe('minDate', function(val) {
                    _config.min = val;
                })
            }

            // 监听输入框 时刻同步 $viewValue 和 DOM节点的value
            ngModel.$render = function() {
                element.val(ngModel.$viewValue || '');
            };

            // 监听输入框 时刻同步 $viewValue 和 DOM节点的value
            element.on('blur keyup change', function() {
                scope.$apply(setDateVal);
            });

            setDateVal();

            // 同步 DOM节点的value 到 $viewValue 
            function setDateVal() {
                var val = element.val();
                ngModel.$setViewValue(val);
            }
        }
    }
})