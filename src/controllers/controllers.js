const bcrypt = require("bcrypt");
const dbHandler = require("../db/dbHandler.js");
const queries = require("../utils/queries.js");
const auth = require("../models/authentication.js");
const config = require("../../config.js");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require('path');
const { log } = require("console");


const generateAccessAndRefreshToken = async (userId, username) => {
  try {
    const accessToken = auth.generateAccessToken(userId, username);
    const refreshToken = auth.generateRefreshToken(userId);
    console.log("userId2:", userId);
    console.log("Username2:", username);

    await dbHandler.fetchDataParameterized(queries.addRefreshToken, [
      username,
      refreshToken,
    ]); //saved refreshToken in usersData2 table
    console.log("Saved the refreshToken:", refreshToken);

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(
      "Something went wrong whle generating refresh and access token"
    );
  }
};


const login = async (req, res) => {
  try {
    const { username, user_password } = req.body; //data got from frontendconsole.log("middleware:",req.cookies?.accessToken);
    const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', ''); //header option used because i case mobile usage

    if (!token) {
        return res.status(401).json({ message: 'Invalid Access Token' });
    }
    console.log("username:", username, "user_password:", user_password);

    //check from usersData table if username and user_password match
    const results = await dbHandler.fetchDataParameterized(
      queries.getUsersData,
      [username]
    );

    const user = results.rows[0];

    if (!user || !(await bcrypt.compare(user_password, user.user_password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    //console.log("UserID:", user.user_id);

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user.user_id,
      username
    );

    const options = {
      httpOnly: true, 
      //httpOnly flag prevents the cookie from being accessed by JavaScript. This can help to protect the cookie from being stolen by malicious scripts.
      secure: true,
      //The secure flag tells the browser to only send the cookie over HTTPS connections. This can help to prevent the cookie from being intercepted by attackers.
      //The secure flag tells the browser to only send the cookie over HTTPS connections. This can help to prevent the cookie from being intercepted by attackers.
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours in milliseconds
    };

    // Set cookies and send the final response
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        status: 200,
        data: {
          user: {
            user_id: user.user_id,
            username: username,
          },
          accessToken,
          refreshToken,
        },
        message: "User logged In Successfully",
      });
  } catch (error) {
    console.error("Error executing login query:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const logout = async (req, res) => {
  try {
    // Assuming you have a 'refresh_token' column in your PostgreSQL table

    await dbHandler.fetchDataParameterized(queries.updateRefreshToken, [
      req.user.user_id, //as we used middleware where we passed req.user to the body so we are able to access it here directly...so  from req.user take user_id 
    ]);

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({ status: 200, message: "User logged Out" });
  } catch (error) {
    console.error("Error executing logout query:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const refreshAccessToken = async (req, res) => {
  try {
    console.log("Cookies:", req.cookies);
    console.log("Cookies Refresh_Token:", req.cookies?.refreshToken);

    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken; //used || because can be case when accesss from mobile 

    if (!incomingRefreshToken) {
      return res.status(401).json({
        status: 401,
        message: "Unauthorized request", 
      });
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      config.REFRESH_TOKEN_SECRET
    );

    console.log("inclomingRefreshToken:", incomingRefreshToken);

    const userQueryResult = await dbHandler.fetchDataParameterized(
      queries.refreshAccessToken,
      [decodedToken?.userId] //from decodedtoken taken out userId
    );
      // console.log("BI");

    if (!userQueryResult.rows || userQueryResult.rows.length === 0) {
      return res.status(401).json({
        status: 401,
        message: "Invalid refresh token",
      });
    }

    const user = userQueryResult.rows[0];
    // console.log("BI2");
    //matching incoming refresh token and refresh token in db
    if (incomingRefreshToken !== user.refresh_token) {
      return res.status(401).json({
        status: 401,
        message: "Refresh token is expired or used",
      });
    }

    //now we can generate new refresh_token

    const options = {
      httpOnly: true,
      secure: true,
    };
    // console.log("BI3");

    const result = await dbHandler.fetchDataParameterized(
      queries.refreshAccessToken,
      [user.user_id]
    );

    const userDetails = result.rows[0]

    // console.log('Moto',user.user_id, userDetails.username);

    const results = await generateAccessAndRefreshToken(user.user_id, userDetails.username);

    const { accessToken, refreshToken: newRefreshToken } = results;

    // console.log("BI4", accessToken, newRefreshToken);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({
        status: 200,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
        message: "Access token refreshed",
      });
  } catch (error) {
    return res.status(401).json({
      status: 401,
      message: error?.message || "Invalid refresh token",
    });
  }
};


const register = async (req, res) => {
  try {
    const { username, user_password } = req.body;
    const hashedPassword = await auth.hashPassword(user_password);

    await dbHandler.fetchDataParameterized(queries.addUsersData, [
      username,
      hashedPassword,
    ]);

    console.log("New user created successfully");
    res.status(200).json({ message: "New user created successfully" });
  } catch (error) {
    console.error("Error creating a new user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const getStudents = async (req, res) => {
  try {
    const results = await dbHandler.fetchData(queries.getStudents);

    if (!fs.existsSync(config.Imagefolder)) {
      // If it doesn't exist, create the directory
      fs.mkdirSync(config.Imagefolder);
    }

  //Promise.all() function is used to wait for all of the promises in the array to be resolved. 
  //The map() function is used to iterate over the array of students and create a new promise for each student. 
  //The new promise will resolve to the student object with the image data added
    const studentsWithImages = await Promise.all(

      results.rows.map(async (student) => {
        const imagePath = path.join( config.Imagefolder,`${student.roll_no}_${student.students_name}_${student.class_info}.jpg`);
        // console.log("test:", imagePath); 
        try {

          const image = fs.readFileSync(imagePath, 'base64'); //base64 encoding
          return { ...student, image }; 
          //...spread operator used to expand iterable objects such as arrays, strings, and objects into their individual elements.

        } catch (error) {

          console.error(`Error reading image file ${imagePath}`, error);
          return student; 
        }
      })
    );
    res.status(200).json(studentsWithImages);

  } catch (error) {

    console.error('Error in executing getStudents', error);
    res.status(500).json({ message: 'Internal Server Error' });

  }
};


const getStudentsByClass = async (req, res) => {
  try {
    const { class_info } = req.params;
    const results = await dbHandler.fetchDataParameterized(queries.getStudentsByClass, [class_info]);

    res.status(200).json(results.rows);
  } catch (error) {
    console.error('Error in executing getStudentsByClass', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


const addStudent = async (req, res) => {
  try {
    const { roll_no, students_name, class_info, class_teacher, remarks, image_url } = req.body;

    await dbHandler.fetchDataParameterized(queries.addStudent, [
      roll_no,
      students_name,
      class_info,
      class_teacher,
      remarks,
    ]);

    if (!fs.existsSync(config.Imagefolder)) {
      // If it doesn't exist, create the directory
      fs.mkdirSync(config.Imagefolder);
    }


    if (image_url) {
       //To remove the data:image/[format];base64 prefix from the image_url string. 
       //This prefix is used to indicate that the string contains a base64-encoded image.
      const base64Data = image_url.replace(/^data:image\/\jpeg;base64,/, ''); 
     
      //To converts the base64-encoded string to a Buffer object. A Buffer object is a node.js object to represents a sequence of binary data.
      const buffer = Buffer.from(base64Data, 'base64');

      
      const imageName = path.join( config.Imagefolder,`${roll_no}_${students_name}_${class_info}.jpg`);
      // Towrites the Buffer object to the file specified by the imageName string.
      fs.writeFileSync(imageName, buffer);
    }
    else{
      console.log("Image URL not provided by user");
    }


    res.status(201).json({ message: 'Student added successfully in database!' });


  } catch (error) {
    console.error('Error in adding a student in database', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


const removeStudent = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    //CHECKING STUDENTS ID EXISTSTENCE
    const existingStudentResult = await dbHandler.fetchDataParameterized(
      queries.getStudentById,
      [id]
    );

    const noStudentFound = !existingStudentResult.rows.length;
    if (noStudentFound) {
      res.send("Student not found in the database");
      return;
    }

    //DELETE Query

    if (!fs.existsSync(config.Imagefolder)) {
      // If it doesn't exist, create the directory
      fs.mkdirSync(config.Imagefolder);
    }

    const imagePath = path.join( config.Imagefolder,`${existingStudentResult.rows[0].roll_no}_${existingStudentResult.rows[0].students_name}_${existingStudentResult.rows[0].class_info}.jpg`);
    
    if(fs.existsSync(imagePath)){
      fs.unlinkSync(imagePath);
    }else{
      console.log("Image file not found for the student");
    }
    

    await dbHandler.fetchDataParameterized(queries.removeStudent, [id]);

    res.status(200).send("Student Removed Successfully!");

  } catch (error) {
    console.error("Error removing a student:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const updateStudent = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { roll_no, students_name, class_info, class_teacher, remarks, image_url_update } = req.body;

    // Fetch student data from the database
    const existingStudentResult = await dbHandler.fetchDataParameterized(
      queries.getStudentById,
      [id]
    );

    const noStudentFound = !existingStudentResult.rows.length;
    if (noStudentFound) {
      res.send("Student not found in the database");
      return;
    }

    // Get existing image file path based on fetched data
    const existingImagePath = path.join( config.Imagefolder,`${existingStudentResult.rows[0].roll_no}_${existingStudentResult.rows[0].students_name}_${existingStudentResult.rows[0].class_info}.jpg`);
    const newFilePath = path.join(config.Imagefolder, `${roll_no}_${students_name}_${class_info}.jpg`);


    await dbHandler.fetchDataParameterized(
      queries.updateStudent,
      [
        roll_no,
        students_name,
        class_info,
        class_teacher,
        remarks,
        id,
      ],
    )

    if (!fs.existsSync(config.Imagefolder)) {
      // If it doesn't exist, create the directory
      fs.mkdirSync(config.Imagefolder);
    }

    if (!image_url_update && !fs.existsSync(existingImagePath)) {
      const errorMessage = 'Student is updated but there is no image of student';
      console.log(errorMessage);
      res.status(400).json({ error: errorMessage, addImage: true });
      return;
    }

    if (image_url_update) {
      const base64Data = image_url_update.replace(/^data:image\/\jpeg+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const imageNameUpdate = newFilePath;

      // Remove the existing image file if it exists
      if (fs.existsSync(existingImagePath)) {
        fs.unlinkSync(existingImagePath);
      }

      // Write the contents of the buffer object to the file specified by the imageNameUpdate variable
      fs.writeFileSync(imageNameUpdate, buffer);
    } else {
      // Rename the existing image file if it exists

      if (existingImagePath) {
        fs.rename(existingImagePath ,newFilePath, function (err) {
          if (err) throw err;
          console.log('The file has been renamed!');
        });
      }
    }

    res.status(200).json({ message: "Student Updated Successfully!" });

  } catch (error) {
    console.error("Error updating a student:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const updateStudentMarks = async(req, res) =>{
  try {
    const id = parseInt(req.params.id);
    const { Maths, Science, Social_Science } = req.body;

    // Fetch student data from the database
    const existingStudentResult = await dbHandler.fetchDataParameterized(
      queries.getStudentById,
      [id]
    );

    const noStudentFound = !existingStudentResult.rows.length;
    if (noStudentFound) {
      res.send("Student not found in the database");
      return;
    }

    await dbHandler.fetchDataParameterized(
      queries.updateStudentMarks,
      [
        Maths,
        Science,
        Social_Science,
        id,
      ],

      res.status(200).json({ message: "Student Marks Updated Successfully!" })

    )
    
  } catch (error) {
    console.error("Error Updating marks", error);
    res.status(500).json({message: "Internal Server Error" })
  }

};


const updateUsersData = async(req,res)=>{
  try {
    const { user_id ,username, user_password, image_url_update } = req.body;
    update_user_id = parseInt(user_id);

    console.log('updateUsersDataID:', update_user_id);

    // Fetch Users data from the database
    const existingUserResult = await dbHandler.fetchDataParameterized(
      queries.refreshAccessToken,
      [user_id]
    );

    // Get existing image file path based on fetched data
    const existingImagePath = path.join(config.UserImageFolder,`${existingUserResult.rows[0].username}.jpg`);
    const newFilePath = path.join(config.UserImageFolder,`${username}.jpg`);
    
    console.log("ExistingUserImagePath:", existingImagePath);
    console.log("UserImage Path:", newFilePath);

    const hashedPassword = await auth.hashPassword(user_password);

    await dbHandler.fetchDataParameterized(
      queries.UpdateUsersData,
      [
        username,
        hashedPassword,
        update_user_id,
      ],
    )

    if (!fs.existsSync(config.UserImageFolder)) {
      // If it doesn't exist, create the directory
      fs.mkdirSync(config.UserImageFolder);
    }

    if (!image_url_update && !fs.existsSync(existingImagePath)) {
      const errorMessage = 'User is updated but there is no image of user';
      console.log(errorMessage);
      res.status(400).json({ error: errorMessage, addImage: true });
      return;
    }

    if (image_url_update) {
      const base64Data = image_url_update.replace(/^data:image\/\jpeg+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const imageNameUpdate = newFilePath;

      // Remove the existing image file if it exists
      if (fs.existsSync(existingImagePath)) {
        fs.unlinkSync(existingImagePath);
      }

      // Write the contents of the buffer object to the file specified by the imageNameUpdate variable
      fs.writeFileSync(imageNameUpdate, buffer);
    } else {
      // Rename the existing image file if it exists

      if (existingImagePath) {
        fs.rename(existingImagePath ,newFilePath, function (err) {
          if (err) throw err;
          console.log('The file has been renamed!');
        });
      }
    }

    res.status(200).json({ message: "User Updated Successfully!" });

  } catch (error) {
    console.error("Error updating a User:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }

}

const UserProfileAuthenticate = async(req,res)=>{
  try {
    
    const { username, user_password } = req.body;

    // Validate if username and user_password are provided
    if (!username || !user_password) {
      return res.status(400).json({ message: 'username and user_password not provided' });
    }

    // Retrieve user information from the database based on the username
    const result = await dbHandler.fetchDataParameterized(queries.getUsersData, [username]);
    const user = result.rows[0];
    const { user_id } = user;
    console.log(user_id);

    // Check if the user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if the provided user_password matches the stored user_password
    const passwordMatch = await bcrypt.compare(user_password, user.user_password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.status(200).json({ message: 'Authentication valid for userProfle change', user_id }); //sent user_id so that when change the username and userpassword then can update the db using user_id
  } catch (error) {
    console.error('Error in UserProfileAuthenticate:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }

};


const UserImage = async (req, res) => {
  console.log('Hello');
  try{
    const results = await dbHandler.fetchData(queries.getUsers);

    if (!fs.existsSync(config.UserImageFolder)) {
      // If it doesn't exist, create the directory
      fs.mkdirSync(config.UserImageFolder);
    }
    
    const UsersWithImages = await Promise.all(

      results.rows.map(async (user) => {
        const imagePath = path.join( config.UserImageFolder,`${user.username}.jpg`);
        // console.log("test:", imagePath); 
        try {
          const image = fs.readFileSync(imagePath, 'base64'); //base64 encoding
          return { image }; 
          //...spread operator used to expand iterable objects such as arrays, strings, and objects into their individual elements.

        } catch (error) {

          console.error(`Error reading image file ${imagePath}`, error);
          return; 
        }
      })
    );
    res.status(200).json(UsersWithImages);
  }catch(error) {

    console.error('Error in executing getStudents', error);
    res.status(500).json({ message: 'Internal Server Error' });


  }

};



module.exports = {
  addStudent,
  getStudents,
  removeStudent,
  updateStudent,
  login,
  register,
  generateAccessAndRefreshToken,
  logout,
  refreshAccessToken,
  getStudentsByClass,
  updateStudentMarks,
  updateUsersData,
  UserProfileAuthenticate,
  UserImage
};
