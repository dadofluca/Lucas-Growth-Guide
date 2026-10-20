/* Explicit local care time. Changing the clock never guesses AM or PM. */
(function(root){
 'use strict';
 function format(value){const d=new Date(value);return {date:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),clock:(d.getHours()%12||12)+':'+String(d.getMinutes()).padStart(2,'0'),period:d.getHours()>=12?'PM':'AM'};}
 function parse(date,clock,period){
  const day=String(date).match(/^(\d{4})-(\d{2})-(\d{2})$/),time=String(clock).trim().match(/^(\d{1,2}):(\d{2})$/);
  if(!day||!time||+time[1]<1||+time[1]>12||+time[2]>59||!['AM','PM'].includes(period))throw Error('Choose a date and a time like 6:30, then select AM or PM.');
  const hour=+time[1]%12+(period==='PM'?12:0),d=new Date(+day[1],+day[2]-1,+day[3],hour,+time[2],0,0);
  if(d.getFullYear()!==+day[1]||d.getMonth()!==+day[2]-1||d.getDate()!==+day[3]||d.getHours()!==hour||d.getMinutes()!==+time[2])throw Error('That local date or time does not exist. Choose another time.');
  return d;
 }
 root.LucaCareTime={format,parse};if(typeof module==='object'&&module.exports)module.exports=root.LucaCareTime;
})(globalThis);
