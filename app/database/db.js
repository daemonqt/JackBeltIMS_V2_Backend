const mysql = require("mysql2/promise");

//onlineDB
const dbConfig = {
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
};

// const dbConfig = {
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "populator",
// };

async function createPool() {
  try {
    const pool = await mysql.createPool(dbConfig);
    console.log("Pool created");
    return pool;
  } catch (error) {
    console.error("Error creating pool:", error);
    throw error;
  }
}

const db = createPool();

module.exports = db;