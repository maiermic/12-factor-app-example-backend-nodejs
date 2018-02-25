const secrets = require('docker-secrets');
const {MongoClient} = require('mongodb');

console.log(`connect to database ${process.env.MONGO_URI}`);
console.log('secrets', JSON.stringify(secrets, null, 4))
MongoClient.connect(
    process.env.MONGO_URI,
    {
        auth: {
            user: secrets.mongo_user,
            password: secrets.mongo_password,
        },
        authSource: 'admin'
    },
    function (err, client) {
        if (err) {
            console.log('Cannot connect to MongoDB!', err);
        } else {
            console.log('Connected to MongoDB!');
            console.log(`database name ${client.db('admin').databaseName}`);
            console.log('Close database connection');
            client.close();
        }
        process.exit();
    }
);
