const secrets = require('docker-secrets');
const mongoose = require('mongoose');

console.log(`connect to database ${process.env.MONGO_URI}`);
console.log('secrets', JSON.stringify(secrets, null, 4));
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
        const Image = new mongoose.Schema({
            title: String,
            url: String,
        });
        const ImageModel = mongoose.model('Image', Image);
        const express = require('express');
        const app = express();
        const bodyParser = require('body-parser');
        const jsonParser = bodyParser.json();
        app.post('/images/', jsonParser, async (req, res) => {
            console.log('req.body', req.body);
            if (!req.body || !req.body.title || !req.body.url) {
                return res.sendStatus(400);
            }
            try {
                const image = await new ImageModel({
                    title: req.body.title,
                    url: req.body.url,
                }).save();
                console.log('Image saved', image);
                res.json({
                    id: image._id,
                    title: image.title,
                    url: image.url,
                });
            } catch (err) {
                console.log('Could not save image', err);
                res.sendStatus(500);
            }
        });
        app.get('/images/', jsonParser, async (req, res) => {
            try {
                const images = await ImageModel.find().exec();
                res.json(images.map(({_id, title, url}) => ({id: _id, title, url})));
            } catch (err) {
                console.log('Could not get images', err);
                res.sendStatus(500);
            }
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
