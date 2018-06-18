//login.js
//获取应用实例
var app = getApp();
Page({
  data: {
    school: ['广东科技学院'],
    index: 0,
    usertype: [
      { name: '0', value: '学生', checked: 'true' },
      { name: '1', value: '教师' },
      { name: '2', value: '部门' },
    ],
    remind: '加载中',
    help_status: false,
    userid_focus: false,
    passwd_focus: false,
    userid: '',
    passwd: '',
    utype: 0,
    angle: 0
  },
  onReady: function () {
    var _this = this;
    setTimeout(function () {
      if (app.user.id) {
        _this.setData({
          remind: ''
        });
      }
      else {
        _this.setData({
          remind: '网络错误，请稍后再试'
        });
      }
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
  onLoad: function (options) {
    var _this = this;
    app.loginLoad(function () {
      _this.loginHandler.call(_this);
    });
  },
  loginHandler: function () {
    var _this = this;
    wx.request({
      method: 'POST',
      url: app.server + '/gxcat/school-list',
      data: {
        session_id: app.user.id,
      },
      success: function (res) {
        if (res.data && res.data.status === 200) {
          _this.setData({
            school: res.data.data.school
          })
        }
      }
    });
  },
  bind: function () {
    var _this = this;
    //判断用户是否授权获取用户信息
    if (!_this.data.userid || !_this.data.passwd) {
      app.showErrorModal('账号及密码不能为空', '提醒');
      return false;
    }
    wx.showLoading({
      title: '绑定中',
    })
    wx.request({
      method: 'POST',
      url: app.server + '/gxcat/school/bind',
      data: {
        session_id: app.user.id,
        from_id: _this.data.userid,
        form_pwd: _this.data.passwd,
        school: _this.data.school[_this.data.index],
        form_utype: _this.data.utype
      },
      success: function (res) {
        if (res.data && res.data.status === 200) {
          app.showLoadToast('请稍候');
          //清除缓存
          if (app.cache) {
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
              } else if (!app.user.is_bind_library) {
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
          app.showErrorModal(res.data.message, '绑定失败');
        }
      },
      fail: function (res) {
        wx.hideToast();
        app.showErrorModal(res.errMsg, '绑定失败');
      },
      complete: function (res) {
        wx.hideLoading()
      }
    });
  },
  schoolPickerChange: function (e) {
    this.setData({
      index: e.detail.value
    })
  },
  radioChange: function (e) {
    this.setData({
      utype: e.detail.value
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