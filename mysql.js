
require('dotenv').config()
const { DATABASE_URL } = process.env

exports.queryDatabase = async function queryDatabase(str_query) {
    return new Promise(async (resolve, reject) => {
        // console.log(db_organization);
        try {
            const mysql = require('mysql2')
            const connection = mysql.createConnection(DATABASE_URL)
            // console.log('Connected to PlanetScale!')
            console.log('str_query : ',str_query);
            connection.query(str_query,
                function (err, results, fields) {
                    // console.log('err',err); // results contains rows returned by server
                    // console.log('results',results); // results contains rows returned by server
                    // console.log(fields); // fields contains extra meta data about results, if available
                    if (err !== undefined) {
                        return resolve(results)
                    } else {
                        return reject(err)
                    }
                }
            );

            connection.end()
        } catch (e) {
            return reject(e)
        }
    });
}