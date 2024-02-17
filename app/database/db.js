const mysql = require('mysql2');
//offline
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'lascano_invmsystem',
// });

//online
const db = mysql.createConnection({
    host: 'sql6.freemysqlhosting.net',
    user: 'sql6684118',
    password: 'aLpL5YMrFu',
    database: 'sql6684118',
});

db.connect((err) => {

    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL');
    }
});

module.exports = db;
