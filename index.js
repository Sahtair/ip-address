const express = require('express');
const app = express();
const mongodb = require('mongodb').MongoClient;
const request = require('request-promise-native');

const port = 3000;
const dbName = 'blubblubTest';
let db = {};

const ipAddressApiUrl = 'https://api.ipify.org?format=json';

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

app.get('/status', async (req, res) => {
    const addressesCollection = db.collection('addresses');

    const ipApiResponse = await request(ipAddressApiUrl)
        .catch(err => console.log(`Error making ip request: ${err}`));

    const parsedIpApiResponse = JSON.parse(ipApiResponse);
    const ipAddress = parsedIpApiResponse.ip

    console.log(`Ip address: ${ipAddress}`);
    const dbResponse = await addressesCollection.findOne({
        ipAddress
    });

    console.log(`Found address: ${JSON.stringify(dbResponse)}`);

    if (dbResponse !== null) {
        console.log(`Found record: ${dbResponse}`)
        res.send(dbResponse);
    } else {
        await addressesCollection.insertOne({
            ipAddress
        }).catch(err => console.log(`Error inserting record: ${err}`));
        res.send(ipAddress);
    }
})

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
