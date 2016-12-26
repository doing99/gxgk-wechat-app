//about.js
//获取应用实例
var app = getApp();
Page({
  data: {
    showLog: false
  },
  onLoad: function(){

  },
  onShareAppMessage: function () {
    return {
      title: '莞香小喵小程序',
      desc: '广科第一个微信小程序',
      path: '/page/more/about'
    }
  },
  toggleLog: function(){
    this.setData({
      showLog: !this.data.showLog
    });
  }
});