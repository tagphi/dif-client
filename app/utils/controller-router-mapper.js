/**
 *  【控制器与路由的通用映射器】
 **/

let asyncWrapper=require("express-async-wrapper");

/**
 *  控制器到路由的映射处理
 *
 *  @param app {Express} express的实例
 *  @param controller {Object} 要映射的控制器
 *  @param excludeProps {Array} 要排除的属性，自定义处理
 **/
function controllerToRoutes(app,controller,excludeProps) {
    for (let propName in controller) {
        if (excludeProps && excludeProps.indexOf(propName)!=-1){
            continue;
        }

        if (typeof controller[propName] == "function") {
            app.post(controller.BASE_ROUTE+"/"+propName,asyncWrapper(controller[propName]));
        }
    }
}


module.exports=controllerToRoutes;