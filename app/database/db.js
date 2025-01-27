const mysql = require('mysql2/promise');

// Online
const pool = mysql.createPool({
  host: "mysql-186603-0.cloudclusters.net",
  user: "admin",
  password: "eoeiBuZJ",
  database: "jackbeltims",
  port: "10121",
  timezone: "+08:00",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 10,
  keepAliveInitialDelay: 10000,
});

// Offline
// const pool = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "jackbelt",
//   timezone: "+08:00",
//   connectionLimit: 200,
// });

const connection = async () => {
  return await pool.getConnection();
};

module.exports = connection;
