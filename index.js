const {MongoClient} = require('mongodb');

console.log(`connect to database ${process.env.MONGO_URI}`);
MongoClient.connect(process.env.MONGO_URI, function (err, db) {
    if (err) {
        console.log('Cannot connect to MongoDB!', err);
    } else {
        console.log('Connected to MongoDB!');
    }
    process.exit();
});
