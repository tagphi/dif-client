/**
 *  【控制器与路由的通用映射器】
 **/

/**
 *  控制器到路由的映射处理
 *
 *  @param app {Express} express的实例
 *  @param controller {Object} 要映射的控制器
 **/
function controllerToRoutes(app,controller) {
    for (let propName in controller) {
        if (typeof controller[propName] == "function") {
            app.post(controller.BASE_ROUTE+"/"+propName,controller[propName]);
        }
    }
}


module.exports=controllerToRoutes;