//index.js
//获取应用实例
var app = getApp();
Page({
  data: {
    banner: false,
    offline: false,
    remind: '加载中',
    core: [
      { id: 'kb', name: '课表查询', disabled: false, guest_view: false, student_disable: false, teacher_disabled: false, offline_disabled: false },
      { id: 'cj', name: '成绩查询', disabled: false, guest_view: false, student_disable: false, teacher_disabled: true, offline_disabled: false },
      { id: 'kjs', name: '空教室', disabled: false, guest_view: true, student_disable: false, teacher_disabled: false, offline_disabled: true },
      { id: 'ks', name: '考试安排', disabled: false, guest_view: false, student_disable: false, teacher_disabled: true, offline_disabled: false },
      { id: 'ykt', name: '校园卡', disabled: false, guest_view: false, student_disable: false, teacher_disabled: false, offline_disabled: false },
      { id: 'jy', name: '借阅信息', disabled: false, guest_view: false, student_disable: false, teacher_disabled: false, offline_disabled: false },
      { id: 'xs', name: '学生查询', disabled: false, guest_view: false, student_disable: true, teacher_disabled: false, offline_disabled: true },
      { id: 'zs', name: '我要找书', disabled: false, guest_view: true, student_disable: false, teacher_disabled: false, offline_disabled: true }
    ],
    card: {
      'kb': {
        show: false,
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
      this.login();
    } else {
      wx.stopPullDownRefresh();
    }
  },
  onShow: function () {
    var _this = this;
    function isEmptyObject(obj) { for (var key in obj) { return false; } return true; }
    function isEqualObject(obj1, obj2) { if (JSON.stringify(obj1) != JSON.stringify(obj2)) { return false; } return true; }
    var l_user = _this.data.user,  //本页用户数据
      g_user = app.user; //全局用户数据
    //排除第一次加载页面的情况（全局用户数据未加载完整 或 本页用户数据与全局用户数据相等）
    if (isEmptyObject(l_user) || !g_user.id || isEqualObject(l_user, g_user)) {
      return false;
    }
    //全局用户数据和本页用户数据不一致时，重新获取卡片数据
    if (!isEqualObject(l_user, g_user)) {
      _this.setData({
        'banner': app.banner_show
      });
      //判断绑定状态
      if (!app.user.is_bind) {
        _this.setData({
          'remind': '未绑定'
        });
      } else {
        //清空数据
        _this.setData({
          user: app.user,
          'remind': '加载中',
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
    //然后再尝试登录用户, 如果缓存更新将执行该回调函数
    app.loginLoad().then(function (status) {
      console.log("登录后回调了" + status)
      _this.response.call(_this, status, false);
    });
  },
  response: function (status, load_cache) {
    var _this = this;
    if (status) {
      if (status != '离线缓存模式') {
        //错误
        for (var i = 0, len = _this.data.core.length; i < len; i++) {
          _this.data.core[i].disabled = true;
        }
        _this.setData({
          'remind': status,
          core: _this.data.core
        });
        return;
      } else {
        //离线缓存模式
        _this.setData({
          offline: true
        });
      }
    }
    //开关按钮设置
    function set_item_switch(item) {
      var is_teacher = app.user.is_teacher;
      if (!item.disabled) {
        if (item.guest_view) {
          item.disabled = false;
        }
        else if (app.user.is_admin) {
          item.disabled = false;
        }
        else if (!is_teacher) {
          if (!item.student_disable)
            item.disabled = false;
          else
            item.disabled = true;
        } else {
          if (!item.teacher_disabled)
            item.disabled = false;
          else
            item.disabled = true;
        }
      }
    }
    for (var i = 0, len = _this.data.core.length; i < len; i++) {
      set_item_switch(_this.data.core[i])
    }
    _this.setData({
      core: _this.data.core,
      user: app.user,
      banner: app.banner_show
    });
    //判断绑定状态
    if (!app.user.is_bind) {
      _this.setData({
        'remind': '未绑定'
      });
    } else {
      //清空数据
      _this.setData({
        user: app._user,
        'remind': '加载中',
        'card.kb.show': false,
        'card.ykt.show': false,
        'card.jy.show': false
      });
      _this.getCardData(load_cache);
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
  getCardData: function (load_cache) {
    var _this = this;
    var loadsum = 0; //正在请求连接数
    var user = app.user;
    //判断并读取缓存
    if (app.cache.kb) { kbRender(app.cache.kb); }
    if (_this.data.offline) { return; }
    if (load_cache) { return; }
    wx.showNavigationBarLoading();
    //获取课表数据
    function endRequest() {
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
    //课表渲染
    function kbRender(info) {
      _this.setData({
        'card.kb.data': info,
        'card.kb.show': true,
        'card.kb.nothing': !info.length,
        'remind': ''
      });
    }
    console.log(app.user.school)
    loadsum++; //新增正在请求连接
    wx.request({
      url: app.server + '/get_schedule',
      method: 'POST',
      data: {
        session_id: app.user.id,
        weeks: app.user.school.weeks,
        week_day: app.user.school.week_day
      },
      success: function (res) {
        if (res.data && res.data.state === 200) {
          var info = res.data.data;
          if (info) {
            //保存课表缓存
            // app.saveCache('kb', info);
            kbRender(info);
          }
        } else { app.removeCache('kb'); }
      },
      complete: function () {
        endRequest();
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
    if (app.user.is_bind_mealcard) {
      if (app.cache.ykt) { yktRender(app.cache.ykt); }
      loadsum++; //新增正在请求连接
      //获取一卡通数据
      wx.request({
        url: app.server + '/api/users/get_mealcard',
        method: 'POST',
        data: {
          session_id: app.user.id,
          index: true
        },
        success: function (res) {
          if (res.data && res.data.status === 200) {
            var list = res.data.data;
            if (list) {
              //保存一卡通缓存
              app.saveCache('ykt', list);
              yktRender(list);
            }
          } else { app.removeCache('ykt'); }
        },
        complete: function () {
          endRequest();
        }
      });
    } else {
      app.removeCache('ykt');
    }
    //借阅信息渲染
    function jyRender(info) {
      _this.setData({
        'card.jy.data': info,
        'card.jy.show': true,
        'remind': ''
      });
    }
    if (app.user.is_bind_library) {
      if (app.cache.jy) { jyRender(app.cache.jy); }
      loadsum++; //新增正在请求连接
      //获取借阅信息
      wx.request({
        url: app.server + "/api/users/get_user_library",
        method: 'POST',
        data: {
          session_id: app.user.id,
          renew: false,
          index: true
        },
        success: function (res) {
          if (res.data && res.data.status === 200) {
            var info = res.data.data;
            if (info) {
              //保存借阅缓存
              app.saveCache('jy', info);
              jyRender(info);
            }
          } else { app.removeCache('jy'); }
        },
        complete: function () {
          endRequest();
        }
      });
    } else {
      app.removeCache('jy');
    }
  }
});
