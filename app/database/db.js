const mysql = require('mysql2/promise');

// Online
const connection = async () => {
  const pool = await mysql.createPool({
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
  return pool;
};

// Offline
// const connection = async () => {
//   const pool = await mysql.createPool({
//     host: "localhost",
//     user: "root",
//     password: "",
//     database: "populator",
//   });
//   return pool;
// };

module.exports = connection;
