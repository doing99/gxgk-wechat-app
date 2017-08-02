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
    var days = ['日', '一', '二', '三', '四', '五', '六'];
    _this.setData({
      'user': app.user,
      'weekday': days[app.user.school.weekday]
    });
  }
});