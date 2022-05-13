const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5000

// middleware 

app.use(cors())
app.use(express.json())

// CONNECT MONGO



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kzuhl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect()
        const serviceCollection = client.db('doctors_portal').collection('services');
        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })
    }
    finally {
        // await client.close();
    }

}
// call run function

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('hello form doctor uncle')
})


app.listen(port, () => {
    console.log('doctors portal server is running');
})