const http = require('http');

http.get('http://localhost:3000/' + encodeURIComponent('دار القلم ١٤٤٧.xlsx'), (res) => {
  console.log("Status with encodeURIComponent:", res.statusCode);
});

http.get('http://localhost:3000/دار القلم ١٤٤٧.xlsx', (res) => {
  console.log("Status without encodeURIComponent:", res.statusCode);
});
