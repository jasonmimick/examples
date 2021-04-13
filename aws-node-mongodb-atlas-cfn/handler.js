// handler.js
'use strict';

const express = require('express');
const serverless = require('serverless-http');
const MongoClient = require('mongodb').MongoClient;
const faker = require('faker');

const mongoClusterName = '';
const mongoUser = process.env.MONGODB_USER;
const mongoDbName = '';
const mongoPass = process.env.MONGODB_PWD;

const mongoConnStr = process.env.MONGODB_URI

console.log('MONGODB_URI: ', process.env.MONGODB_URI);

const getPetType = () => {
    const msNow = Date.now();
    if (msNow % 2 === 0) {
        return 'cat';
    }
    return 'dog';
}

const getPet = () => {
    return {
        type: getPetType(),
        name: faker.name.findName(),
    };
}

const client = new MongoClient(mongoConnStr, {
    auth: { "user": mongoUser, "password": mongoPass },
    useNewUrlParser: true
});
let db;

const createConn = async () => {
    await client.connect();
    db = client.db('test');
};

const performQuery = async () => {
    const pets = db.collection('pets');

    const newPet = getPet();

    return {
        insertedPet: newPet,
        mongoResult: await pets.insertOne(newPet),
    };
};

const app = express();

app.get('/hello', async function (req, res) {
    if (!client.isConnected()) {
        // Cold start or connection timed out. Create new connection.
        try {
            await createConn();
        } catch (e) {
            res.json({
                error: e.message,
            });
            return;
        }
    }

    // Connection ready. Perform insert and return result.
    try {
        console.log('MONGODB_URI: ', process.env.MONGODB_URI);
        res.json(await performQuery());
        //res.json( { "MONGODB_URI" : process.env.MONGODB_URI } )
        return;
    } catch (e) {
        res.send({
            error: e.message,
        });
        return;
    }
});

module.exports = {
    app,
    hello: serverless(app),
};
