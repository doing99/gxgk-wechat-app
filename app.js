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
        _this.processData(data);
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
                iv: info.iv,
                rawData: info.rawData,
                signature: info.signature
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
                    _this.processData(res.data.msg)
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
    _this.user.wxinfo.id = msg.session_id;
    _this.user.school.weeknum = msg.school.weeknum;
    _this.user.school.weekday = msg.school.weekday;
    _this.user.school.term = msg.school.term;
    _this.user.is_bind = msg.is_bind;
    _this.user.is_bind_mealcard = msg.is_bind_mealcard;
    _this.user.is_bind_library = msg.is_bind_library;
    _this.user.is_teacher = msg.is_teacher;
    //当天课表
    _this.user.today_schedule = msg.today_schedule
    if (msg.is_bind) {
      if (msg.is_teacher) {

      } else {
        _this.user.student.name = msg.student.realname;
        _this.user.student.class = msg.student.classname;
        _this.user.student.id = msg.student.studentid;
        _this.user.student.grade = msg.student.studentid.substr(0, 4);
        _this.user.student.dept = msg.student.dept;
        _this.user.student.specialty = msg.student.specialty;
      }
    }
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
  server: require('config').server,
  user: {
    //微信数据
    wxinfo: {},
    //学生\老师数据
    student: {},
    //学校参数
    school: {}
  },
  util: require('./utils/util')
})