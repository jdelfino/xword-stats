const AWS = require('aws-sdk');

AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8000",
    accessKeyId: "fakeMyKeyId",
    secretAccessKey: "fakeSecretAccessKey",
    sslEnabled:     false,
});
var dynamodb = new AWS.DynamoDB();
const tableName = "xword";

async function createTableIfNeeded(dclient) {
  var params = {
    TableName : tableName,
    KeySchema: [
      { AttributeName: "date", KeyType: "HASH"},  //Partition key
      { AttributeName: "name", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: "date", AttributeType: "S" },
      { AttributeName: "name", AttributeType: "S" },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10
    }
  };

  return dclient.listTables({}).promise().then((data) => {
    console.log(data.TableNames);
    if (data.TableNames.indexOf(tableName) === -1) {
      return dclient.createTable(params).promise();
    }
    return Promise.resolve();
  }).then((data) => {
    console.log("Created table", data);
  });
};

async function deleteTableIfNeeded(dclient) {
   return dclient.listTables({}).promise().then((data) => {
    console.log(data.TableNames);
    if (data.TableNames.indexOf(tableName) === -1) {
      return Promise.resolve();
    }
    return dynamodb.deleteTable({TableName: tableName}).promise();
  }).then((data) => {
    console.log("Deleted table", data);
  });
}

function pr(name, date, time, rank) {
    return {
        PutRequest: {
            Item: {
                "date": { S: date },
                "rank": { N: rank },
                "name": { S: name },
                "time_secs": { N: time},
            }
        }
    }
};

(async () => {
    await deleteTableIfNeeded(dynamodb);
    await createTableIfNeeded(dynamodb);

    const req = {
        RequestItems: {
            [tableName]: [
                pr("kdogg", "2020-06-25", "18", "1"),
                pr("kdogg", "2020-06-26", "41", "1"),
                pr("kdogg", "2020-06-27", "35", "3"),
                pr("kdogg", "2020-06-24", "1", "1"),
                pr("liz", "2020-06-25", "20", "2"),
                pr("liz", "2020-06-27", "30", "1"),
                pr("rood", "2020-06-27", "38", "2"),
                pr("liz", "2020-06-15", "18", "1"),
                pr("liz", "2020-06-16", "41", "1"),
                pr("liz", "2020-06-17", "35", "3"),
                pr("liz", "2020-06-14", "1", "1"),
                pr("kdogg", "2020-06-15", "20", "2"),
                pr("kdogg", "2020-06-17", "30", "1"),
                pr("rood", "2020-06-17", "38", "2"),
            ]
        }
    };
    console.log(JSON.stringify(req, null, 2));

    await dynamodb.batchWriteItem(req).promise().then((data) => {
        console.log("Wrote data", data);
    })
})();