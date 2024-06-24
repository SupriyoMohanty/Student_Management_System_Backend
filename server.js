const express = require('express');
const config = require('./config.js');
const cors = require('cors');
const studentsDataRoutes = require('./src/routes/routes.js');
const cookieParser = require('cookie-parser');

const app = express()

app.use(cors(
    {
        origin: `http://localhost:${config.clientport}`, // Allow requests from this origin
        credentials: true, // Allow credentials (cookies, etc.)
    }
))
app.use(express.json())
app.use(express.urlencoded({limit: '1000mb', extended:true}))
app.use(express.static("public"))

app.use(cookieParser()) //so that we can access cookie in program....like .cookie...like req.cookie, res.cookie


app.use('/api/v1/studentsData',studentsDataRoutes);



//Make the server run on the specified port

app.listen(config.serverport||6000, ()=>{
    console.log(`app listining on server port ${config.serverport}`);
})

