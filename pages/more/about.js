//about.js
//获取应用实例
var app = getApp();
Page({
  data: {
    version: '',
    showLog: false
  },
  onLoad: function () {
    this.setData({
      version: app.version,
      year: new Date().getFullYear()
    });
  },
  onShareAppMessage: function () {
    return {
      title: '莞香小喵微信小程序',
      desc: '广科第一个并且唯一一个微信小程序',
      path: '/pages/more/about'
    }
  },
  toggleLog: function () {
    this.setData({
      showLog: !this.data.showLog
    });
  }
});