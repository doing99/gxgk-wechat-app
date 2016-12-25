//more.js
//获取应用实例
var app = getApp();
Page({
  data: {
    user: {}
  },
  onShow: function () {
    this.getData();
  },
  getData: function () {
    var _this = this;
    var days = ['日', '一', '二', '三', '四', '五', '六'];
    _this.setData({
      'user': app.user
    });
    _this.setData({
      'wxinfo': app.user.wxinfo,
      'is_bind': app.user.is_bind,
      'school': app.user.school,
      'student': app.user.student,
      'weekday': days[app.user.school.weekday]
    });
  }
});