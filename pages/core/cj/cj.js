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
    }
  },
    //分享
  onShareAppMessage: function () {
    var name = app.user.student.name,
      id = app.user.student.id;
    return {
      title: name + '的成绩单',
      desc: '快来莞香小喵查询你的期末成绩单',
      path: '/pages/core/cj/cj?id=' + id + '&name=' + name
    };
  },
  onLoad: function (options) {
    var _this = this;
    if (!app.user.wxinfo.id || !app.user.is_bind) {
      _this.setData({
        remind: '未绑定'
      });
      return false;
    }
    _this.setData({
      id: app.user.student.id,
      name: app.user.student.name
    });
    //判断并读取缓存
    if (app.cache.cj) { cjRender(app.cache.cj); }
    function cjRender(data) {
      _this.setData({
        cjInfo: data.msg,
        xqName: app.user.school.term,
        remind: ''
      });
    }
    wx.showNavigationBarLoading();
    wx.request({
      url: app.server + "/api/users/get_score",
      method: 'POST',
      data: {
        session_id: app.user.wxinfo.id,
        student_id: options.id
      },
      success: function (res) {
        if (res.data && res.statusCode == 200) {
          var data = res.data;
          if (data.errmsg != null) {
            app.removeCache('cj');
            _this.setData({
              remind: data.errmsg || '未知错误'
            });
          } else if (data.msg.error != null) {
            app.removeCache('cj');
            _this.setData({
              remind: data.msg.error || '未知错误'
            });
          } else {
            //保存成绩缓存
            app.saveCache('cj', data);
            cjRender(data);
          }
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
      }
    });
  }
});