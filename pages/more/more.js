//more.js
//获取应用实例
var app = getApp();
Page({
  data: {
    user: {}
  },
  onShow: function(){
    this.getData();
  },
  getData: function(){
    var _this = this;
    var days = ['一','二','三','四','五','六','日'];
    _this.setData({
      'user': app.user
    });
  }
});