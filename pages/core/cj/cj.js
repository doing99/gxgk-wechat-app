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
    app.loginLoad().then(function () {
      _this.loginHandler.call(_this, options);
    });
  },
  loginHandler: function (options) {
    var _this = this;
    _this.setData({
      id: options.id ? options.id : app.user.auth_user.account,
      name: options.name ? options.name : app.user.student.real_name
    });
    //判断并读取缓存
    if (app.cache.cj && !options.id) { _this.cjRender(app.cache.cj); }
    wx.showNavigationBarLoading();
    _this.getData(options);
  },
  cjRender: function (data) {
    this.setData({
      rank: data.rank,
      cjInfo: data.score,
      xqName: data.year + '学年第' + data.term + '学期',
      update_time: data.update_time || '暂无',
      remind: ''
    });
  },
  getData: function (options) {
    var _this = this;
    var data = {
      student_id: options.id ? options.id : ''
    }
    app.wx_request("/school_sys/api_score", "POST", data).then(function (res){
        if (res.data && res.data.status === 200) {
          var _data = res.data.data;
          if (_data) {
            //保存成绩缓存
            app.saveCache('cj', _data);
            _this.cjRender(_data);
          } else { _this.setData({ remind: '暂无数据' }); }
        } else {
          app.removeCache('cj');
          _this.setData({
            remind: res.data.msg || '未知错误'
          });
        }
      }).catch(function(res) {
        _this.setData({
          remind: '网络错误'
        });
        console.warn('网络错误');
        wx.hideNavigationBarLoading();
      });
  }
});