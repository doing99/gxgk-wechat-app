//kjs.js
//获取应用实例
var app = getApp();

// 定义常量数据
var WEEK_DATA = ['', '第一周', '第二周', '第三周', '第四周', '第五周', '第六周', '第七周', '第八周', '第九周', '第十周',
  '十一周', '十二周', '十三周', '十四周', '十五周', '十六周', '十七周', '十八周', '十九周', '二十周'],
  DAY_DATA = ['', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  CLASSTIME_DATA = ['', { time: '1-2节', index: 1 }, { time: '3-4节', index: 3 }, { time: '5-6节', index: 5 },
    { time: '7-8节', index: 7 }, { time: '9-10节', index: 9 }],
  BUILDING_DATA = ['', '1栋', '2栋', '3栋', '4栋', '5栋', '6栋', '7栋', '8栋', '9栋', '工1'];

Page({
  data: {
    DATA: {
      WEEK_DATA: WEEK_DATA,
      DAY_DATA: DAY_DATA,
      CLASSTIME_DATA: CLASSTIME_DATA,
      BUILDING_DATA: BUILDING_DATA,
    },
    active: { // 发送请求的数据对象 初始为默认值
      weekNo: 1,
      weekDay: 1,
      buildingNo: 1,
      classNo: 1,
    },
    errObj: {
      errorDisplay: false
    },
    nowWeekDay: 1,
    nowWeekNo: 1,
    nowClassNo: 1,
    testData: null,
    remind: '',
    time_list: [
      { begin: '8:30', end: '10:05' },
      { begin: '10:25', end: '12:00' },
      { begin: '14:40', end: '16:15' },
      { begin: '16:30', end: '18:05' },
      { begin: '19:30', end: '21:05' },
    ],
  },
  onLoad: function () {
    // 比较获取时间，比较出第几节
    var _this = this;
    function parseMinute(dateStr) { return dateStr.split(':')[0] * 60 + parseInt(dateStr.split(':')[1]); }
    function compareDate(dateStr1, dateStr2) {
      return parseMinute(dateStr1) <= parseMinute(dateStr2);
    }
    var nowTime = app.util.formatTime(new Date(), 'h:m');
    var time_length = _this.data.time_list.length;
    _this.data.time_list.forEach(function (e, i) {
      if (i === time_length - 1 && compareDate(e.end, nowTime)) {
        _this.data.nowClassNo = 5;
      } else if (compareDate(e.end, nowTime)) {
        _this.data.nowClassNo = i + 2;
      };
    });
    _this.setData({
      'nowWeekDay': app.user.school.weekday,
      'active.weekDay': app.user.school.weekday,
      'nowWeekNo': app.user.school.weeknum,
      'active.weekNo': app.user.school.weeknum,
      'nowClassNo': _this.data.nowClassNo,
      'active.classNo': _this.data.nowClassNo
    });
    // 初始默认显示
    if (_this.data.remind == '') {
      _this.sendRequest();
    }
  },

  //下拉更新
  onPullDownRefresh: function () {
    this.sendRequest();
  },

  // 发送请求的函数
  sendRequest: function (query, bd) {

    app.showLoadToast();

    var that = this;
    var query = query || {}, activeData = that.data.active;
    var requestData = {
      weekNo: query.weekNo || activeData.weekNo,
      weekDay: query.weekDay || activeData.weekDay,
      classNo: that.data.DATA.CLASSTIME_DATA[query.classNo || activeData.classNo].index,
      buildingNo: query.buildingNo || activeData.buildingNo,
      session_id: app.user.id || '',
    };

    // 对成功进行处理
    function doSuccess(data) {
      that.setData({
        'testData': data,
        'errObj.errorDisplay': true
      });
    }

    // 发送请求
    wx.request({
      url: app.server + '/api/get_empty_room',
      method: 'POST',
      data: requestData,
      success: function (res) {
        if (res.data && res.data.status === 200) {
          doSuccess(res.data.data);
          //执行回调函数
          if (bd) { bd(that); }
        } else {
          app.showErrorModal(res.data.message);
        }
      },
      fail: function (res) {
        app.showErrorModal(res.errMsg);
      },
      complete: function () {
        wx.hideToast();
        wx.stopPullDownRefresh();
      }
    });
  },

  // week
  chooseWeek: function (e) {

    var index = parseInt(e.target.dataset.weekno, 10);

    if (isNaN(index)) { return false; }

    this.sendRequest({
      weekNo: index
    }, function (that) {
      that.setData({
        'active.weekNo': index
      });
    });
  },

  // day
  chooseDay: function (e) {

    var index = parseInt(e.target.dataset.dayno, 10);

    if (isNaN(index)) { return false; }

    this.sendRequest({
      weekDay: index
    }, function (that) {
      that.setData({
        'active.weekDay': index
      });
    });
  },

  // classTime
  chooseClaasTime: function (e) {

    var index = e.target.dataset.classno;

    if (isNaN(index)) { return false; }

    this.sendRequest({
      classNo: index
    }, function (that) {
      that.setData({
        'active.classNo': index
      });
    });
  },

  // building
  chooseBuilding: function (e) {

    var index = parseInt(e.target.dataset.buildingno, 10);

    if (isNaN(index)) { return false; }

    this.sendRequest({
      buildingNo: index
    }, function (that) {
      that.setData({
        'active.buildingNo': index
      });
    });
  }
});