const jwt = require('jsonwebtoken');
const dbHandler = require('../db/dbHandler.js'); 
const config = require('../../config.js');
const queries = require('../utils/queries.js');

//this middleware called before logout to check is user is there or not

const verifyJWT = async (req, res , next) => {
    try {
        console.log("middleware:",req.cookies?.accessToken);
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', ''); //header option used because i case mobile usage

        if (!token) {
            return res.status(401).json({ message: 'Invalid Access Token' });
        }

        const decodedToken = jwt.verify(token, config.ACCESS_TOKEN_SECRET);

        const username = decodedToken?.username;



        const result = await dbHandler.fetchDataParameterized(queries.getUsersData, [username]);

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid Access Token' });
        }

        req.user = user; //as verified that user is verified so  add it in body
        next();
    } catch (error) {
        return res.status(401).json({ message: error?.message || 'Invalid access token' });
    }
};

module.exports = verifyJWT

