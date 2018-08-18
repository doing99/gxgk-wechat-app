//app.js
App({
  version: 'v1.0.3', //版本号
  scene: 1001, //场景值
  shareTicket: null, //分享获取相同信息所需ticket
  onLaunch: function(options) {
    var _this = this;
    if (options.scene) {
      _this.scene = options.scene;
    }
    _this.shareTicket = options.shareTicket;
    //读取缓存
    try {
      var data = wx.getStorageInfoSync();
      if (data && data.keys.length) {
        data.keys.forEach(function(key) {
          var value = wx.getStorageSync(key);
          if (value) {
            _this.cache[key] = value;
          }
        });
        if (_this.cache.version !== _this.version) {
          _this.cache = {};
          wx.clearStorage();
        } else {
          _this.session_id = _this.cache.session_id;
        }
      }
    } catch (e) {
      console.warn('获取缓存失败');
    }
  },
  //保存缓存
  saveCache: function(key, value) {
    if (!key || !value) {
      return;
    }
    var _this = this;
    _this.cache[key] = value;
    wx.setStorage({
      key: key,
      data: value
    });
  },
  //清除缓存
  removeCache: function(key) {
    if (!key) {
      return;
    }
    var _this = this;
    _this.cache[key] = '';
    wx.removeStorage({
      key: key
    });
  },
  //后台切换至前台时
  onShow: function() {

  },
  //判断是否有登录信息，让分享时自动登录
  loginLoad: function(onLoad) {
    var _this = this;
    if (!_this.session_id) { //无登录信息
      _this.session_login(function(e) {
        typeof onLoad == "function" && onLoad(e);
      });
    } else { //有登录信息
      _this.check_session(function(e) {
        typeof onLoad == "function" && onLoad();
      })
    }
  },
  wx_request: (enpoint, method, data, suceess_cb, fail_cb) => {
    const session_id = wx.getStorageSync('session_id')
    let header = {}
    if (session_id) {
      header = {
        'content-type': 'application/json',
        'session_id': session_id
      }
    }
    wx.request({
      url: _this.server + enpoint,
      data: data || '',
      method: method || 'GET',
      header: header,
      success: function(res) {
        suceess_cb && suceess_cb(res)
      },
      fail: function(res) {
        fail_cb && fail_cb(res)
      }
    });
  },
  check_session: function(response) {
    var _this = this;
    wx.checkSession({
      success: function() {
        wx.request({
          url: _this.server + '/check_session',
          data: {
            'session_id': _this.session_id
          },
          method: "POST",
          success: function(res) {
            if (!res.data) {
              // 网络出错
              _this.showLoadToast("服务器出错")
            } else {
              if (res.data.status == 200) {
                _this.is_login = true
                console.log("session状态有效")
                typeof response == "function" && response(res)
              } else if (res.data.status == 403) {
                _this.session_login(response);
              }
            }
          },
          fail: function(res) {
            _this.showLoadToast("网络出错")
          }
        });
      },
      fail: function () {
        // 没有登录微信
        _this.session_login(response);
      }
    })
  },
  session_login: function(response) {
    var _this = this;
    wx.showNavigationBarLoading();
    wx.login({
      success: function(res) {
        wx.request({
          method: 'POST',
          url: _this.server + '/session_login',
          data: {
            code: res.code
          },
          success: function(res) {
            if (res.data && res.data.status === 200) {
              var status = false,
                data = res.data.data;
              //判断缓存是否有更新
              if (_this.cache.version !== _this.version) {
                _this.saveCache('version', _this.version);
                status = true;
              }
              _this.saveCache('session_id', data.session_id);
              _this.session_id = data.session_id;
              if (data.login_require) {
                _this.getUserInfo(function() {
                  _this.is_login = true
                  typeof response == "function" && response();
                });
              } else {
                _this.is_login = true
                console.log("session登陆成功")
                typeof response == "function" && response();
              }
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
          fail: function(res) {
            var status = '';
            // 判断是否有缓存
            console.warn(res);
            _this.g_status = '网络错误';
            typeof response == "function" && response(status);
            console.warn(status);
          },
          complete: function() {
            wx.hideNavigationBarLoading();
          }
        });
      }
    });
  },
  getUserInfo: function(cb) {
    var _this = this;
    //获取微信用户信息
    wx.getUserInfo({
      success: function(res) {
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
          url: _this.server + '/wechat_login',
          data: {
            session_id: _this.session_id,
            key: info.encryptedData,
            iv: info.iv,
            rawData: info.rawData,
            signature: info.signature
          },
          success: function(res) {
            if (res.data && res.data.status === 200) {
              _this.is_login = true
              console.log("获取用户信息成功")
              typeof cb == "function" && cb();
            } else {
              _this.showLoadToast("服务器异常，请稍后再试")
            }
          },
          fail: function(res) {
            _this.showLoadToast("网络出错")
          },
          complete: function() {}
        });
      },
      fail: function(res) {
        // 提示用户授权页面
        _this.g_status = '未授权';
        wx.navigateTo({
          url: '/pages/authorize/index'
        });
      }
    });
  },
  initUserData: function() {
    var _this = this;
    _this.wx_request()
  },
  showErrorModal: function(content, title) {
    wx.showModal({
      title: title || '加载失败',
      content: content || '未知错误',
      confirmColor: "#1f7bff",
      showCancel: false
    });
  },
  showLoadToast: function(title, duration) {
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
  // 是否已经登录
  is_login: false,
  banner_show: false,
  util: require('./utils/util')
})