//more.js
//获取应用实例
var app = getApp();
Page({
  data: {
    user: {}
  },
  onShow: function () {
    var _this = this;
    app.getUserInfo(function () {
      _this.getData();
    });
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
      'is_teacher': app.user.is_teacher,
      'is_bind_mealcard': app.user.is_bind_mealcard,
      'is_bind_library': app.user.is_bind_library,
      'school': app.user.school,
      'student': app.user.student,
      'teacher': app.user.teacher,
      'weekday': days[app.user.school.weekday]
    });
  }
});