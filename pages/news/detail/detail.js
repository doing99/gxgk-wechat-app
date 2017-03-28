//detail.js (common)
var app = getApp();
module.exports.ipage = {
  data: {
    remind: "加载中",
    id: "",
    title: "",    // 新闻标题
    date: "",     // 发布日期
    author: "",   // 发布作者
    reading: "",   // 阅读量
    content: "",  // 新闻内容
    files_len: 0,  // 附件数量
    files_list: [],
    file_loading: false, //下载状态
    source: '',   // 附件来源
    sources: {
      'jw': '教务公告',
      'xy': '学院新闻',
      'xb': '系部动态',
      'jz': 'OA系统',
      'new': '新闻中心'
    }
  },
  //分享
  onShareAppMessage: function () {
    var _this = this;
    return {
      title: _this.data.title,
      desc: '莞香小喵 - 资讯详情',
      path: 'pages/news/' + _this.data.type + '/' + _this.data.type + '_detail?type=' + _this.data.type + '&id=' + _this.data.id
    }
  },

  convertHtmlToText: function (inputText) {
    var returnText = "" + inputText;
    returnText = returnText.replace(/<\/?[^>]*>/g, '').replace(/[ | ]*\n/g, '\n').replace(/ /ig, '')
      .replace(/&mdash/gi, '-').replace(/&ldquo/gi, '“').replace(/&rdquo/gi, '”');
    return returnText;
  },

  onLoad: function (options) {
    var _this = this;
    app.loginLoad(function () {
      _this.loginHandler.call(_this, options);
    });
  },
  loginHandler: function (options) {
    var _this = this;

    if (!options.type || !options.id) {
      _this.setData({
        remind: '404'
      });
      return false;
    }
    _this.setData({
      'type': options.type,
      id: options.id
    });
    options.session_id = app.user.wxinfo.id;
    wx.request({
      url: app.server + '/api/get_news_detail',
      data: options,
      success: function (res) {
        if (res.data.data && res.statusCode == 200) {
          var info = res.data.data;
          _this.setData({
            date: info.time || "",  // 发布日期
            author: info.author || "",     // 发布作者
            reading: info.reading || "",    // 阅读量
            title: info.title,            //新闻标题
            originate: info.originate,         //新闻来源
            content: _this.convertHtmlToText(info.body),  // 新闻内容
            source: _this.data.sources[options.type],
            remind: ''
          });

          // 如果存在附件则提取附件里面的信息
          if (info.fjlist && info.fjlist.length) {
            info.fjlist.map(function (e) {
              //判断是否支持预览
              e.preview = (e.fjtitle.search(/\.doc|.xls|.ppt|.pdf|.docx|.xlsx|.pptx$/) !== -1);
              return e;
            });
            _this.setData({
              files_len: info.fjlist.length,
              files_list: info.fjlist
            });
          }
        } else {
          app.showErrorModal(res.data.error);
          _this.setData({
            remind: res.data.error || '未知错误'
          });
        }
      },
      fail: function () {
        app.showErrorModal(res.errMsg);
        _this.setData({
          remind: '网络错误'
        });
      }
    })
  },

  getFj: function (e) {
    var _this = this;
    if (!e.currentTarget.dataset.preview) {
      app.showErrorModal('不支持该格式文件预览！', '无法预览');
      return;
    }
    wx.showModal({
      title: '提示',
      content: '预览或下载附件需要消耗流量，是否继续？',
      confirmText: '继续',
      success: function (res) {
        if (res.confirm) {
          if (wx.showLoading) {
            wx.showLoading({
              title: '下载中，请稍候',
            }
            )
          } else {
            app.showLoadToast('下载中，请稍候');
          }
          wx.showNavigationBarLoading();
          _this.setData({
            file_loading: true
          });
          //下载
          wx.downloadFile({
            url: e.currentTarget.dataset.url,
            success: function (res) {
              var filePath = res.tempFilePath;
              //预览
              wx.openDocument({
                filePath: filePath,
                success: function (res) {
                  console.info('预览成功');
                },
                fail: function (res) {
                  app.showErrorModal(res.errMsg, '预览失败');
                },
                complete: function () {
                  wx.hideNavigationBarLoading();
                  if (wx.showLoading) {
                    wx.hideLoading();
                  } else{
                    wx.hideToast();
                  }
                  _this.setData({
                    file_loading: false
                  });
                }
              });
            },
            fail: function (res) {
              app.showErrorModal(res.errMsg, '下载失败');
              wx.hideNavigationBarLoading();
              wx.hideToast();
              _this.setData({
                file_loading: false
              });
            }
          });
        }
      }
    });
  },
  downFile: function (e) {
    var _this = this;
    wx.showModal({
      title: '提示',
      content: '下载附件需要消耗流量，是否继续？',
      confirmText: '继续',
      success: function (res) {
        if (res.confirm) {
          app.showLoadToast('下载中，请稍候', 10000);
          wx.showNavigationBarLoading();
          _this.setData({
            file_loading: true
          });
          //清除数据
          wx.getSavedFileList({
            success: function (res) {
              if (res.fileList.length > 0) {
                wx.removeSavedFile({
                  filePath: res.fileList[0].filePath,
                  complete: function (res) {
                    console.log(res)
                  }
                })
              }
              console.log(res.fileList)
            }
          })
          //下载
          wx.downloadFile({
            url: e.currentTarget.dataset.url,
            success: function (res) {
              var filePath = res.tempFilePath;
              if (filePath) {
                wx.saveFile({
                  tempFilePath: filePath,
                  success: function (res) {
                    var savedFilePath = res.savedFilePath;
                    //保存成功
                    wx.getSavedFileList({
                      success: function (res) {
                        console.log(res.fileList)
                      }
                    })
                  },
                  fail: function (res) {
                    app.showErrorModal(res.errMsg, '保存失败');
                  },
                })
              } else {
                app.showErrorModal("下载过程出错，错误代码：" + res.statusCode, '下载失败');
              }
            },
            fail: function (res) {
              app.showErrorModal(res.errMsg, '下载失败');
            },
            complete: function () {
              wx.hideNavigationBarLoading();
              wx.hideToast();
              _this.setData({
                file_loading: false
              });
            }
          });
        }
      }
    });
  }
};