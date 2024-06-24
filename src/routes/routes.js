const { Router } = require('express');
const Controller = require('../controllers/controllers.js');
const  verifyJWT  = require('../middlewares/auth.middleware.js');


const router = Router();

router.post('/login', Controller.login);
router.post('/register', Controller.register);
router.get('/image',Controller.UserImage); //in these the sequence of routes matter if /image should come before / because it is more particular than /....particular routes should come before
router.get('/', Controller.getStudents);
router.get('/:class_info', Controller.getStudentsByClass);
router.post('/', Controller.addStudent);
router.put('/marks/:id', Controller.updateStudentMarks)
router.put('/:id', Controller.updateStudent);
router.delete('/:id', Controller.removeStudent);
router.put('/userProfile/:username', Controller.updateUsersData);


// Secured route
router.post('/logout', verifyJWT, Controller.logout); 
//this is to refresh the refresh access token
router.post('/refreshtoken',  Controller.refreshAccessToken);

router.post('/userProfile/Authenticate',  Controller.UserProfileAuthenticate);



//cookie testing
// router.get("/test", (req, res) => {
//     res.cookie("cookie", "temp");
//     res.send("hello");
// })

module.exports = router;
