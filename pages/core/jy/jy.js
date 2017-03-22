//jy.js
//获取应用实例
var app = getApp();
Page({
  data: {
    remind: '加载中',
    jyData: {
      book_list: [],  //当前借阅列表
      books_num: 0,   //当前借阅量
      history: 0,     //历史借阅量
      dbet: 0,        //欠费
      nothing: true   //当前是否有借阅
    },
    yjxjTap: false //点击一键续借
  },
  onLoad: function () {
    this.getData();
  },
  onPullDownRefresh: function () {
    this.getData();
  },
  getData: function (renew = false) {
    var _this = this;
    if (!app.user.wxinfo.id || !app.user.is_bind_library) {
      _this.setData({
        remind: '未绑定'
      });
      return false;
    }
    //判断并读取缓存
    if (app.cache.jy) { jyRender(app.cache.jy); }
    function jyRender(info) {
      _this.setData({
        jyData: info,
        remind: ''
      });
    }
    wx.showNavigationBarLoading();
    wx.request({
      url: app.server + "/api/users/get_user_library",
      method: 'POST',
      data: {
        session_id: app.user.wxinfo.id,
        renew: renew
      },
      success: function (res) {
        if (res.data && res.data.status === 200) {
          var info = res.data.data;
          if (info) {
            if (renew) {
              app.showErrorModal(info, "续借提示");
              //解锁按键
              _this.setData({
                yjxjTap: false
              });
              wx.hideToast()
            }
            else {
              if (info.book.length) {
                //保存借阅缓存
                app.saveCache('jy', info);
                jyRender(info);
              } else { _this.setData({ remind: '暂无在借图书' }); }
            }
          }
          else { _this.setData({ remind: '暂无数据' }); }
        } else {
          app.removeCache('jy');
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
      }
    });
  },
  renewBook: function () {
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