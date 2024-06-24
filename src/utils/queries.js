const getStudents = "SELECT* FROM students_schema.studentsData";
const getStudentById = "SELECT * FROM students_schema.studentsData WHERE id = $1";
const removeStudent = "DELETE FROM students_schema.studentsData WHERE id = $1";
const updateStudent = "UPDATE students_schema.studentsData SET roll_no = $1, students_name = $2, class_info = $3, class_teacher = $4, remarks = $5 WHERE id = $6";
const updateStudentMarks = "UPDATE students_schema.studentsData SET Maths = $1, Science = $2, Social_Science = $3 WHERE id =$4";
const addStudent = "INSERT INTO students_schema.studentsData (roll_no, students_name, class_info, class_teacher, remarks) VALUES ($1,$2,$3,$4, $5)";
const getStudentsByClass = "SELECT* FROM students_schema.studentsData WHERE class_info = $1"

const getUsers = "SELECT * FROM students_schema.usersData2" //this is used to fetch usersdata to read user image
const getUsersData = "SELECT * FROM students_schema.usersData2 WHERE username = $1";
const refreshAccessToken = "SELECT * FROM students_schema.usersData2 WHERE user_id = $1";
const addUsersData = "INSERT INTO students_schema.usersData2 (username, user_password) VALUES ($1, $2)";
const addRefreshToken = "UPDATE students_schema.usersData2 SET refresh_token = $2 WHERE username = $1";
const updateRefreshToken = "UPDATE students_schema.usersData2 SET refresh_token = NULL WHERE user_id = $1";
const UpdateUsersData = "UPDATE students_schema.usersData2 SET username = $1, user_password = $2 WHERE user_id = $3";




 module.exports = {
    getStudents,
    getStudentById,
    removeStudent,
    updateStudent,
    addStudent,
    getUsersData,
    addUsersData,
    refreshAccessToken,
    addRefreshToken,
    updateRefreshToken,
    updateStudentMarks,
    getStudentsByClass,
    UpdateUsersData,
    getUsers
 };
