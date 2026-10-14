// Build It scenarios, the checker's checklist, and the setup survival sheet.

// Every CRUD skills test is checked against roughly this list.
export const CHECKS = [
  { group: 'Create', items: [
    'Add saves a record and it shows in the grid right away',
    'A blank required field shows a message and nothing is saved',
    'Letters in a number field show a message — no crash',
    'A duplicate unique value is blocked with a message',
  ]},
  { group: 'Read', items: [
    'The grid loads all records when the form opens',
    'Clicking a row fills the textboxes',
    'Search / filter works',
  ]},
  { group: 'Update', items: [
    'Update changes ONLY the selected record',
    'Update with nothing selected shows a message',
    'Validation also runs on Update',
  ]},
  { group: 'Delete', items: [
    'Delete asks "Are you sure?" first',
    'Delete removes only the selected record',
    'Delete with nothing selected shows a message',
  ]},
  { group: 'Overall', items: [
    'Clear button empties every field',
    'No button crashes the app, in any order',
    'All SQL uses parameters (no + txtBox.Text in queries)',
    'Controls have real names (txtName, btnAdd, dgv)',
  ]},
];

export const SCENARIOS = [
  {
    id: 'students', title: 'Student Records', minutes: 90,
    table: `students
  id          INT  PK, auto-increment
  student_no  VARCHAR(20)  required, unique
  full_name   VARCHAR(100) required
  course      VARCHAR(50)  required (ComboBox: BSCS, BSIT, BSIS)
  year_level  INT  required, 1–4
  email       VARCHAR(100) required, must contain @`,
    extra: 'Search box that filters the grid by name as you type.',
    checks: [
      'Year level 0 or 5 is rejected',
      'Email without @ is rejected',
      'Course can only be picked from the ComboBox',
    ],
  },
  {
    id: 'library', title: 'Library Books', minutes: 75,
    table: `books
  id              INT  PK, auto-increment
  isbn            VARCHAR(13)  required, unique, exactly 13 digits
  title           VARCHAR(150) required
  author          VARCHAR(100) required
  year_published  INT  required, 1900 to this year
  copies          INT  required, 0 or more`,
    extra: 'A label under the grid showing the total number of copies.',
    checks: [
      'ISBN with letters or not 13 digits is rejected',
      'A year in the future is rejected',
      'Total copies label updates after Add / Update / Delete',
    ],
  },
  {
    id: 'inventory', title: 'Product Inventory', minutes: 75,
    table: `products
  id        INT  PK, auto-increment
  name      VARCHAR(100) required, unique
  category  VARCHAR(50)  required (ComboBox)
  price     DECIMAL(10,2) required, greater than 0
  stock     INT  required, 0 or more`,
    extra: 'A "Low stock" button that shows only products with stock below 5.',
    checks: [
      'Price 0, negative or "abc" is rejected',
      'Decimal prices like 49.75 save correctly',
      'Low stock filter works, and Show all brings everything back',
    ],
  },
  {
    id: 'payroll', title: 'Employee Payroll', minutes: 90,
    table: `employees
  id             INT  PK, auto-increment
  employee_no    VARCHAR(20)  required, unique
  full_name      VARCHAR(100) required
  position       VARCHAR(50)  required
  rate_per_hour  DECIMAL(10,2) required, greater than 0
  hours_worked   INT  required, 0–80`,
    extra: 'The grid shows a computed Gross Pay column (rate × hours).',
    checks: [
      'Hours over 80 or negative are rejected',
      'Gross pay is correct after an Update',
      'Search by position works',
    ],
  },
  {
    id: 'clinic', title: 'Clinic Appointments', minutes: 90,
    table: `appointments
  id            INT  PK, auto-increment
  patient_name  VARCHAR(100) required
  contact_no    VARCHAR(11)  required, 11 digits starting with 09
  appt_date     DATE  required (DateTimePicker), not in the past
  reason        VARCHAR(200) required`,
    extra: 'Filter the grid to show only appointments on a picked date.',
    checks: [
      'Contact number not starting with 09 or not 11 digits is rejected',
      'A past date is rejected',
      'Date filter works, and Show all brings everything back',
    ],
  },
];

// The order to do things when the test starts.
export const MINUTE_ZERO = [
  'Start the database: SQL Server service (or XAMPP → MySQL Start). Open SSMS / phpMyAdmin.',
  'Create the database and table. Insert ONE test row by hand.',
  'New project → Windows Forms App (C#). Install the NuGet package. Add the using lines.',
  'Design the form. Rename every control before writing code (txtName, btnAdd, dgv).',
  'Paste the connection string and write LoadData(). Run it. See your test row in the grid before writing anything else.',
  'Then Add → select row → Update → Delete → Clear → validation → search.',
];

