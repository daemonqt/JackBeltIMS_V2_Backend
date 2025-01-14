const mysql = require('mysql2/promise');

//onlineDB
const db = mysql.createPool({
  host: "mysql-186603-0.cloudclusters.net",
  user: "admin",
  password: "eoeiBuZJ",
  database: "jackbeltims",
  port: "10121",
  timezone: "+08:00",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  keepAliveInitialDelay: 10000,
});

// const db = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "populator",
// });

// db.connect((err) => {

//     if (err) {
//         console.error('Error connecting to MySQL:', err);
//     } else {
//         console.log('Connected to MySQL');
//     }
// });

module.exports = db;