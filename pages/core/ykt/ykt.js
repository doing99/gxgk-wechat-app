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
        lineLeft: 0,       // 详情垂直线的初始左边距
        gridMarginLeft: 35,// 表格左边距
        gridMarginTop: 20, // 表格上边距
        balance: 0,        // 当前余额（余额卡片上的展示数据）
        last_time: '',
        ykt_id: '',
        switchBtn: true,  // true:余额 or false:交易额
        options: {},
        currentIndex: 0   // 当前点的索引，切换视图的时候保持当前详情
    },
    onLoad: function () {
        var _this = this;
        wx.getSystemInfo({
            success: function (res) {
                // 获取窗口宽, 计算画布宽
                _this.setData({
                    'width': res.windowWidth
                });
            }
        });
        _this.sendRequest();
    },
    sendRequest: function () {
        var _this = this;
        if (!app.user.is_bind_mealcard) {
            _this.setData({
                remind: '未绑定'
            });
            return false;
        }
        wx.request({
            url: app.server + '/api/users/get_mealcard',
            method: 'POST',
            data: {
                session_id: app.user.wxinfo.id
            },
            success: function (res) {
                if (res.data && res.statusCode == 200) {
                    var data = res.data;
                    if (data.errmsg != null) {
                        _this.setData({
                            remind: data.errmsg || '未知错误'
                        });
                    } else if(data.msg.error != null){
                        _this.setData({
                            remind: data.msg.error || '未知错误'
                        });
                    } else {
                        var data = data.msg;
                        _this.setData({
                            balance: data.mainFare,
                            last_time: data.lasttime,
                            ykt_id: data.outid,
                            remind: '',
                        });
                    }
                }
            },
            fail: function (res) {
                app.showErrorModal(res.errMsg);
                _this.setData({
                    remind: '网络错误'
                });
            },
        });
    },


});