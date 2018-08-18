//more.js
//获取应用实例
var app = getApp();
Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    hasUserInfo: false
  },
  getUserInfo: function(e) {
    const that = this
    // 授权成功才会返回detail
    if (e.detail.userInfo) {
      that.setData({
        'hasUserInfo': true
      })
      app.getUserInfo(function () {
        wx.navigateBack()
      })
    } else {
      wx.showToast({
        title: '不同意授权无法正常使用小程序哦(′⌒`)',
        icon: 'none',
        duration: 2500
      })
    }
  },
  onShow: function() {
    const that = this
    // 处理基础库等于或低于1.4.0版本,用户点击了授权，也授权成功但getUserInfo没有执行的情况,（open-type="getUserInfo"基础库1.3.0开始有效）
    var myinterval = setInterval(function() {
      wx.getUserInfo({
        success: function(res) {
          clearInterval(myinterval)
          if (!that.data.hasUserInfo) {
            that.setData({
              'hasUserInfo': true
            })
            wx.navigateBack()
          }
        }
      })
    }, 5000)
  },

});