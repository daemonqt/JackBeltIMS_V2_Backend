const mysql = require('mysql2');

// Online //Paid
// const db = mysql.createPool({
//   host: "mysql-186603-0.cloudclusters.net",
//   user: "admin",
//   password: "eoeiBuZJ",
//   database: "jackbeltims",
//   port: "10121",
//   timezone: "+08:00",
//   connectionLimit: 200,
// });

// Online //Free
const db = mysql.createPool({
  host: "sql12.freesqldatabase.com",
  user: "sql12764749",
  password: "7FrIN3zZJs",
  database: "sql12764749",
  port: "3306",
  timezone: "+08:00",
  connectionLimit: 10,
});

// Offline
// const db = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "jackbelt",
//   timezone: "+08:00",
//   connectionLimit: 10,
// });

// const connection = async () => {
//   return await pool.promise().getConnection();
// };

module.exports = db.promise();
