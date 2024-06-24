const jwt = require("jsonwebtoken");
const config = require("../../config.js");
const bcrypt = require("bcrypt");

auth={}


//for bcrypting the password
auth.hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  };



auth.generateAccessToken = function(userId, username){
    return jwt.sign(
        {
            userId: userId ,
            username: username,
        },
        config.ACCESS_TOKEN_SECRET,
        {
            expiresIn: config.ACCESS_TOKEN_EXPIRY
        }
    )
};


auth.generateRefreshToken = function(userId){
    return jwt.sign(
        {
            userId: userId,
            
        },
        config.REFRESH_TOKEN_SECRET,
        {
            expiresIn: config.REFRESH_TOKEN_EXPIRY
        }
    )
};

module.exports = auth