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
      app.getUserInfo().then(function () {
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