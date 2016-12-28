//格式化时间
function formatTime(date, t) {
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var hour = date.getHours();
  var minute = date.getMinutes();
  var second = date.getSeconds();
  if(t === 'h:m') { return [hour, minute].map(formatNumber).join(':'); }
  else { return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':'); }
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function sha1(data) {
  var jsSHA = require("sha.js");
  var shaObj = new jsSHA("SHA-1", "TEXT");
  shaObj.update(data);
  var hash = shaObj.getHash("HEX");
  return hash
}

module.exports = {
  formatTime: formatTime,
  sha1: sha1
}
