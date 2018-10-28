//jy.js
//获取应用实例
var app = getApp();
Page({
  data: {
    remind: '加载中',
    jyData: {
      book_list: [], //当前借阅列表
      books_num: 0, //当前借阅量
      history: 0, //历史借阅量
      dbet: 0, //欠费
      nothing: true //当前是否有借阅
    },
    yjxjTap: false, //点击一键续借
  },
  onLoad: function(options) {
    var _this = this;
    app.loginLoad().then(function() {
      _this.loadData();
    });
  },
  onPullDownRefresh: function() {
    this.loadData();
  },
  loadData: function() {
    var _this = this;
    // if (!app.user.id || !app.user.is_bind_library) {
    //   wx.redirectTo({
    //     url: '/pages/more/append?type=library'
    //   })
    //   return false;
    // }
    wx.showNavigationBarLoading();
    _this.getBookList();
    _this.getInfo();
  },
  getInfo: function (renew = false) {
    var _this = this;
    app.wx_request("/library/xcx_info", "GET").then(function (res) {
      if (res.data && res.data.status === 200) {
        var info = res.data.data;
        if (info) {
          var jyData = _this.data.jyData;
          jyData.arrears_money = info.arrears_money
          jyData.real_name = info.real_name
          _this.setData({
            jyData: jyData,
            remind: ''
          });
        }
      } else {
        _this.setData({
          remind: res.data.msg || '未知错误'
        });
      }
      wx.hideNavigationBarLoading();
    }).catch(function (res) {
      console.log(res)
      if (_this.data.remind == '加载中') {
        _this.setData({
          remind: '网络错误'
        });
      }
      console.warn('网络错误');
      wx.hideNavigationBarLoading();
    });
  },
  getBookList: function(renew = false) {
    var _this = this;
    app.wx_request("/library/xcx_record", "GET").then(function(res) {
      if (res.data && res.data.status === 200) {
        var book_list = res.data.data;
        if (book_list.length == 0) {
          _this.setData({
            nothing: true
          });
        } else {
          var jyData = _this.data.jyData;
          jyData.book_list = book_list;
          jyData.books_num = book_list.length;
          jyData.nothing = false
          _this.setData({
            jyData: jyData,
            remind: ''
          });
        }
      } else {
        _this.setData({
          remind: res.data.msg || '未知错误'
        });
      }
      wx.hideNavigationBarLoading();
    }).catch(function(res) {
      console.log(res)
      if (_this.data.remind == '加载中') {
        _this.setData({
          remind: '网络错误'
        });
      }
      console.warn('网络错误');
      wx.hideNavigationBarLoading();
    });
  },
  renewBook: function() {
    var _this = this;
    if (!_this.data.yjxjTap) {
      //按键加锁
      _this.setData({
        yjxjTap: true
      });
      app.showLoadToast("续借中")
      //续借
      _this.getData(true);
      //刷新用户信息
      _this.getData(false);
    }
  }

});