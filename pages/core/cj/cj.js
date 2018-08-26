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
    share_id: ''
  },
  //分享
  onShareAppMessage: function() {
    var id = this.data.share_id;
    return {
      title: name + '的成绩单',
      desc: '快来莞香小喵查询你的期末成绩单',
      path: '/pages/core/cj/cj?id=' + share_id,
      success: function(res) {
        if (res.shareTickets) {
          app.sendGroupMsg(res.shareTickets);
          //console.log(res);
        }
        // 分享成功
      },
      fail: function(res) {
        // 分享失败
      }
    };
  },
  //下拉更新
  onPullDownRefresh: function() {
    var _this = this;
    _this.getData(_this.data.share_id);
  },
  onLoad: function(options) {
    var _this = this;
    app.loginLoad().then(function() {
      _this.loginHandler.call(_this, options);
    });
  },
  loginHandler: function(options) {
    var _this = this;
    var share_id = options.id || '';
    //判断并读取缓存
    if (app.cache.cj && !options.id) {
      _this.cjRender(app.cache.cj);
    }
    _this.getData(share_id);
  },
  cjRender: function(data) {
    this.setData({
      account: data.account,
      real_name: data.real_name,
      share_id: data.share_id,
      rank: data.rank,
      cjInfo: data.score,
      xqName: data.year + '学年第' + data.term + '学期',
      update_time: data.update_time || '暂无',
      remind: ''
    });
  },
  getData: function(share_id) {
    var _this = this;
    var share_id = share_id;
    wx.showNavigationBarLoading();
    app.wx_request("/school_sys/api_score", "GET", {
      'share_id': share_id
    }).then(function(res) {
      if (res.data && res.data.status === 200) {
        var _data = res.data.data;
        if (_data) {
          //保存成绩缓存
          app.saveCache('cj', _data);
          _this.cjRender(_data);
        } else {
          _this.setData({
            remind: '暂无数据'
          });
        }
      } else {
        app.removeCache('cj');
        _this.setData({
          remind: res.data.msg || '未知错误'
        });
      }
      wx.hideNavigationBarLoading()
      wx.stopPullDownRefresh();
    }).catch(function(res) {
      _this.setData({
        remind: '网络错误'
      });
      console.warn('网络错误');
      wx.hideNavigationBarLoading();
      wx.stopPullDownRefresh();
    });
  }
});