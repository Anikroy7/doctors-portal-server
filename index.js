const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors');
var jwt = require('jsonwebtoken');
const res = require('express/lib/response');
const port = process.env.PORT || 5000

// middleware 

app.use(cors())
app.use(express.json())

// CONNECT MONGO



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kzuhl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyJwt(req, res, next) {

    const auth = req.headers.authorization;
    console.log('from jwy', auth);
    if (!auth) {
        return res.status(401).send({ message: 'Unauthorized accsess' });
    }
    const accsessToken = auth.split(' ')[1]
    console.log(accsessToken);
    jwt.verify(accsessToken, process.env.SECRET_ACCSESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden accsess' })
        }
        req.decoded = decoded;
        next()
    });

}

async function run() {
    try {
        await client.connect()
        const serviceCollection = client.db('doctors_portal').collection('services');
        const bookingCollection = client.db('doctors_portal').collection('bookings');
        const userCollection = client.db('doctors_portal').collection('user');
        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/available', async (req, res) => {
            const date = req.query.date || 'May 16, 2022'

            const services = await serviceCollection.find().toArray()

            const query = { date: date }

            const bookings = await bookingCollection.find(query).toArray();

            services.forEach(service => {
                const serviceBookings = bookings.filter(b => b.treatement === service.name)
                const booked = serviceBookings.map(s => s.slot)
                service.booked = booked;
                const available = service.slots.filter(slot => !booked.includes(slot))
                service.slots = available;
            })

            res.send(services)
        })

        app.get('/booking', verifyJwt, async (req, res) => {
            console.log('docoded form booking', req.decoded);
            const decodedEmail = req.decoded.email;
            const patient = req.query.patient;
            if (decodedEmail === patient) {
                const query = { patient }
                const bookings = await bookingCollection.find(query).toArray();
                res.send(bookings)
            }
            else {
                return res.status(403).send({ message: 'Forbidden accsess' })
            }

        })


        app.put('/user/:email', async (req, res) => {

            const email = req.params.email;
            const filter = { email: email }
            const options = { upsert: true };
            const user = req.body;
            const updateDoc = {
                $set: user,
            }
            const result = await userCollection.updateOne(filter, updateDoc, options)
            const token = jwt.sign({ email: email }, process.env.SECRET_ACCSESS_TOKEN, {
                expiresIn: '1d'
            })
            res.send({ result, token })

        })

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            console.log(booking.treatement);
            const query = { treatement: booking.treatement, date: booking.date, patient: booking.patient }
            cv
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            else {
                const result = await bookingCollection.insertOne(booking);
                return res.send({ success: true, result })
            }

        })


        app.get('/users', verifyJwt, async (req, res) => {
            const query = {};
            const result = await userCollection.find(query).toArray();
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