const express = require('express');
const path = require('path');
const AWS = require('aws-sdk')
const fs = require('fs')
const config = require('./config')

const app = express();
const port = process.env.PORT || 8000

app.use(express.static(path.join(__dirname, 'portfolio')))
app.use(express.static(path.join(__dirname, 'catan')))
app.use(express.static(path.join(__dirname, 'adsb')))


AWS.config.update({
    region: config.aws.region,
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
})

const dynamoDB = new AWS.DynamoDB();
const tableName = config.tableName;

const fetchDataAndWriteToFile = async () => {
    try {

        const currentUnixTimestamp = Math.floor(new Date().getTime() / 1000);
        const currentMin = Math.floor(currentUnixTimestamp/60)*60
        console.log(currentMin)


        const params = {
            TableName: tableName,
            KeyConditionExpression: 'MinutePartition = :pk',
            ExpressionAttributeValues: {
              ':pk': { N: currentMin.toString() } 
            }
          };
  
        const result = await dynamoDB.query(params).promise();

        if (result.Items.length > 0) {
            const dataToWrite = JSON.stringify(result.Items, null, 2);
            fs.writeFileSync(path.join(__dirname, '/adsb/aircraft_data.json'), dataToWrite);
            //fs.writeFileSync(path.join('C:/Users/tjm55/Desktop/Coding Projects/Github Repos/sage-adsb-display-site/sage-radar/public/', 'aircraft_data.json'), dataToWrite);
            console.log('Data written to file successfully.');
        } else {
            console.log('Item not found in DynamoDB.');
        }
    } catch (error) {
        console.error('Error fetching data and writing to file:', error);
    }
};

setInterval(fetchDataAndWriteToFile, 6000);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'portfolio', 'index.html'))
})

app.get('/catan', (req, res) => {
    res.sendFile(path.join(__dirname, 'catan', 'index.html'))
})

app.get('/adsb', (req, res) => {
    res.sendFile(path.join(__dirname, 'adsb', 'index.html'))
})

app.listen(port, () => {
    console.log('Server listening on port 8080')
})