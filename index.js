const secrets = require('docker-secrets');
const mongoose = require('mongoose');
const fs = require('fs');
const url = require('url');
const path = require('path');
const request = require('request');
const tempfile = require('tempfile');

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
            urlPath: String,
        });
        const ImageModel = mongoose.model('Image', Image);
        const express = require('express');
        const app = express();
        const bodyParser = require('body-parser');
        const jsonParser = bodyParser.json();
        app.post('/images/', jsonParser, async (req, res) => {
            console.log('req.body', req.body);
            if (!req.body || !req.body.title) {
                return res.sendStatus(400);
            }
            try {
                const image = await new ImageModel({
                    title: req.body.title,
                }).save();
                console.log('Image added', image);
                res.json({
                    id: image._id,
                    title: image.title,
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
        const fileUpload = require('express-fileupload');
        app.put('/images/:id/upload', fileUpload(), async (req, res) => {
            if (!req.files) {
                return res.status(400).send('No files were uploaded.');
            }
            const files = Object.values(req.files);
            if (files.length !== 1) {
                return res.status(400).send('Only one file can be uploaded.');
            }
            const file = files[0];
            const fileExt = path.extname(file.name);
            const id = req.params.id;
            try {
                const tempImageFile = tempfile(fileExt);
                await file.mv(tempImageFile);
                console.log(`Get upload url of image ${id}`);
                const image = await ImageModel.findById(id).exec();
                const urlPath = id + fileExt;
                const uploadUrl = url.resolve(process.env.BASE_IMAGE_URL, urlPath);
                console.log(`Upload image ${id} to ${uploadUrl}`);
                await request.post(uploadUrl, {
                    formData: {
                        file: fs.createReadStream(tempImageFile)
                    }
                });
                await image.set({urlPath}).save();
                res.send({
                    id: image._id,
                    title: image.title,
                    url: uploadUrl,
                });
            } catch (err) {
                console.log(`Error uploading image ${id}`, err);
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
