/**
 * 假数据生成工具
 **/
let fakeDataUtils=require('./utils/fake-data-utils');




describe("生成假数据",function () {
    it("生成指定数量的device", function () {
        fakeDataUtils.genDevice(10);
    });

    it("生成指定数量的移除device列表", function () {
        fakeDataUtils.genDevice(3,true);
    });
});