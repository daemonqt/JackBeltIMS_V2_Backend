const mysql = require('mysql2');

// const db = mysql.createConnection({
//     host: 'fmpp5.h.filess.io',
//     user: 'JackBeltIMS_swamistell',
//     password: '05787a2b27a3668501a8cd51d0a1a160539a529d',
//     database: 'JackBeltIMS_swamistell',
//     port: '3305',
// });

//onlineDB
const db = mysql.createConnection({
  host: "mysql-186603-0.cloudclusters.net",
  user: "admin",
  password: "eoeiBuZJ",
  database: "jackbeltims",
  port: "10121",
  timezone: "+08:00",
  waitForConnections: true,
  keepAliveInitialDelay: 10000,
});

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'populator',
// });

db.connect((err) => {

    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL');
    }
});

module.exports = db;