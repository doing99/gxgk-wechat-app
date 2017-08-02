//cj.js
//获取应用实例
var app = getApp();
Page({
  data: {
    remind: '加载中',
    cjInfo: [

    ],
    xqNum: {
      grade: '',
      semester: ''
    },
    xqName: {
      grade: '',
      semester: ''
    },
    // 轮询次数
    polling: 20
  },
  //分享
  onShareAppMessage: function () {
    var name = this.data.name || app.user.student.name,
      id = this.data.id || app.user.student.id;
    return {
      title: name + '的成绩单',
      desc: '快来莞香小喵查询你的期末成绩单',
      path: '/pages/core/cj/cj?id=' + id + '&name=' + name,
      success: function (res) {
        if (res.shareTickets) {
          app.sendGroupMsg(res.shareTickets);
          //console.log(res);
        }
        // 分享成功
      },
      fail: function (res) {
        // 分享失败
      }
    };
  },
  onLoad: function (options) {
    var _this = this;
    if (wx.showShareMenu) {
      wx.showShareMenu({
        withShareTicket: true
      })
    }
    app.loginLoad(function () {
      app.getUserInfo(function () {
        _this.loginHandler.call(_this, options);
      });
    }, options.id);
  },
  loginHandler: function (options) {
    var _this = this;
    if (!app.user.id || !app.user.is_bind) {
      _this.setData({
        remind: '未绑定'
      });
      return false;
    }
    _this.setData({
      id: options.id ? options.id : app.user.student.id,
      name: options.name ? options.name : app.user.student.name
    });
    //判断并读取缓存
    if (app.cache.cj && !options.id) { _this.cjRender(app.cache.cj); }
    wx.showNavigationBarLoading();
    _this.getData(options);
  },
  cjRender: function (data) {
    this.setData({
      rank: data.rank,
      cjInfo: data.data,
      xqName: data.year + '学年第' + data.term + '学期',
      update_time: data.update_time,
      remind: ''
    });
  },
  getData: function (options) {
    var _this = this;
    wx.request({
      url: app.server + "/api/users/get_score",
      method: 'POST',
      data: {
        session_id: app.user.id || '',
        student_id: options.id ? options.id : ''
      },
      success: function (res) {
        if (res.data && res.data.status === 200) {
          // 停止异步轮询
          _this.data.polling = 0;
          var _data = res.data;
          if (_data) {
            //保存成绩缓存
            app.saveCache('cj', _data);
            _this.cjRender(_data);
          } else { _this.setData({ remind: '暂无数据' }); }

        } else if (res.data && res.data.status === 404) {
          // 异步等待中
        } else {
          // 停止异步轮询
          _this.data.polling = 0;
          app.removeCache('cj');
          _this.setData({
            remind: res.data.message || '未知错误'
          });
        }
      },
      fail: function (res) {
        if (_this.data.remind == '加载中') {
          _this.setData({
            remind: '网络错误'
          });
        }
        console.warn('网络错误');
      },
      complete: function () {
        wx.hideNavigationBarLoading();
        // 回调轮询
        setTimeout(function () {
          if (_this.data.polling == 1) {
            //轮询失败
            _this.setData({ remind: '服务器繁忙，请稍后再试' });
          } else if (_this.data.polling > 0) {
            _this.data.polling = _this.data.polling - 1;
            _this.getData(options);
          }
        }, 2000);
      }
    });
  }
});