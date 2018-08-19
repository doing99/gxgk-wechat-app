//index.js
//获取应用实例
var app = getApp();
Page({
  data: {
    banner: false,
    offline: false,
    remind: '加载中',
    core: [{
        id: 'kb',
        name: '课表查询',
        disabled: false,
        guest_view: false,
        student_disable: false,
        teacher_disabled: false,
        offline_disabled: false
      },
      {
        id: 'cj',
        name: '成绩查询',
        disabled: false,
        guest_view: false,
        student_disable: false,
        teacher_disabled: true,
        offline_disabled: false
      },
      {
        id: 'kjs',
        name: '空教室',
        disabled: true,
        guest_view: true,
        student_disable: false,
        teacher_disabled: false,
        offline_disabled: true
      },
      {
        id: 'ks',
        name: '考试安排',
        disabled: true,
        guest_view: false,
        student_disable: false,
        teacher_disabled: true,
        offline_disabled: false
      },
      {
        id: 'ykt',
        name: '校园卡',
        disabled: true,
        guest_view: false,
        student_disable: false,
        teacher_disabled: false,
        offline_disabled: false
      },
      {
        id: 'jy',
        name: '借阅信息',
        disabled: true,
        guest_view: false,
        student_disable: false,
        teacher_disabled: false,
        offline_disabled: false
      },
      {
        id: 'xs',
        name: '学生查询',
        disabled: true,
        guest_view: false,
        student_disable: true,
        teacher_disabled: false,
        offline_disabled: true
      },
      {
        id: 'zs',
        name: '我要找书',
        disabled: true,
        guest_view: true,
        student_disable: false,
        teacher_disabled: false,
        offline_disabled: true
      }
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
  onShareAppMessage: function() {
    return {
      title: '莞香小喵',
      desc: '广东科技学院唯一的小程序',
      path: '/pages/index/index'
    };
  },
  //下拉更新
  onPullDownRefresh: function() {
    _this.getCardData();
  },
  onShow: function() {
    var _this = this;
    //清空数据
    _this.setData({
      'remind': '加载中',
      'card.kb.show': false,
      'card.ykt.show': false,
      'card.jy.show': false,
      'card.sdf.show': false
    });
    _this.getCardData();
  },
  onLoad: function() {
    var _this = this;
    app.loginLoad().then(function() {
      _this.getSchoolInfo().then(function (){
        app.initWechatUser().then(function () {
          _this.initButton()
        })
      })
    });
  },
  getSchoolInfo: function() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      //然后再尝试登录用户, 如果缓存更新将执行该回调函数
      app.initSchoolUser().then(function(status) {
        resolve();
      }).catch(function(res) {
        if (res.data.status === 100) {
          _this.setData({
            'remind': '未绑定'
          });
          wx.navigateTo({
            url: '/pages/more/login'
          });
        } else {
          app.showErrorModal(res.data.msg, '获取学校信息出错');
          for (var i = 0, len = _this.data.core.length; i < len; i++) {
            _this.data.core[i].disabled = true;
          }
          _this.setData({
            offline: true,
            'remind': res.data.msg,
            core: _this.data.core
          });
        }
        reject(res);
      });
    })
  },
  initButton: function() {
    var _this = this;
    //开关按钮设置
    function set_item_switch(item) {
      var is_teacher = app.user.auth_user.user_type == 1;
      var is_admin = app.user.wx_info.is_admin;
      if (!item.disabled) {
        if (item.guest_view) {
          item.disabled = false;
        } else if (is_admin) {
          item.disabled = false;
        } else if (!is_teacher) {
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
      banner: app.banner_show
    });
  },
  disabled_item: function() {
    //点击了不可用按钮
    var _this = this;
    if (!_this.data.disabledItemTap) {
      _this.setData({
        disabledItemTap: true
      });
      setTimeout(function() {
        _this.setData({
          disabledItemTap: false
        });
      }, 2000);
    }
  },
  getCardData: function(load_cache) {
    console.log("获取首页卡片信息")
    var _this = this;
    if (_this.data.offline) {
      return;
    }
    var loadsum = 0; //正在请求连接数
    //判断并读取缓存
    wx.showNavigationBarLoading();

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
    loadsum++; //新增正在请求连接
    _this.getScheduleCard().then(function() {
      endRequest();
    }).catch(function(res) {
      console.log("课表加载失败")
      endRequest();
    })
    if (app.user.is_bind_mealcard) {
      loadsum++; //新增正在请求连接
      _this.getMealcardCard().then(function() {
        endRequest();
      }).catch(function(res) {
        console.log("一卡通信息加载失败")
        endRequest();
      })
    } else {
      app.removeCache('ykt');
    }
    if (app.user.is_bind_library) {
      loadsum++; //新增正在请求连接
      //获取借阅信息
      _this.getLibraryCard().then(function() {
        endRequest();
      }).catch(function(res) {
        console.log("借阅信息加载失败")
        endRequest();
      })
    } else {
      app.removeCache('jy');
    }
  },
  getScheduleCard: function() {
    var _this = this;
    //课表渲染
    function kbRender(info) {
      _this.setData({
        'card.kb.data': info,
        'card.kb.show': true,
        'card.kb.nothing': !info.length,
        'remind': ''
      });
    }
    return new Promise(function(resolve, reject) {
      if (app.cache.kb) {
        kbRender(app.cache.kb);
      }
      //获取课表数据
      app.wx_request('/school_sys/api_today_schdule').then(function(res) {
        if (res.data && res.data.status === 200) {
          kbRender(res.data.data);
          app.saveCache('kb', res.data.data);
          resolve();
        } else {
          reject(res);
        }
      }).catch(function(res) {
        console.log(res)
        app.removeCache('kb');
        reject(res);
      });
    })
  },
  getMealcardCard: function() {
    var _this = this;
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
    if (app.cache.ykt) {
      yktRender(app.cache.ykt);
    }
    return new Promise(function(resolve, reject) {
      //获取借阅信息
      app.wx_request('/school_sys/api_library').then(function(res) {
        if (res.data && res.data.status === 200) {
          jyRender(res.data.data);
          app.saveCache('jy', res.data.data);
          resolve();
        } else {
          reject(res);
        }
      }).catch(function(res) {
        console.log(res)
        app.removeCache('jy');
        reject(res);
      });
    })
  },
  getLibraryCard: function() {
    var _this = this;
    //借阅信息渲染
    function jyRender(info) {
      _this.setData({
        'card.jy.data': info,
        'card.jy.show': true,
        'remind': ''
      });
    }
    if (app.cache.jy) {
      jyRender(app.cache.jy);
    }
    return new Promise(function(resolve, reject) {
      //获取一卡通数据
      app.wx_request('/school_sys/api_mealcard').then(function(res) {
        if (res.data && res.data.status === 200) {
          yktRender(res.data.data);
          app.saveCache('ykt', res.data.data);
          resolve();
        } else {
          reject(res);
        }
      }).catch(function(res) {
        app.removeCache('ykt');
        reject();
      });
    })
  }
});