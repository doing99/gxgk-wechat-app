//app.js
App({
  onLaunch: function () {
    //调用API从本地缓存中获取数据
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    //读取缓存
    try {
      var data = wx.getStorageSync('cache')
      if (data) {
        _this.cache = data;
      }
    } catch (e) { }
  },
  //后台切换至前台时
  onShow: function () {

  },
  //getUser函数，在index中调用
  getUser: function (update_cb, bind) {
    var _this = this;
    wx.login({
      success: function (res) {
        if (res.code) {
          //调用函数获取微信用户信息
          _this.getUserInfo(function (info) {
            _this.user.wxinfo = info.userInfo;
            //发送code与微信用户信息，获取学生数据
            wx.request({
              method: 'POST',
              url: _this.server + '/api/users/get_info',
              data: {
                code: res.code,
                key: info.encryptedData,
                iv: info.iv
              },
              success: function (res) {
                if (res.data.msg != 'error' && res.statusCode >= 200 && res.statusCode < 400) {
                  var status = false;
                  //判断缓存是否有更新
                  if (!_this.cache || _this.cache != res.data.msg) {
                    wx.setStorage({
                      key: "cache",
                      data: res.data.msg
                    });
                    status = true;
                    _this.processData(res.data.msg);
                  }
                  //如果缓存有更新，则执行回调函数
                  if (status) {
                    typeof update_cb == "function" && update_cb();
                  }
                } else {
                  //清除缓存
                  if (_this.cache) {
                    wx.removeStorage({ key: 'cache' });
                    _this.cache = '';
                  }
                }
              },
              fail: function (res) {
                //清除缓存
                if (_this.cache) {
                  wx.removeStorage({ key: 'cache' });
                  _this.cache = '';
                }
              }
            });
          });
        }
        else {
          console.log('获取用户登录态失败！' + res.errMsg)
        }
      }
    });
  },
  getUserInfo: function (cb) {
    //获取微信用户信息
    wx.getUserInfo({
      success: function (res) {
        typeof cb == "function" && cb(res);
      }
    });
  },
  processData: function (msg) {
    var _this = this;
    //var data = JSON.parse(msg);
    //_this.user.is_bind = data.is_bind;
    _this.user.wxinfo.openid = msg.user.openid;
    //_this.user.teacher = data.user.type == '教职工';
    //_this._t = data['\x74\x6f\x6b\x65\x6e'];
    //return data;
  },
  showErrorModal: function (content, title) {
    wx.showModal({
      title: title || '加载失败',
      content: content || '未知错误',
      showCancel: false
    });
  },
  showLoadToast: function (title, duration) {
    wx.showToast({
      title: title || '加载中',
      icon: 'loading',
      duration: duration || 10000
    });
  },
  server: 'https://sr.lastfighting.com',
  user: {
    //微信数据
    wxinfo: {},
    //学生\老师数据
    school: {}
  }
})