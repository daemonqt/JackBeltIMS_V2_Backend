const mysql = require('mysql2');

// const db = mysql.createConnection({
//     host: 'c008q.h.filess.io',
//     user: 'JackBeltIMS_viewspider',
//     password: '25e27960f8989ba524997282ae1f9a731e4878ee',
//     database: 'JackBeltIMS_viewspider',
//     port: '3305',
// });

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'lascano_invmsystem',
});

db.connect((err) => {

    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL');
    }
});

module.exports = db;