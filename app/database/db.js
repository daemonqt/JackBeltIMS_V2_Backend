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

// Online //Free 1
// const db = mysql.createPool({
//   host: "sql12.freesqldatabase.com",
//   user: "sql12764749",
//   password: "7FrIN3zZJs",
//   database: "sql12764749",
//   port: "3306",
//   timezone: "+08:00",
//   connectionLimit: 10,
// });

// Online //Free
// const db = mysql.createPool({
//   host: "6xjxa.h.filess.io",
//   user: "test_saildirtas",
//   password: "4361f8cd51b4ba11ac419201f0ea890aae753b92",
//   database: "test_saildirtas",
//   port: "3305",
//   timezone: "+08:00",
//   connectionLimit: 10,
// });

// Online //Google Cloud
const db = mysql.createPool({
  host: "34.92.104.235",
  user: "root",
  password: "jackbeltims2025",
  database: "jackbelt",
  port: "3306",
  timezone: "+08:00",
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
