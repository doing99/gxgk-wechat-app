//index.js
//获取应用实例
var app = getApp();
Page({
  data: {
    banner: false,
    offline: false,
    remind: '加载中',
    core: [
      { id: 'kb', name: '课表查询', disabled: false, teacher_disabled: false, offline_disabled: true },
      { id: 'cj', name: '成绩查询', disabled: false, teacher_disabled: true, offline_disabled: false },
      { id: 'kjs', name: '空教室', disabled: false, teacher_disabled: false, offline_disabled: true },
      { id: 'ks', name: '考试安排', disabled: false, teacher_disabled: false, offline_disabled: false },
      { id: 'ykt', name: '一卡通', disabled: false, teacher_disabled: false, offline_disabled: false },
      { id: 'jy', name: '借阅信息', disabled: false, teacher_disabled: false, offline_disabled: false },
      { id: 'xs', name: '学生查询', disabled: false, teacher_disabled: false, offline_disabled: true },
      { id: 'zs', name: '我要找书', disabled: false, teacher_disabled: true, offline_disabled: true }
    ],
    card: {
      'kb': {
        show: false,
        time_list: [
          { begin: '8:30', end: '10:05' },
          { begin: '10:25', end: '12:00' },
          { begin: '14:40', end: '16:15' },
          { begin: '16:30', end: '18:05' },
          { begin: '19:30', end: '21:05' },
        ],
        data: {}
      },
      'ykt': {
        show: false,
        data: {
          'last_time': '',
          'balance': 0,
          'cost_status': false,
          'today_cost': {
            value: [],
            total: 0
          }
        }
      },
      'jy': {
        show: false,
        data: {}
      }
    },
    user: {},
    disabledItemTap: false //点击了不可用的页面
  },
  //分享
  onShareAppMessage: function () {
    return {
      title: '莞香小喵',
      desc: '广东科技学院唯一的小程序',
      path: '/pages/index/index'
    };
  },
  //下拉更新
  onPullDownRefresh: function () {
    if (app.user.is_bind) {
      this.getCardData();
    } else {
      wx.stopPullDownRefresh();
    }
  },
  onShow: function () {
    var _this = this;
    //离线模式重新登录
    if (_this.data.offline) {
      _this.login();
      return false;
    }
    function isEmptyObject(obj) {
      for (var key in obj) {
        return false;
      }
      return true;
    }
    function isEqualObject(obj1, obj2) { if (JSON.stringify(obj1) != JSON.stringify(obj2)) { return false; } return true; }
    var l_user = _this.data.user,  //本页用户数据
      g_user = app.user; //全局用户数据
    //排除第一次加载页面的情况（全局用户数据未加载完整 或 本页用户数据与全局用户数据相等）
    if (!isEmptyObject(l_user) || !g_user.wxinfo.id || isEqualObject(l_user.wxinfo, g_user.wxinfo)) {
      return false;
    }
    //全局用户数据和本页用户数据不一致时，重新获取卡片数据
    if (!isEqualObject(l_user.student, g_user.student)) {
      _this.setData({
        'banner': app.banner_show
      });
      //判断绑定状态
      if (!app.user.is_bind) {
        _this.setData({
          'remind': '未绑定'
        });
      } else {
        _this.setData({
          'remind': '加载中'
        });
        //清空数据
        _this.setData({
          user: app.user,
          'card.kb.show': false,
          'card.ykt.show': false,
          'card.jy.show': false,
          'card.sdf.show': false
        });
        _this.getCardData();
      }
    }
  },
  onLoad: function () {
    this.login();
  },
  login: function () {
    var _this = this;
    //如果有缓存，则提前加载缓存
    if (app.cache.version === app.version) {
      try {
        _this.response();
      } catch (e) {
        //报错则清除缓存
        app.cache = {};
        wx.clearStorage();
      }
    }
    //然后再尝试登录用户, 如果缓存更新将执行该回调函数
    app.getUser(function (status) {
      _this.response.call(_this, status);
    });
  },
  response: function () {
    var _this = this;
    if (status) {
      if (status != '离线缓存模式') {
        //错误
        _this.setData({
          'remind': status
        });
        return;
      } else {
        //离线缓存模式
        _this.setData({
          offline: true
        });
      }
    }
    _this.setData({
      user: app.user,
      'banner': app.banner_show
    });
    //判断绑定状态
    if (!app.user.is_bind) {
      _this.setData({
        'remind': '未绑定'
      });
    } else {
      _this.setData({
        'remind': '加载中'
      });
      _this.getCardData();
    }
  },
  disabled_item: function () {
    var _this = this;
    if (!_this.data.disabledItemTap) {
      _this.setData({
        disabledItemTap: true
      });
      setTimeout(function () {
        _this.setData({
          disabledItemTap: false
        });
      }, 2000);
    }
  },
  getCardData: function () {
    var _this = this;
    var loadsum = 0; //正在请求连接数
    var user = app.user;
    //判断并读取缓存
    if (app.cache.kb) { kbRender(app.cache.kb); }
    if (app.cache.ykt) { yktRender(app.cache.ykt); }
    if (app.cache.jy) { jyRender(app.cache.jy); }
    if (_this.data.offline) { return; }
    wx.showNavigationBarLoading();
    //获取课表数据
    //课表渲染
    function kbRender(info) {
      _this.setData({
        'card.kb.data': info,
        'card.kb.show': true,
        'card.kb.nothing': !info.length,
        'remind': ''
      });
    }
    loadsum++; //新增正在请求连接
    wx.request({
      url: app.server + '/api/users/get_schedule',
      method: 'POST',
      data: {
        session_id: app.user.wxinfo.id,
        week: app.user.school.weeknum,
        weekday: app.user.school.weekday
      },
      success: function (res) {
        if (res.data && res.statusCode == 200) {
          var data = res.data;
          if (data.errmsg != null || data.msg == null) {
            //错误信息
            app.removeCache('kb');
            return;
          }
          else {
            var data = res.data.msg;
            if (data == null) {
              app.removeCache('kb');
            } else {
              app.saveCache('kb', data);
              kbRender(data);
            }
          }
        }
      },
      complete: function () {
        loadsum--; //减少正在请求连接
        if (!loadsum) {
          if (_this.data.remind) {
            _this.setData({
              remind: '首页暂无展示'
            });
          }
          wx.hideNavigationBarLoading();
          wx.stopPullDownRefresh();
        }
      }
    });
    //一卡通渲染
    function yktRender(data) {
      _this.setData({
        'card.ykt.data.outid': data.outid,
        'card.ykt.data.last_time': data.lasttime,
        'card.ykt.data.balance': data.mainFare,
        'card.ykt.show': true,
        'remind': ''
      });
    }
    loadsum++; //新增正在请求连接
    //获取一卡通数据
    wx.request({
      url: app.server + '/api/users/get_mealcard',
      method: 'POST',
      data: {
        session_id: app.user.wxinfo.id
      },
      success: function (res) {
        if (res.data && res.statusCode == 200) {
          var data = res.data;
          if (data.errmsg != null || data.msg.error != null) {
            //错误信息
            app.removeCache('ykt');
            return;
          }
          else {
            var data = res.data.msg;
            //保存一卡通缓存
            app.saveCache('ykt', data);
            yktRender(data)
          }
        }
      },
      complete: function () {
        loadsum--; //减少正在请求连接
        if (!loadsum) {
          if (_this.data.remind) {
            _this.setData({
              remind: '首页暂无展示'
            });
          }
          wx.hideNavigationBarLoading();
          wx.stopPullDownRefresh();
        }
      }
    });

    //借阅信息渲染
    function jyRender(info) {
      _this.setData({
        'card.jy.data': info,
        'card.jy.show': true,
        'remind': ''
      });
    }
    loadsum++; //新增正在请求连接
    //获取借阅信息
    wx.request({
      url: app.server + "/api/users/get_user_library",
      method: 'POST',
      data: {
        session_id: app.user.wxinfo.id,
        renew: false
      },
      success: function (res) {
        if (res.data && res.statusCode == 200) {
          var data = res.data;
          if (data.errmsg != null || data.msg.error != null) {
            //错误信息
            app.removeCache('jy');
            return;
          }
          var info = res.data.msg;
          if (info) {
            //保存借阅缓存
            app.saveCache('jy', info);
            jyRender(info);
          }
        } else { app.removeCache('jy'); }
      },
      complete: function () {
        loadsum--; //减少正在请求连接
        if (!loadsum) {
          if (_this.data.remind) {
            _this.setData({
              remind: '首页暂无展示'
            });
          }
          wx.hideNavigationBarLoading();
          wx.stopPullDownRefresh();
        }
      }
    });
  }
});