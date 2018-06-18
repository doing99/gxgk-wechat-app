//more.js
//获取应用实例
var app = getApp();
Page({
  data: {
    user: {}
  },
  onShow: function () {
    var _this = this;
    app.getUserInfo(function (res) {
      _this.getData();
    });
  },
  getData: function () {
    var _this = this;
    _this.setData({
      'user': app.user
    });
  }
});