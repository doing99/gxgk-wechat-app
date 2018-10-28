//append.js
//获取应用实例
var app = getApp();
Page({
  data: {
    remind: '加载中',
    help_status: false,
    title: '',
    form_id: '',
    form_pwd: '',
    bind_type: '',
    userid_focus: false,
    passwd_focus: false,
    userid: '',
    passwd: '',
    angle: 0
  },
  onLoad: function (options) {
    var _this = this;
    app.loginLoad().then(function () {
      _this.setData({
        title: '绑定图书证',
        form_id: '图书证卡号',
        form_pwd: '图书证密码',
        bind_type: 'library'
      })
    });
  },
  onReady: function() {
    var _this = this;
    setTimeout(function() {
      _this.setData({
        remind: ''
      });
    }, 1000);
    wx.onAccelerometerChange(function(res) {
      var angle = -(res.x * 30).toFixed(1);
      if (angle > 14) {
        angle = 14;
      } else if (angle < -14) {
        angle = -14;
      }
      if (_this.data.angle !== angle) {
        _this.setData({
          angle: angle
        });
      }
    });
  },
  bind: function() {
    var _this = this;
    if (app.g_status) {
      app.showErrorModal(app.g_status, '绑定失败');
      return;
    }
    if (!_this.data.userid || !_this.data.passwd) {
      app.showErrorModal('卡号及密码不能为空', '提醒');
      return false;
    }
    wx.showLoading({
      title: '绑定中',
    })
    var data = {
      account: _this.data.userid,
      password: _this.data.passwd
    };
    app.wx_request("/library/xcx_login", 'POST', data).then(function(res) {
      if (res.data && res.data.status === 200) {
        app.showLoadToast('请稍候');
        //清除缓存
        if (app.cache) {
          app.removeCache('ykt');
          app.removeCache('jy');
        }
        wx.hideLoading();
        wx.showToast({
          title: '绑定成功',
          icon: 'success',
          duration: 1500
        });
        setTimeout(function() {
          // 直接跳转回首页
          wx.reLaunch({
            url: '/pages/index/index'
          })
        }, 1500)
      } else {
        wx.hideToast();
        wx.hideLoading();
        app.showErrorModal(res.data.msg, '绑定失败');
      }
    }).catch(function(res) {
      wx.hideToast();
      wx.hideLoading();
      app.showErrorModal(res.errMsg, '绑定失败');
    });
  },
  useridInput: function(e) {
    this.setData({
      userid: e.detail.value
    });
    if (e.detail.value.length >= 18) {
      wx.hideKeyboard();
    }
  },
  passwdInput: function(e) {
    this.setData({
      passwd: e.detail.value
    });
  },
  inputFocus: function(e) {
    if (e.target.id == 'userid') {
      this.setData({
        'userid_focus': true
      });
    } else if (e.target.id == 'passwd') {
      this.setData({
        'passwd_focus': true
      });
    }
  },
  inputBlur: function(e) {
    if (e.target.id == 'userid') {
      this.setData({
        'userid_focus': false
      });
    } else if (e.target.id == 'passwd') {
      this.setData({
        'passwd_focus': false
      });
    }
  },
  tapHelp: function(e) {
    if (e.target.id == 'help') {
      this.hideHelp();
    }
  },
  showHelp: function(e) {
    this.setData({
      'help_status': true
    });
  },
  hideHelp: function(e) {
    this.setData({
      'help_status': false
    });
  }
});