export const SETUP = [
  {
    title: 'NuGet package + using lines',
    note: 'Project → Manage NuGet Packages → Browse. SQL Server: Microsoft.Data.SqlClient. MySQL/XAMPP: MySql.Data. On old .NET Framework projects, System.Data.SqlClient is already built in.',
    lang: 'cs',
    code: `using System.Data;
using Microsoft.Data.SqlClient;     // SQL Server
// using MySql.Data.MySqlClient;   // MySQL: MySqlConnection, MySqlCommand, MySqlDataAdapter`,
  },
  {
    title: 'Connection strings',
    note: 'Use @"..." in C# so the backslash in .\\SQLEXPRESS works. Change Database= to your database name.',
    lang: 'cs',
    code: String.raw`// SQL Server Express (most school PCs)
string connStr = @"Server=.\SQLEXPRESS;Database=SchoolDb;Trusted_Connection=True;TrustServerCertificate=True;";

// SQL Server LocalDB (installed with Visual Studio)
string connStr = @"Server=(localdb)\MSSQLLocalDB;Database=SchoolDb;Trusted_Connection=True;";

// MySQL on XAMPP (default user root, no password)
string connStr = "Server=localhost;Database=schooldb;Uid=root;Pwd=;";`,
  },
  {
    title: 'Create the database (SQL Server)',
    note: 'Run in SSMS. For MySQL, replace IDENTITY(1,1) with AUTO_INCREMENT and drop the GO lines.',
    lang: 'sql',
    code: `CREATE DATABASE SchoolDb;
GO
USE SchoolDb;
GO
CREATE TABLE students (
    id INT PRIMARY KEY IDENTITY(1,1),
    student_no VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    course VARCHAR(50) NOT NULL,
    year_level INT NOT NULL
);
INSERT INTO students (student_no, full_name, course, year_level)
VALUES ('2022-0001', 'Ana Cruz', 'BSCS', 4);`,
  },
  {
    title: 'Check for a duplicate before INSERT',
    note: 'Call this in Add before saving. ExecuteScalar returns the first value of the first row.',
    lang: 'cs',
    code: `bool StudentNoExists(string no)
{
    using (var conn = new SqlConnection(connStr))
    {
        conn.Open();
        var cmd = new SqlCommand("SELECT COUNT(*) FROM students WHERE student_no = @no", conn);
        cmd.Parameters.AddWithValue("@no", no);
        return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
    }
}`,
  },
];

// Error message → what it means → how to fix it.
export const ERRORS = [
  ['A network-related or instance-specific error occurred…',
   'The server name is wrong or SQL Server is not running.',
   'Start "SQL Server (SQLEXPRESS)" in services.msc. Try Server=.\\SQLEXPRESS or (localdb)\\MSSQLLocalDB. In SSMS, copy the exact name from the Connect window.'],
  ['The certificate chain was issued by an authority that is not trusted',
   'Microsoft.Data.SqlClient encrypts by default.',
   'Add TrustServerCertificate=True; to the connection string.'],
  ['Cannot open database "SchoolDb" requested by the login',
   'That database does not exist, or the name has a typo.',
   'Run CREATE DATABASE, or fix Database= in the connection string.'],
  ['Login failed for user',
   'Wrong login method or password.',
   'Use Trusted_Connection=True; for Windows login, or the correct User Id=…;Password=….'],
  ["The type or namespace name 'SqlConnection' could not be found",
   'The package or using line is missing.',
   'Install Microsoft.Data.SqlClient from NuGet and add using Microsoft.Data.SqlClient;'],
  ["Invalid object name 'students'",
   'The table does not exist in the database you connected to.',
   'Check the table name, and that Database= points to the right database.'],
  ['Must declare the scalar variable "@name"',
   'A parameter in the SQL has no matching AddWithValue.',
   'Make the names match exactly, including the @.'],
  ['ExecuteNonQuery requires an open and available Connection',
   'You forgot to open the connection.',
   'Add conn.Open(); before running the command. (SqlDataAdapter.Fill opens it for you.)'],
  ['Input string was not in a correct format',
   'int.Parse or Convert.ToInt32 got text that is not a number.',
   'Use int.TryParse and show a message when it returns false.'],
  ['Violation of UNIQUE KEY constraint',
   'You inserted a duplicate value.',
   'Check with SELECT COUNT(*) … WHERE before INSERT and show a message.'],
  ["Column 'name' does not belong to table / Object reference not set",
   'row.Cells["…"] uses a column name that is not in your SELECT.',
   'Use the exact database column names (full_name, not name).'],
  ['Index was out of range (when clicking the grid)',
   'You clicked the header row; RowIndex is -1.',
   'Start CellClick with: if (e.RowIndex < 0) return;'],
  ['The button does nothing',
   'The Click event is not connected to your method.',
   'Double-click the button in the Designer, or pick the method in Properties → Events (⚡).'],
  ['Unable to connect to any of the specified MySQL hosts',
   'MySQL is not running.',
   'Open XAMPP and press Start next to MySQL.'],
];
