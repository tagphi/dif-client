/**
 * 黑名单模块控制器
 **/
class BlacklistController {
    constructor(){
        this.TAG="BlacklistController";
        this.BASE_ROUTE="/blacklist";//模块根路由
    }

    /**
     * 上传黑名单
     **/
    async uploadBlacklist(req,res,next){
        let blacklistCsvFile=req.file;
    }

    /**
     * 下载黑名单
     **/
    async downloadBlacklist(req,res,next){

    }
}

module.exports=BlacklistController;