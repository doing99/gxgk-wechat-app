//index.js
//获取应用实例
var app = getApp();
Page({
  data: {
    remind: '加载中',
    core: [
      { id: 'kb', name: '课表查询', disabled: false, teacher_disabled: false },
      { id: 'cj', name: '成绩查询', disabled: false, teacher_disabled: true },
      { id: 'ks', name: '考试安排', disabled: false, teacher_disabled: false },
      { id: 'kjs', name: '空教室', disabled: false, teacher_disabled: false },
      { id: 'xs', name: '学生查询', disabled: false, teacher_disabled: false },
      { id: 'ykt', name: '一卡通', disabled: false, teacher_disabled: false },
      { id: 'jy', name: '借阅信息', disabled: false, teacher_disabled: false },
      { id: 'xf', name: '学费信息', disabled: false, teacher_disabled: true },
      { id: 'sdf', name: '电费查询', disabled: false, teacher_disabled: true },
      { id: 'bx', name: '物业报修', disabled: false, teacher_disabled: false }
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
      },
      'sdf': {
        show: false,
        data: {
          'room': '',
          'record_time': '',
          'cost': 0,
          'spend': 0
        }
      }
    },
    user: {},
    disabledItemTap: false //点击了不可用的页面
  },
  //下拉更新
  onPullDownRefresh: function () {
    if (app.user.is_bind) {
      this.login();
    }
  },
  onShow: function () {
    var _this = this;
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
        user: app._user,
        'card.kb.show': false,
        'card.ykt.show': false,
        'card.jy.show': false,
        'card.sdf.show': false
      });
      _this.getCardData();
    }
  },
  onLoad: function () {
    this.login();
  },
  login: function () {
    var _this = this;
    //如果有缓存
    if (!!app.cache) {
      try {
        _this.response();
      } catch (e) {
        //报错则清除缓存
        wx.removeStorage({ key: 'cache' });
      }
    }
    //然后通过登录用户, 如果缓存更新将执行该回调函数
    app.getUser(_this.response);
  },
  response: function () {
    var _this = this;
    _this.setData({
      user: app.user
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
    var show = true;
    var nothing = true;
    var user = app.user;
    if (user.today_schedule != null && user.today_schedule.length != 0) {
      nothing = false;
    }
    //获取课表数据
    _this.setData({
      'card.kb.data': user.today_schedule,
      'card.kb.show': show,
      'card.kb.nothing': nothing,
      'remind': ''
    });
    _this.setData({
      'card.ykt.data.last_time': last_time,
      'card.ykt.data.balance': parseFloat(last.balance),
      'card.ykt.show': true,
      'remind': ''
    });
  }
});