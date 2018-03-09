const secrets = require('docker-secrets');
const mongoose = require('mongoose');

// just for demonstration, do not log in production!
console.log('secrets', JSON.stringify(secrets, null, 4));
main();

async function main() {
    console.log(`connect to database ${process.env.MONGO_URI}`);
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            auth: {
                user: secrets.mongo_user,
                password: secrets.mongo_password,
            },
            authSource: 'admin'
        });
        console.log('Connected to MongoDB!');
        console.log(`database name ${mongoose.connection.db.databaseName}`);
        await startServer();
    } catch (err) {
        console.log('Cannot connect to MongoDB!', err);
        process.exit();
    }
}

async function startServer() {
    const Image = new mongoose.Schema({
        title: String,
        urlPath: String,
    });
    const ImageModel = mongoose.model('Image', Image);
    const fs = require('fs');
    const url = require('url');
    const path = require('path');
    const request = require('request');
    const tempfile = require('tempfile');
    const express = require('express');
    const cors = require('cors');
    const bodyParser = require('body-parser');
    const fileUpload = require('express-fileupload');
    const app = express();
    app.use(cors());
    const jsonParser = bodyParser.json();
    app.post('/images/', jsonParser, addImage);
    app.get('/images/', jsonParser, getImages);
    app.put('/images/:id/upload', fileUpload(), uploadImage);
    const server = await app.listen(process.env.PORT);
    console.log(`Server listening on port ${process.env.PORT}!`);
    // https://joseoncode.com/2014/07/21/graceful-shutdown-in-node-dot-js/
    process.on('SIGTERM', async function shutdownGracefully() {
        try {
            console.log('shutdown server gracefully');
            await server.close();
            console.log('disconnect from database');
            await mongoose.disconnect();
            console.log('graceful shutdown done');
        } catch (err) {
            console.error('Unexpected error during graceful shutdown', err);
        }
        process.exit(0);
    });

    async function addImage(req, res) {
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
    }

    async function getImages(req, res) {
        try {
            const images = await ImageModel.find().exec();
            res.json(
                images.filter(image => Boolean(image.urlPath))
                    .map(({_id, title, urlPath}) => ({
                        id: _id,
                        title,
                        url: url.resolve(process.env.BASE_IMAGE_URL, urlPath),
                    }))
            );
        } catch (err) {
            console.log('Could not get images', err);
            res.sendStatus(500);
        }
    }

    async function uploadImage(req, res) {
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
    }
}