// C# versions of every concept card, the CRUD cards, and C# / CRUD quiz questions.

// C# code for the existing cards (merged into CONCEPTS in data.js by id).
export const CS = {
for:`int[] nums = { 3, 7, 1, 9 };
int total = 0;
for (int i = 0; i < nums.Length; i++)
{
    total += nums[i];
}
Console.WriteLine(total); // 20`,
while:`int n = 4096;
int digits = 0;
while (n > 0)
{
    n /= 10;
    digits++;
}
Console.WriteLine(digits); // 4`,
dowhile:`int choice;
do
{
    Console.WriteLine("1) Add  2) View  0) Exit");
    choice = int.Parse(Console.ReadLine());
} while (choice != 0);`,
if:`int score = 85;
string grade;
if (score >= 90)
{
    grade = "A";
}
else if (score >= 80)
{
    grade = "B";
}
else
{
    grade = "C";
}
Console.WriteLine(grade); // B`,
func:`static int Area(int w, int h)
{
    return w * h;
}

Console.WriteLine(Area(4, 5)); // 20`,
array:`List<int> nums = new List<int> { 4, 15, 8, 23 };
int biggest = nums[0];
foreach (int n in nums)
{
    if (n > biggest)
    {
        biggest = n;
    }
}
Console.WriteLine(biggest); // 23`,
string:`string word = "level";
char[] chars = word.ToCharArray();
Array.Reverse(chars);
string rev = new string(chars);
if (word == rev)
{
    Console.WriteLine("palindrome");
}
else
{
    Console.WriteLine("not palindrome");
}`,
map:`string text = "banana";
var count = new Dictionary<char, int>();
foreach (char ch in text)
{
    count[ch] = count.GetValueOrDefault(ch) + 1;
}
foreach (var p in count)
{
    Console.WriteLine(p.Key + "=" + p.Value);
}`,
stack:`var stack = new Stack<int>();
stack.Push(1);
stack.Push(2);
Console.WriteLine(stack.Pop()); // 2 (LIFO)

var queue = new Queue<int>();
queue.Enqueue(1);
queue.Enqueue(2);
Console.WriteLine(queue.Dequeue()); // 1 (FIFO)`,
recur:`static int Factorial(int n)
{
    if (n <= 1)
    {
        return 1;
    }
    return n * Factorial(n - 1);
}

Console.WriteLine(Factorial(5)); // 120`,
bsearch:`static int BinarySearch(int[] arr, int target)
{
    int low = 0, high = arr.Length - 1;
    while (low <= high)
    {
        int mid = (low + high) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
bubble:`static void BubbleSort(int[] arr)
{
    int n = arr.Length;
    for (int i = 0; i < n - 1; i++)
    {
        for (int j = 0; j < n - 1 - i; j++)
        {
            if (arr[j] > arr[j + 1])
            {
                (arr[j], arr[j + 1]) = (arr[j + 1], arr[j]);
            }
        }
    }
}`,
oop:`var s = new Student("Ana", 1.5);
Console.WriteLine(s.IsHonor()); // True

class Student
{
    public string Name { get; set; }
    public double Gpa { get; set; }

    public Student(string name, double gpa)
    {
        Name = name;
        Gpa = gpa;
    }

    public bool IsHonor()
    {
        return Gpa <= 1.75;
    }
}`,
try:`try
{
    Console.Write("Age: ");
    int age = int.Parse(Console.ReadLine());
    Console.WriteLine(100 / age);
}
catch (FormatException)
{
    Console.WriteLine("Not a number");
}
catch (DivideByZeroException)
{
    Console.WriteLine("Age can't be 0");
}
finally
{
    Console.WriteLine("done");
}`,
};


// The whole WinForms CRUD form. Used as a card (type it / memory mode) and in the Setup sheet.
export const FORM_TEMPLATE = String.raw`public partial class Form1 : Form
{
    string connStr = @"Server=.\SQLEXPRESS;Database=SchoolDb;Trusted_Connection=True;TrustServerCertificate=True;";
    int selectedId = 0;

    public Form1()
    {
        InitializeComponent();
        LoadData();
    }

    void LoadData()
    {
        using (var conn = new SqlConnection(connStr))
        {
            var da = new SqlDataAdapter("SELECT * FROM students", conn);
            var dt = new DataTable();
            da.Fill(dt);
            dgv.DataSource = dt;
        }
    }

    void ClearFields()
    {
        txtName.Clear();
        txtCourse.Clear();
        selectedId = 0;
    }

    bool IsValid()
    {
        if (string.IsNullOrWhiteSpace(txtName.Text) || string.IsNullOrWhiteSpace(txtCourse.Text))
        {
            MessageBox.Show("Please fill in all fields.");
            return false;
        }
        return true;
    }

    private void btnAdd_Click(object sender, EventArgs e)
    {
        if (!IsValid()) return;
        using (var conn = new SqlConnection(connStr))
        {
            conn.Open();
            var cmd = new SqlCommand("INSERT INTO students (full_name, course) VALUES (@name, @course)", conn);
            cmd.Parameters.AddWithValue("@name", txtName.Text.Trim());
            cmd.Parameters.AddWithValue("@course", txtCourse.Text.Trim());
            cmd.ExecuteNonQuery();
        }
        MessageBox.Show("Saved.");
        ClearFields();
        LoadData();
    }

    private void dgv_CellClick(object sender, DataGridViewCellEventArgs e)
    {
        if (e.RowIndex < 0) return;
        var row = dgv.Rows[e.RowIndex];
        selectedId = Convert.ToInt32(row.Cells["id"].Value);
        txtName.Text = row.Cells["full_name"].Value.ToString();
        txtCourse.Text = row.Cells["course"].Value.ToString();
    }

    private void btnUpdate_Click(object sender, EventArgs e)
    {
        if (selectedId == 0) { MessageBox.Show("Select a record first."); return; }
        if (!IsValid()) return;
        using (var conn = new SqlConnection(connStr))
        {
            conn.Open();
            var cmd = new SqlCommand("UPDATE students SET full_name = @name, course = @course WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("@name", txtName.Text.Trim());
            cmd.Parameters.AddWithValue("@course", txtCourse.Text.Trim());
            cmd.Parameters.AddWithValue("@id", selectedId);
            cmd.ExecuteNonQuery();
        }
        MessageBox.Show("Updated.");
        ClearFields();
        LoadData();
    }

    private void btnDelete_Click(object sender, EventArgs e)
    {
        if (selectedId == 0) { MessageBox.Show("Select a record first."); return; }
        if (MessageBox.Show("Delete this record?", "Confirm", MessageBoxButtons.YesNo) != DialogResult.Yes) return;
        using (var conn = new SqlConnection(connStr))
        {
            conn.Open();
            var cmd = new SqlCommand("DELETE FROM students WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("@id", selectedId);
            cmd.ExecuteNonQuery();
        }
        ClearFields();
        LoadData();
    }

    private void btnClear_Click(object sender, EventArgs e)
    {
        ClearFields();
    }

    private void txtSearch_TextChanged(object sender, EventArgs e)
    {
        using (var conn = new SqlConnection(connStr))
        {
            var da = new SqlDataAdapter("SELECT * FROM students WHERE full_name LIKE @q", conn);
            da.SelectCommand.Parameters.AddWithValue("@q", "%" + txtSearch.Text + "%");
            var dt = new DataTable();
            da.Fill(dt);
            dgv.DataSource = dt;
        }
    }
}`;

// The CRUD cards. A card without a version for the chosen language shows C#.
export const CRUD_CONCEPTS = [
{id:"template",group:"CRUD",title:"the full CRUD form (memorize this)",
 use:"This one form is the whole test: LoadData, ClearFields, IsValid, Add, select row, Update, Delete with confirm, Clear, Search. Type it in Memory mode until you can write it without peeking.",
 warn:"Each button only works if its Click event is wired: double-click the button in the Designer. Rename controls first (txtName, btnAdd, dgv).",
 code:{cs:FORM_TEMPLATE}},

{id:"crudlist",group:"CRUD",title:"CRUD on a list",
 use:"The skills test asks you to Create, Read, Update and Delete records. Practice the logic on a list first, before a database is involved.",
 warn:"Update and Delete must find ONE record. Use a unique Id, not the name — two students can share a name.",
 code:{cs:`var students = new List<Student>();

// CREATE
students.Add(new Student { Id = 1, Name = "Ana", Course = "BSCS" });

// READ
foreach (var s in students)
{
    Console.WriteLine(s.Id + " " + s.Name + " " + s.Course);
}

// UPDATE
var found = students.Find(s => s.Id == 1);
if (found != null)
{
    found.Name = "Ana Cruz";
}

// DELETE
students.RemoveAll(s => s.Id == 1);

class Student
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Course { get; set; }
}`,
py:`students = []

# CREATE
students.append({"id": 1, "name": "Ana", "course": "BSCS"})

# READ
for s in students:
    print(s["id"], s["name"], s["course"])

# UPDATE
for s in students:
    if s["id"] == 1:
        s["name"] = "Ana Cruz"

# DELETE
students = [s for s in students if s["id"] != 1]`,
java:`List<Student> students = new ArrayList<>();

// CREATE
students.add(new Student(1, "Ana", "BSCS"));

// READ
for (Student s : students) {
    System.out.println(s.id + " " + s.name + " " + s.course);
}

// UPDATE
for (Student s : students) {
    if (s.id == 1) {
        s.name = "Ana Cruz";
    }
}

// DELETE
students.removeIf(s -> s.id == 1);`,
cpp:`struct Student {
    int id;
    string name;
    string course;
};

vector<Student> students;

// CREATE
students.push_back({1, "Ana", "BSCS"});

// READ
for (const auto& s : students) {
    cout << s.id << " " << s.name << " " << s.course << endl;
}

// UPDATE
for (auto& s : students) {
    if (s.id == 1) s.name = "Ana Cruz";
}

// DELETE
students.erase(remove_if(students.begin(), students.end(),
    [](const Student& s) { return s.id == 1; }), students.end());`,
js:`let students = [];

// CREATE
students.push({ id: 1, name: "Ana", course: "BSCS" });

// READ
for (const s of students) {
  console.log(s.id, s.name, s.course);
}

// UPDATE
const found = students.find(s => s.id === 1);
if (found) found.name = "Ana Cruz";

// DELETE
students = students.filter(s => s.id !== 1);`}},

{id:"sqlcrud",group:"CRUD",title:"SQL: INSERT, SELECT, UPDATE, DELETE",
 use:"Every CRUD app maps to four statements: Create = INSERT, Read = SELECT, Update = UPDATE, Delete = DELETE.",
 warn:"UPDATE or DELETE without WHERE changes EVERY row. MySQL uses AUTO_INCREMENT where SQL Server uses IDENTITY(1,1).",
 code:{sql:`CREATE TABLE students (
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL,
    course VARCHAR(50)
);

INSERT INTO students (name, course)
VALUES ('Ana', 'BSCS');

SELECT id, name, course FROM students
WHERE course = 'BSCS';

UPDATE students
SET name = 'Ana Cruz'
WHERE id = 1;

DELETE FROM students
WHERE id = 1;`}},

{id:"dbcrud",group:"CRUD",title:"CRUD with a database",
 use:"Your program sends INSERT / SELECT / UPDATE / DELETE to the database. Every value the user typed goes in as a parameter (@name or ?).",
 warn:"Never glue user input into SQL (\"... WHERE id = \" + txtId.Text) — that is SQL injection. In C#: ExecuteNonQuery for INSERT/UPDATE/DELETE, ExecuteReader for SELECT.",
 code:{cs:`string connStr = "Server=.;Database=SchoolDb;Trusted_Connection=True;TrustServerCertificate=True";

using (var conn = new SqlConnection(connStr))
{
    conn.Open();

    // CREATE
    var insert = new SqlCommand(
        "INSERT INTO students (name, course) VALUES (@name, @course)", conn);
    insert.Parameters.AddWithValue("@name", "Ana");
    insert.Parameters.AddWithValue("@course", "BSCS");
    insert.ExecuteNonQuery();

    // READ
    var select = new SqlCommand("SELECT id, name, course FROM students", conn);
    using (var reader = select.ExecuteReader())
    {
        while (reader.Read())
        {
            Console.WriteLine(reader["id"] + " " + reader["name"] + " " + reader["course"]);
        }
    }

    // UPDATE
    var update = new SqlCommand("UPDATE students SET name = @name WHERE id = @id", conn);
    update.Parameters.AddWithValue("@name", "Ana Cruz");
    update.Parameters.AddWithValue("@id", 1);
    update.ExecuteNonQuery();

    // DELETE
    var delete = new SqlCommand("DELETE FROM students WHERE id = @id", conn);
    delete.Parameters.AddWithValue("@id", 1);
    delete.ExecuteNonQuery();
}`,
py:`import sqlite3

conn = sqlite3.connect("school.db")
cur = conn.cursor()

# CREATE
cur.execute("INSERT INTO students (name, course) VALUES (?, ?)", ("Ana", "BSCS"))

# READ
for row in cur.execute("SELECT id, name, course FROM students"):
    print(row)

# UPDATE
cur.execute("UPDATE students SET name = ? WHERE id = ?", ("Ana Cruz", 1))

# DELETE
cur.execute("DELETE FROM students WHERE id = ?", (1,))

conn.commit()
conn.close()`,
java:`String url = "jdbc:mysql://localhost:3306/school";
try (Connection conn = DriverManager.getConnection(url, "root", "")) {
    // CREATE
    PreparedStatement ins = conn.prepareStatement(
        "INSERT INTO students (name, course) VALUES (?, ?)");
    ins.setString(1, "Ana");
    ins.setString(2, "BSCS");
    ins.executeUpdate();

    // READ
    ResultSet rs = conn.createStatement()
        .executeQuery("SELECT id, name, course FROM students");
    while (rs.next()) {
        System.out.println(rs.getInt("id") + " " + rs.getString("name"));
    }

    // UPDATE
    PreparedStatement up = conn.prepareStatement(
        "UPDATE students SET name = ? WHERE id = ?");
    up.setString(1, "Ana Cruz");
    up.setInt(2, 1);
    up.executeUpdate();

    // DELETE
    PreparedStatement del = conn.prepareStatement("DELETE FROM students WHERE id = ?");
    del.setInt(1, 1);
    del.executeUpdate();
}`,
js:`const mysql = require("mysql2/promise");

async function main() {
  const db = await mysql.createConnection({ host: "localhost", user: "root", database: "school" });

  // CREATE
  await db.execute("INSERT INTO students (name, course) VALUES (?, ?)", ["Ana", "BSCS"]);

  // READ
  const [rows] = await db.execute("SELECT id, name, course FROM students");
  console.log(rows);

  // UPDATE
  await db.execute("UPDATE students SET name = ? WHERE id = ?", ["Ana Cruz", 1]);

  // DELETE
  await db.execute("DELETE FROM students WHERE id = ?", [1]);

  await db.end();
}

main();`}},

{id:"grid",group:"CRUD",title:"C# forms: grid + selected row",
 use:"WinForms CRUD: show all records in a DataGridView, and when a row is clicked, load it into the textboxes so it can be updated or deleted.",
 warn:"Call LoadStudents() again after every Add, Update and Delete, or the grid shows old data. Skip the header row (RowIndex < 0).",
 code:{cs:`private void LoadStudents()
{
    using (var conn = new SqlConnection(connStr))
    {
        var adapter = new SqlDataAdapter("SELECT id, name, course FROM students", conn);
        var table = new DataTable();
        adapter.Fill(table);
        dgvStudents.DataSource = table;
    }
}

private void dgvStudents_CellClick(object sender, DataGridViewCellEventArgs e)
{
    if (e.RowIndex < 0) return;
    var row = dgvStudents.Rows[e.RowIndex];
    txtId.Text = row.Cells["id"].Value.ToString();
    txtName.Text = row.Cells["name"].Value.ToString();
    txtCourse.Text = row.Cells["course"].Value.ToString();
}`}},

{id:"validate",group:"CRUD",title:"validate input before saving",
 use:"Before every Create and Update. Checkers type blanks, letters in number fields, or duplicate IDs on purpose to see if your app breaks.",
 warn:"Check BEFORE the INSERT, not after. int.Parse crashes on bad input; int.TryParse does not.",
 code:{cs:`string name = txtName.Text.Trim();
if (string.IsNullOrWhiteSpace(name))
{
    MessageBox.Show("Name is required.");
    return;
}

if (!int.TryParse(txtAge.Text, out int age) || age < 15)
{
    MessageBox.Show("Enter a valid age (15 or older).");
    return;
}

// safe to INSERT now`,
py:`name = input("Name: ").strip()
if not name:
    print("Name is required.")
else:
    age_text = input("Age: ")
    if not age_text.isdigit() or int(age_text) < 15:
        print("Enter a valid age (15 or older).")
    else:
        print("Saved", name, age_text)`,
java:`String name = sc.nextLine().trim();
if (name.isEmpty()) {
    System.out.println("Name is required.");
    return;
}
int age;
try {
    age = Integer.parseInt(sc.nextLine());
} catch (NumberFormatException e) {
    System.out.println("Age must be a number.");
    return;
}
if (age < 15) {
    System.out.println("Enter a valid age (15 or older).");
    return;
}`,
cpp:`string name;
int age;
getline(cin, name);
if (name.empty()) {
    cout << "Name is required." << endl;
    return 1;
}
if (!(cin >> age) || age < 15) {
    cout << "Enter a valid age (15 or older)." << endl;
    return 1;
}`,
js:`const name = form.name.value.trim();
if (!name) {
  alert("Name is required.");
  return;
}
const age = Number(form.age.value);
if (!Number.isInteger(age) || age < 15) {
  alert("Enter a valid age (15 or older).");
  return;
}`}},
];

