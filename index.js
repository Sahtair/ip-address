const express = require('express');
const app = express();
const mongodb = require('mongodb').MongoClient;
const request = require('request-promise-native');

const port = 3000;
const dbName = 'blubblubTest';
const ipAddressApiUrl = 'https://api.ipify.org?format=json';
const secretToken = 'thisIsASuperSecretToken';

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

app.get('/status', async (req, res) => {
    const {authorization: bearerToken} = req.headers;

    if (!bearerToken) {
        return res.status(403).send(`Error no token provided`);
    }

    let token = '';

    try {
        [,,token] = /^(Bearer\s)(.*)/.exec(bearerToken);
    } catch (err) {
        return res.status(500).send(`Error parsing token`);
    }
   
    if (!token) {
        return res.status(403).send(`Error no token provided`);
    }

    if (token !== secretToken) {
        return res.status(403).send(`Error invalid token provided`);
    }

    console.log(`Token: ${token}`)
    
    const addressesCollection = db.collection('addresses');

    let ipApiResponse = '';
    let parsedIpApiResponse = {};
    let ipAddress = '';
    console.log(`Req headers: ${JSON.stringify(req.headers)}`)
    if (req.headers.hasOwnProperty('x-forwarded-for')) {
        const {'x-forwarded-for': forwardedRequestHeader} = req.headers;

        [ipAddress] = forwardedRequestHeader.split(',');
    } else {
        try {
            ipApiResponse = await request(ipAddressApiUrl)
        } catch(err) {
            console.log(`Error making ip request: ${err}`);
            return res.status(500).send(err);
        }
        
        try {
            parsedIpApiResponse = JSON.parse(ipApiResponse);
        } catch(err) {
            console.log(`Error parsing: ${err}`);
            return res.status(500).send(err);
        }
       
        ipAddress = parsedIpApiResponse.ip
    }

    console.log(`Ip address: ${ipAddress}`);
    let dbResponse = {};

    try {
        dbResponse = await addressesCollection.findOne({
            ipAddress
        });
    } catch(err) {
        return res.status(500).send(err);
    }

    console.log(`Found address: ${JSON.stringify(dbResponse)}`);

    if (dbResponse !== null) {
        console.log(`Found record: ${dbResponse}`);
        return res.send(dbResponse);
    }
    try {
        await addressesCollection.insertOne({
            ipAddress
        })
    } catch(err) {
        console.log(`Error inserting record: ${err}`);
        return res.status(500).send(err);
    }
    res.send(ipAddress);
});

client.connect((err, database) => {
    if (err) {
        console.log(`Error connection to db: ${err}`);
        throw new Error(err);
    }
    console.log("Connected correctly to server");
    db = database.db(dbName);
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
});
