
CREATE TABLE students_schema.studentsData (
  id SERIAL PRIMARY KEY,
  roll_no INTEGER,
  students_name VARCHAR(100),
  class_info VARCHAR(50),
  class_teacher VARCHAR(50),
  remarks TEXT,
  input_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

ALTER TABLE students_schema.studentsData
ADD COLUMN Maths INTEGER, ADD COLUMN Science INTEGER, ADD COLUMN Social_Science INTEGER;

INSERT INTO students_schema.studentsData (roll_no, students_name, class_info, class_teacher, remarks)
VALUES 
  (1, 'Andre', 'Class 3', 'Mr. Daniel', 'Good Student'),
  (2, 'Anny', 'Class 2', 'Mr. Watson', 'Excellent Student'),
  (3, 'Johnson', 'Class KG', 'Ms. Pippsy', 'Nice Student');

ALTER TABLE students_schema.studentsData ADD UNIQUE(roll_no,students_name,class_info);
  

CREATE TABLE students_schema.usersData2 (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  user_password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  refresh_token VARCHAR(255),
);

INSERT INTO students_schema.usersData2 (username, user_password)
VALUES 
  ('supriyo', 'supriyo123'),
  ('a', 'a'),
  ('z', 'z');