export const CS_QUIZ = [
 {l:"C#",q:"What does this print?",code:`string a = "hi";
string b = "hi";
Console.WriteLine(a == b);`,opts:["True","False","Compile error","hi"],a:0,why:"In C#, == on strings compares the text (unlike Java, where it compares references)."},
 {l:"C#",q:"What does this print?",code:`var list = new List<int> { 5, 6, 7 };
list.RemoveAt(1);
Console.WriteLine(string.Join(",", list));`,opts:["5,7","6,7","5,6","5,6,7"],a:0,why:"RemoveAt removes by INDEX. Index 1 is the value 6. Remove(6) would remove by value."},
 {l:"C#",q:"What does this print?",code:`int.TryParse("12a", out int n);
Console.WriteLine(n);`,opts:["0","12","FormatException","null"],a:0,why:"TryParse returns false and sets n to 0 instead of crashing. int.Parse(\"12a\") would throw."},
 {l:"C#",q:"What does this print?",code:`int x = 7 / 2;
double y = 7 / 2.0;
Console.WriteLine(x + " " + y);`,opts:["3 3.5","3.5 3.5","3 3","4 3.5"],a:0,why:"int / int is integer division. One double operand makes it a double division."},
 {l:"C#",q:"Which method runs an INSERT, UPDATE or DELETE?",code:`var cmd = new SqlCommand("DELETE FROM students WHERE id = @id", conn);
cmd.Parameters.AddWithValue("@id", 3);
cmd.________();`,opts:["ExecuteNonQuery","ExecuteReader","ExecuteScalar","Fill"],a:0,why:"ExecuteNonQuery returns the number of rows affected. ExecuteReader is for SELECT; ExecuteScalar returns one value like COUNT(*)."},
 {l:"C#",q:"What is wrong with this line?",code:`var sql = "DELETE FROM students WHERE id = " + txtId.Text;`,opts:["SQL injection risk","It runs too slowly","C# can't join strings","Nothing"],a:0,why:"Typing 1 OR 1=1 in the textbox deletes every row. Use a parameter: WHERE id = @id."},
 {l:"C#",q:"What does ExecuteScalar return here?",code:`var cmd = new SqlCommand("SELECT COUNT(*) FROM students", conn);
var total = cmd.ExecuteScalar();`,opts:["The number of rows","The first student","A DataTable","Nothing"],a:0,why:"ExecuteScalar returns the first column of the first row — here the count. Convert it with Convert.ToInt32(total)."},
 {l:"SQL",q:"What happens when this runs?",code:`UPDATE students SET course = 'BSIT';`,opts:["Every student becomes BSIT","Only the first row changes","Error: WHERE is required","Nothing changes"],a:0,why:"With no WHERE, UPDATE changes every row. Always write WHERE id = ... in CRUD updates."},
 {l:"SQL",q:"Which statement is the R in CRUD?",code:`C  R  U  D`,opts:["SELECT","INSERT","UPDATE","DELETE"],a:0,why:"Create = INSERT, Read = SELECT, Update = UPDATE, Delete = DELETE."},
 {l:"C#",q:"What does students.Count print?",code:`var students = new List<string> { "Ana", "Ben" };
students.Add("Cara");
students.Remove("Ben");
students.Add("Dan");
Console.WriteLine(students.Count);`,opts:["3","4","2","5"],a:0,why:"2 items, +1 = 3, −1 = 2, +1 = 3."},
];
