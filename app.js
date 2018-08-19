//app.js
App({
  version: 'v2.0.0', //版本号
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
          _this.user.wx_info = _this.cache.wx_info;
          _this.user.auth_user = _this.cache.auth_user;
          _this.user.student = _this.cache.student;
          _this.user.teacher = _this.cache.teacher;
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
  onShow: function() {},
  //判断是否有登录信息，让分享时自动登录
  loginLoad: function() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      if (!_this.session_id) { //无登录信息
        _this.session_login().then(function() {
          _this.is_login = true
          resolve();
        }).catch(function(res) {
          reject(res);
        });
      } else if (!_this.is_login) { //有登录信息,并且为初始化程序
        _this.check_session().then(function() {
          _this.is_login = true
          resolve();
        }).catch(function(res) {
          reject(res);
        })
      } else {
        resolve();
      }
    })
  },
  wx_request: function(enpoint, method, data) {
    // 全局网络请求封装
    var _this = this;
    return new Promise(function(resolve, reject) {
      const session_id = wx.getStorageSync('session_id')
      let header = {}
      if (session_id) {
        header = {
          'content-type': 'application/json',
          'session-id': session_id
        }
      }
      wx.request({
        url: _this.server + enpoint,
        data: data || '',
        method: method || 'GET',
        header: header,
        success: function(res) {
          resolve(res);
        },
        fail: function(res) {
          _this.showLoadToast("网络出错")
          reject(res);
        }
      });
    })
  },
  check_session: function() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      wx.checkSession({
        success: function() {
          wx.request({
            url: _this.server + '/mini_program/check_session',
            data: {
              'session_id': _this.session_id
            },
            method: "POST",
            success: function(res) {
              if (!res.data) {
                // 网络出错
                _this.showLoadToast("服务器出错")
                reject();
              } else {
                if (res.data.status == 200) {
                  console.log("session状态有效")
                  resolve();
                } else if (res.data.status == 403) {
                  _this.session_login().then(function() {
                    resolve();
                  });
                }
              }
            },
            fail: function(res) {
              _this.showLoadToast("网络出错")
              reject(res);
            }
          });
        },
        fail: function() {
          // 没有登录微信
          _this.session_login().then(function() {
            reject();
          });
        }
      })
    });
  },
  session_login: function() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      wx.showNavigationBarLoading();
      wx.login({
        success: function(res) {
          wx.request({
            method: 'POST',
            url: _this.server + '/mini_program/session_login',
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
                  _this.getUserInfo().then(function() {
                    resolve()
                  });
                } else {
                  console.log("session登陆成功")
                  resolve();
                }
              } else {
                //清除缓存
                if (_this.cache) {
                  _this.cache = {};
                  wx.clearStorage();
                }
                reject();
              }
            },
            fail: function(res) {
              var status = '';
              // 判断是否有缓存
              console.warn(res);
              _this.g_status = '网络错误';
              console.warn(status);
              reject(res);
            },
            complete: function() {
              wx.hideNavigationBarLoading();
            }
          });
        }
      });
    })
  },
  getUserInfo: function() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      //获取微信用户信息
      wx.getUserInfo({
        success: function(res) {
          var info = res;
          // _this.user.wxinfo = info.userInfo;
          if (!info.encryptedData || !info.iv) {
            reject('无关联AppID');
            return;
          }
          wx.request({
            method: 'POST',
            url: _this.server + '/mini_program/wechat_login',
            data: {
              session_id: _this.session_id,
              key: info.encryptedData,
              iv: info.iv,
              rawData: info.rawData,
              signature: info.signature
            },
            success: function(res) {
              if (res.data && res.data.status === 200) {
                console.log("获取用户信息成功")
                resolve(res);
              } else {
                _this.showLoadToast("服务器异常")
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
          reject(res);
        }
      });
    })
  },
  initWechatUser: function() {
    // 获取必要的微信信息
    var _this = this;
    return new Promise(function(resolve, reject) {
      _this.wx_request("/mini_program/wechat_user").then(function(res) {
        if (res.data.status === 200) {
          _this.user.wx_info = res.data.data;
          _this.saveCache('wx_info', res.data.data);
          resolve();
        } else {
          reject(res);
        }
      }).catch(function(res) {
        reject(res);
      })
    })
  },
  initSchoolUser: function() {
    // 获取必要的绑定信息
    var _this = this;
    return new Promise(function(resolve, reject) {
      _this.wx_request("/school_sys/user_info").then(function(res) {
        if (res.data.status === 200) {
          var data = res.data.data;
          _this.auth_user = data.auth_user;
          _this.saveCache('auth_user', data.auth_user);
          if (_this.auth_user.user_type === 0) {
            _this.saveCache('student', data.user_info);
            _this.user.student = data.user_info;
          } else if (_this.auth_user.user_type === 1) {
            _this.saveCache('teacher', data.user_info);
            _this.user.teacher = data.user_info;
          }
          resolve();
        } else {
          reject(res);
        }
      }).catch(function(res) {
        reject(res);
      })
    })
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
  is_login: false,
  user: {
    //微信数据
    wxinfo: {},
    //认证数据
    auth_user: {},
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