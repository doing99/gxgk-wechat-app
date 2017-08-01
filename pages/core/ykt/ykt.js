//ykt.js
//获取应用实例
var app = getApp();
Page({
  data: {
    remind: '加载中',
    canvas_remind: '加载中',
    fontSize: 12,      // 字体大小, 24rpx=12px
    count: 10,         // 展示的消费次数
    width: 0,          // 画布宽
    height: 300,       // 画布高, wxss给定canvas高300px
    dict: [],          // 所有消费数据
    points: [],        // 点的集合（包括点的横坐标x、纵坐标y、当前点的详情detail）
    costArr: [],       // 消费金额集合
    balanceArr: [],    // 余额金额集合
    tapDetail: {},     // 每个点对应的详情集合
    lineLeft: 0,       // 详情垂直线的初始左边距
    gridMarginLeft: 35,// 表格左边距
    gridMarginTop: 20, // 表格上边距
    balance: 0,        // 当前余额（余额卡片上的展示数据）
    last_time: '',
    ykt_id: '',
    switchBtn: true,  // true:余额 or false:交易额
    options: {},
    currentIndex: 0,  // 当前点的索引，切换视图的时候保持当前详情
    polling: 10       // 轮询次数
  },
  onLoad: function () {
    var _this = this;
    _this.loadData();
  },
  loadData: function () {
    var _this = this;
    if (!app.user.is_bind_mealcard) {
      wx.redirectTo({
        url: '/pages/more/append?type=mealcard'
      })
      return false;
    }
    //判断并读取缓存
    if (app.cache.ykt) { _this.yktRender(app.cache.ykt); }
    _this.getData();
  },
  yktRender: function (data) {
    this.setData({
      ykt_info: data,
      remind: '',
    });
  },
  getData: function () {
    var _this = this;
    wx.request({
      url: app.server + '/api/users/get_mealcard',
      method: 'POST',
      data: {
        session_id: app.user.id
      },
      success: function (res) {
        if (res.data && res.data.status === 200) {
          // 停止异步轮询
          _this.data.polling = 0;
          var info = res.data.data;
          if (info) {
            //保存一卡通缓存
            app.saveCache('ykt', info);
            _this.yktRender(info);
          } else { _this.setData({ remind: '暂无数据' }); }

        } else if (res.data && res.data.status === 404) {
          // 异步等待中
        } else {
          app.removeCache('ykt');
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
        setTimeout(function () {
          if (_this.data.polling == 1){
            //轮询失败
            _this.setData({ remind: '服务器繁忙，请稍后再试' });
          } else if (_this.data.polling > 0) {
            _this.data.polling = _this.data.polling - 1;
            _this.getData();
          }
        }, 2000);
      }
    });
  }
});