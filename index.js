const express = require('express');
const app = express();
const mongodb = require('mongodb').MongoClient;

const port = 3000;
const dbName = 'blubblubTest';
let db = {};

const client = new mongodb('mongodb://localhost:27017');

app.get('/', async (req, res) => {
    console.log(db);
    let response = [];
    try {
        response = await db.collection('addresses').find().toArray();
        console.log(`response: ${JSON.stringify(response)}`)

    } catch(err) {
        console.log(`Error: ${err}`);
    }
    res.send(response)
});

client.connect((err, database) => {
    if (err) {
        console.log(`Error connection to db: ${err}`);
    }
    console.log("Connected correctly to server");
    db = database.db(dbName);
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
});
