//index.js
//获取应用实例
var app = getApp()
Page({
  data: {
    motto: '欢迎进入莞香小喵',
    userInfo: {}
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    this.login();
  },
  login: function () {
    var _this = this;
    //如果有缓存
    if (app.cache) {
      try {
        _this.response();
      } catch (e) {
        //报错则清除缓存
        wx.removeStorage({ key: 'cache' });
      }
    }
    //然后通过登录用户, 如果缓存更新将执行该回调函数
    app.getUser(_this.response);
  },
  response: function () {
    var _this = this;
    _this.setData({
      userInfo: app.user.wxinfo
    });
    //判断绑定状态
    if (app.user.is_bind) {
      _this.setData({
        'remind': '未绑定'
      });
    } else {
      _this.setData({
        'remind': '加载中'
      });
    }
  },
  //下拉更新
  onPullDownRefresh: function () {
    this.login();
  },
})
