//格式化时间
function formatTime(date, t) {
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var hour = date.getHours();
  var minute = date.getMinutes();
  var second = date.getSeconds();
  if (t === 'h:m') { return [hour, minute].map(formatNumber).join(':'); }
  else { return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':'); }
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function isEmptyObject(obj) {
  for (var key in obj) {
    return false;
  };
  return true;
};

//md5&base64
var md5 = require('md5.min.js'), base64 = require('base64.min.js')

module.exports = {
  formatTime: formatTime,
  isEmptyObject: isEmptyObject,
  md5: md5,
  base64: base64,
}
