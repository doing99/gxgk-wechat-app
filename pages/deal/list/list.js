//index.js
//获取应用实例
var app = getApp()
Page({
  data: {
    page: 0,
    list: [
      { id: 0, 'type': 'yi', name: '衣', storage:[] },
      { id: 1, 'type': 'shi', name: '食', storage: [] },
      { id: 2, 'type': 'zhu', name: '住', storage: [] },
      { id: 3, 'type': 'xing', name: '行', storage: [] }
    ],
    'active': {
      id: 0,
      'type': 'yi',
      data: [],
      showMore: true,
      remind: '上滑加载更多'
    },
    loading: false,
    disabledRemind: false
  },
  onLoad: function () {
    this.setData({
      'loading': true,
      'active.data': [],
      'active.showMore': true,
      'active.remind': '上滑加载更多',
      'page': 0
    });
    this.getShopsList();
  },
  //下拉刷新
  onPullDownRefresh: function () {
    var _this = this;
    _this.setData({
      'loading': true,
      'active.data': [],
      'active.showMore': true,
      'active.remind': '上滑加载更多',
      'page': 0
    })
    _this.getShopsList();
  },
  //上滑加载更多
  onReachBottom: function () {
    var _this = this;
    if (_this.data.active.showMore) {
      _this.getShopsList();
    }
  },
  onLoad: function () {
    var that = this
    that.getShopsList()
  },
  //获取各店铺列表
  getShopsList: function (typeId) {
    var _this = this;
    if (app.g_status) {
      _this.setData({
        'active.showMore': false,
        'active.remind': app.g_status,
        loading: false
      });
      wx.stopPullDownRefresh();
      return;
    }
    typeId = typeId || _this.data.active.id;
    if (_this.data.page >= 5) {
      _this.setData({
        'active.showMore': false,
        'active.remind': '没有更多啦'
      });
      return false;
    }
    if (!_this.data.page) {
      _this.setData({
        'active.data': _this.data.list[typeId].storage
      });
    }
    _this.setData({
      'active.remind': '正在加载中'
    });
    wx.showNavigationBarLoading();
    wx.request({
      url: app.server + '/api/shop/classify',
      data: {
        stype: typeId,
        page: _this.data.page + 1,
      },
      success: function (res) {
        if (res.data && res.statusCode == 200) {
          if (res.data.errmsg) {
            app.showErrorModal(res.data.data.error);
            _this.setData({
              'active.remind': res.data.data.error || '加载失败'
            });
          }
          if (_this.data.active.id != typeId) { return false; }
          if (res.data.data && res.data.data.length != 0) {
            if (!_this.data.page) {
              if (!_this.data.list[typeId].storage.length || app.util.md5(JSON.stringify(res.data.data)) != app.util.md5(JSON.stringify(_this.data.list[typeId].storage))) {
                var data = {
                  'page': _this.data.page + 1,
                  'active.data': res.data.data,
                  'active.showMore': true,
                  'active.remind': '上滑加载更多',
                };
                data['list[' + typeId + '].storage'] = res.data.data;
                _this.setData(data);
              } else {
                _this.setData({
                  'page': _this.data.page + 1,
                  'active.showMore': true,
                  'active.remind': '上滑加载更多'
                });
              }
            } else {
              _this.setData({
                'page': _this.data.page + 1,
                'active.data': _this.data.active.data.concat(res.data.data),
                'active.showMore': true,
                'active.remind': '上滑加载更多',
              });
            }
          } else {
            _this.setData({
              'active.showMore': false,
              'active.remind': '没有更多啦'
            });
          }
        } else {
          app.showErrorModal(res.errMsg);
          _this.setData({
            'active.remind': '加载失败'
          });
        }
      },
      fail: function (res) {
        app.showErrorModal(res.errMsg);
        _this.setData({
          'active.remind': '网络错误'
        });
      },
      complete: function () {
        wx.hideNavigationBarLoading();
        wx.stopPullDownRefresh();
        _this.setData({
          loading: false
        });
      }
    });
  },
  //获取焦点
  changeFilter: function (e) {
    this.setData({
      'active': {
        'id': e.target.dataset.id,
        'type': e.target.id,
        data: [],
        showMore: true,
        remind: '上滑加载更多'
      },
      'page': 0
    });
    this.getShopsList(e.target.dataset.id);
  },
})
