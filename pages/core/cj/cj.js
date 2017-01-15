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
  onLoad: function () {
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
    wx.request({
      url: app.server + "/api/users/get_score",
      method: 'POST',
      data: {
        session_id: app.user.wxinfo.id
      },
      success: function (res) {
        if (res.data && res.statusCode === 200) {
          var data = res.data;
          if (data.errmsg != null) {
            _this.setData({
              remind: data.errmsg || '未知错误'
            });
          } else if (data.msg.error != null) {
            _this.setData({
              remind: data.msg.error || '未知错误'
            });
          } else {
            _this.setData({
              cjInfo: data.msg,
              xqName: app.user.school.term,
              remind: ''
            });
          }
        }

      },

      fail: function (res) {
        app.showErrorModal(res.errMsg);
        _this.setData({
          remind: '网络错误'
        });
      }
    });

    function changeNum(num) {
      var china = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
      var arr = [];
      var n = ''.split.call(num, '');
      for (var i = 0; i < n.length; i++) {
        arr[i] = china[n[i]];
      }
      return arr.join("")
    }


  }
});