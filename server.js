require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { dbConnect } = require('./config/dbConnect')


app.use(cors({
    origin: process.env.mode === 'pro' ? [process.env.client_production_url] : ['http://localhost:3000'],
    credentials: true
}));


app.use(bodyParser.json());
app.use(cookieParser());



// import router
// app.use('/api', require('./routes/home/homeRoutes'));

app.use('/api', require('./routes/auth/userRouter'));
app.use('/api', require('./routes/auth/doctorRouter'));
app.use('/api', require('./routes/admin/adminRoute'));


app.get('/home', (req, res) => {
    res.json('Welcome home pagesss')
})


const port = process.env.PORT;
dbConnect();
app.listen(port, () => console.log(`Server is running on port ${port}!`));
