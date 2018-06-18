//app.js
App({
  version: 'v1.0.3', //版本号
  scene: 1001, //场景值
  shareTicket: null, //分享获取相同信息所需ticket
  onLaunch: function (options) {
    var _this = this;
    if (options.scene) {
      _this.scene = options.scene;
    }
    _this.shareTicket = options.shareTicket;
    //读取缓存
    try {
      var data = wx.getStorageInfoSync();
      if (data && data.keys.length) {
        data.keys.forEach(function (key) {
          var value = wx.getStorageSync(key);
          if (value) {
            _this.cache[key] = value;
          }
        });
        if (_this.cache.version !== _this.version) {
          _this.cache = {};
          wx.clearStorage();
        }
      }
    } catch (e) {
      console.warn('获取缓存失败');
    }
  },
  //保存缓存
  saveCache: function (key, value) {
    if (!key || !value) { return; }
    var _this = this;
    _this.cache[key] = value;
    wx.setStorage({
      key: key,
      data: value
    });
  },
  //清除缓存
  removeCache: function (key) {
    if (!key) { return; }
    var _this = this;
    _this.cache[key] = '';
    wx.removeStorage({
      key: key
    });
  },
  //后台切换至前台时
  onShow: function () {
    this.getUser(function (e) {});
  },
  //判断是否有登录信息，让分享时自动登录
  loginLoad: function (onLoad, share = false) {
    var _this = this;
    if (!_this.user.id) {  //无登录信息
      _this.getUser(function (e) {
        typeof onLoad == "function" && onLoad(e);
      });
    } else {
      //有登录信息,检查微信session是否过期
      typeof onLoad == "function" && onLoad();
    }
  },
  //getUser函数，在index中调用
  getUser: function (response) {
    var _this = this;
    wx.showNavigationBarLoading();
    wx.login({
      success: function (res) {
        if (res.code) {
          wx.request({
            method: 'POST',
            url: _this.server + '/login',
            data: {
              code: res.code
            },
            success: function (res) {
              if (res.data && res.data.status === 200) {
                var data = res.data.data;
                _this.user.id = data.session_id;
                _this.user.wxinfo = data.userinfo;
                _this.banner_show = data.is_show_banner;
                // 未绑定，跳转到登录
                if (!_this.user.wxinfo || !data.is_bind) {
                  wx.navigateTo({
                    url: '/pages/more/login'
                  });
                }
                _this.user.is_admin = data.is_admin;
                _this.user.is_bind = data.is_bind;
                if (data.is_bind) {
                  _this.processData(data.bind_info);
                }
                typeof response == "function" && response();
              } else {
                //清除缓存
                if (_this.cache) {
                  _this.cache = {};
                  wx.clearStorage();
                }
                _this.user.wxinfo = null;
                typeof response == "function" && response(res.data.message || '加载失败');
              }
            },
            fail: function (res) {
              var status = '';
              // 判断是否有缓存
              console.warn(res);
              if (_this.cache.version === _this.version) {
                status = '离线缓存模式';
              } else {
                status = '网络错误';
              }
              _this.g_status = status;
              typeof response == "function" && response(status);
              console.warn(status);
            },
            complete: function () {
              wx.hideNavigationBarLoading();
            }
          });
        }
        else {
          console.log('获取用户登录态失败！' + res.errMsg)
        }
      }
    });
  },
  processData: function (msg) {
    var _this = this;
    _this.user.school = msg.school_info;
    _this.user.is_bind_library = msg.is_bind_library;
    _this.user.is_teacher = msg.is_teacher;
    if (msg.is_teacher) {
      _this.user.teacher = msg.teacher;
    }
    else {
      _this.user.student = msg.student;
    }
  },
  getUserInfo: function (cb) {
    //等待重构
    var _this = this;
    if (!_this.user.wxinfo) {
      //获取微信用户信息
      wx.getUserInfo({
        success: function (res) {
          var info = res;
          _this.saveCache('userinfo', info);
          _this.user.wxinfo = info.userInfo;
          if (!info.encryptedData || !info.iv) {
            _this.g_status = '无关联AppID';
            typeof response == "function" && response(_this.g_status);
            return;
          }
          wx.request({
            method: 'POST',
            url: _this.server + '/api/users/get_userinfo',
            data: {
              session_id: _this.user.id,
              key: info.encryptedData,
              iv: info.iv,
              rawData: info.rawData,
              signature: info.signature
            },
            success: function (res) {
              if (res.data && res.data.status === 200) {
                typeof cb == "function" && cb(1);
              }
            },
            fail: function (res) {
              typeof cb == "function" && cb(0);
            },
            complete: function () {
            }
          });

        },
        fail: function (res) {
          if (wx.openSetting) {
            wx.showModal({
              title: '授权失败',
              content: '已拒绝授权，小程序无法正常运行，是否打开设置允许授权',
              confirmColor: "#1f7bff",
              showCancel: true,
              success: function (res) {
                if (res.confirm) {
                  wx.openSetting({
                    success: function (res) {
                      if (res.authSetting['scope.userInfo']) {
                        //回调重新授权
                        _this.getUserInfo(cb)
                      } else {
                        _this.showErrorModal('已拒绝授权，无法获取用户信息', '授权失败');
                      }
                    }
                  })
                } else if (res.cancel) {
                  console.log('用户点击取消')
                }
              }
            });
          } else {
            _this.showErrorModal('已拒绝授权，无法获取用户信息', '授权失败');
          }
          _this.g_status = '未授权';
        }
      });
    } else {
      typeof cb == "function" && cb();
    }
  },
  sendGroupMsg(shareTicket) {
    var _this = this;
    wx.getShareInfo({
      shareTicket: shareTicket,
      success: function (res) {
        wx.request({
          url: _this.server + '/api/get_group_msg',
          method: 'POST',
          data: {
            session_id: _this.user.id,
            roomTopic: res.roomTopic,
            rawData: res.rawData,
            signature: res.signature,
            encryptedData: res.encryptedData,
            iv: res.iv
          },
          success: function (res) {
            //console.log(res);
          }
        });
      }
    })
  },
  showErrorModal: function (content, title) {
    wx.showModal({
      title: title || '加载失败',
      content: content || '未知错误',
      confirmColor: "#1f7bff",
      showCancel: false
    });
  },
  showLoadToast: function (title, duration) {
    wx.showToast({
      title: title || '加载中',
      icon: 'loading',
      mask: true,
      duration: duration || 10000
    });
  },
  cache: {},
  server: require('config').server,
  user: {
    //微信数据
    wxinfo: {},
    //学生数据
    student: {},
    //教师数据
    teacher: {},
    //学校参数
    school: {}
  },
  banner_show: false,
  util: require('./utils/util')
})