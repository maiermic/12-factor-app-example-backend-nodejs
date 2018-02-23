const {MongoClient} = require('mongodb');

MongoClient.connect(process.env.MONGO_URI, function (err, db) {
    if (err) {
        console.log('Cannot connect to MongoDB!', err);
    } else {
        console.log('Connected to MongoDB!');
    }
    process.exit();
});
