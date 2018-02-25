const secrets = require('docker-secrets');
const mongoose = require('mongoose');

console.log(`connect to database ${process.env.MONGO_URI}`);
console.log('secrets', JSON.stringify(secrets, null, 4))
mongoose.connect(
    process.env.MONGO_URI,
    {
        auth: {
            user: secrets.mongo_user,
            password: secrets.mongo_password,
        },
        authSource: 'admin'
    }
).then(
    function onConnectionSuccess() {
        console.log('Connected to MongoDB!');
        console.log(`database name ${mongoose.connection.db.databaseName}`);
        const express = require('express');
        const app = express();
        app.get('/', (req, res) => {
            res.send('hello world');
        });
        app.listen(process.env.PORT, () => {
            console.log(`Server listening on port ${process.env.PORT}!`);
        });
    },
    function onConnectionFailure(err) {
        console.log('Cannot connect to MongoDB!', err);
        process.exit();
    }
);
