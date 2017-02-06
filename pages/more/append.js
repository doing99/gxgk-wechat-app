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
    if (options.type == 'mealcard') {
      this.setData({
        title: '绑定校园卡',
        form_id: '校园卡卡号',
        form_pwd: '校园卡密码',
        bind_type: 'mealcard'
      })
    }
    //else if (options.type == 'library') {
    else {
      this.setData({
        title: '绑定图书证',
        form_id: '图书证卡号',
        form_pwd: '图书证密码',
        bind_type: 'library'
      })
    }
  },
  onReady: function () {
    var _this = this;
    setTimeout(function () {
      _this.setData({
        remind: ''
      });
    }, 1000);
    wx.onAccelerometerChange(function (res) {
      var angle = -(res.x * 30).toFixed(1);
      if (angle > 14) { angle = 14; }
      else if (angle < -14) { angle = -14; }
      if (_this.data.angle !== angle) {
        _this.setData({
          angle: angle
        });
      }
    });
  },
  bind: function () {
    var _this = this;
    if (!_this.data.userid || !_this.data.passwd) {
      app.showErrorModal('卡号及密码不能为空', '提醒');
      return false;
    }
    app.showLoadToast('绑定中');
    wx.request({
      method: 'POST',
      url: app.server + '/api/users/bind',
      data: {
        session_id: app.user.wxinfo.id,
        from_id: _this.data.userid,
        form_pwd: _this.data.passwd,
        bind_type: _this.data.bind_type
      },
      success: function (res) {
        if (res.statusCode == 200 && res.data.errmsg == 'ok') {
          app.showLoadToast('请稍候');
          //清除缓存
          if (app.cache) {
            app.removeCache('ykt');
            app.removeCache('jy');
          }
          app.getUser(function () {
            wx.showToast({
              title: '绑定成功',
              icon: 'success',
              duration: 1500
            });
            var jump_url = ''; 
            if (!app.user.is_teacher) {
              if (!app.user.is_bind_mealcard) {
                jump_url = 'append?type=mealcard';
              } else if (!app.user.is_bind_library){
                jump_url = 'append?type=library';
              }
              else {
                wx.navigateBack();
                return;
              }
              setTimeout(function () {
                wx.showModal({
                  title: '提示',
                  content: '部分功能需要完善信息才能正常使用，是否前往完善信息？',
                  cancelText: '以后再说',
                  confirmText: '完善信息',
                  success: function (res) {
                    if (res.confirm) {
                      wx.redirectTo({
                        url: jump_url
                      });
                    } else {
                      wx.navigateBack();
                    }
                  }
                });
              }, 1500);
            } else {
              wx.navigateBack();
            }
          });
        } else {
          wx.hideToast();
          app.showErrorModal(res.data.errmsg, '绑定失败');
        }
      },
      fail: function (res) {
        wx.hideToast();
        app.showErrorModal(res.errMsg, '绑定失败');
      }
    });
  },
  useridInput: function (e) {
    this.setData({
      userid: e.detail.value
    });
    if (e.detail.value.length >= 11) {
      wx.hideKeyboard();
    }
  },
  passwdInput: function (e) {
    this.setData({
      passwd: e.detail.value
    });
  },
  inputFocus: function (e) {
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
  inputBlur: function (e) {
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
  tapHelp: function (e) {
    if (e.target.id == 'help') {
      this.hideHelp();
    }
  },
  showHelp: function (e) {
    this.setData({
      'help_status': true
    });
  },
  hideHelp: function (e) {
    this.setData({
      'help_status': false
    });
  }
});