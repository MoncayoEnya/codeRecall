// "Write from scratch" prompts and "Bug hunt" snippets. C# unless marked SQL.

export const WRITE = [
  {
    id: 'load', title: 'LoadData()',
    prompt: 'Write a LoadData() method that fills the DataGridView dgv with every row from the students table.',
    lang: 'cs',
    answer: `void LoadData()
{
    using (var conn = new SqlConnection(connStr))
    {
        var da = new SqlDataAdapter("SELECT * FROM students", conn);
        var dt = new DataTable();
        da.Fill(dt);
        dgv.DataSource = dt;
    }
}`,
  },
  {
    id: 'insert', title: 'Add button',
    prompt: 'Write btnAdd_Click: INSERT full_name (txtName) and course (txtCourse) into students using parameters. Then show "Saved.", clear the fields and reload the grid. Assume IsValid(), ClearFields() and LoadData() exist.',
    lang: 'cs',
    answer: `private void btnAdd_Click(object sender, EventArgs e)
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
}`,
  },
  {
    id: 'cellclick', title: 'Select a row',
    prompt: 'Write dgv_CellClick: ignore the header row, save the row\'s id in selectedId, and put full_name and course into txtName and txtCourse.',
    lang: 'cs',
    answer: `private void dgv_CellClick(object sender, DataGridViewCellEventArgs e)
{
    if (e.RowIndex < 0) return;
    var row = dgv.Rows[e.RowIndex];
    selectedId = Convert.ToInt32(row.Cells["id"].Value);
    txtName.Text = row.Cells["full_name"].Value.ToString();
    txtCourse.Text = row.Cells["course"].Value.ToString();
}`,
  },
  {
    id: 'update', title: 'Update button',
    prompt: 'Write btnUpdate_Click: if nothing is selected (selectedId == 0) show a message. Otherwise validate, UPDATE full_name and course WHERE id = selectedId, then clear and reload.',
    lang: 'cs',
    answer: `private void btnUpdate_Click(object sender, EventArgs e)
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
}`,
  },
  {
    id: 'delete', title: 'Delete with confirm',
    prompt: 'Write btnDelete_Click: message if nothing is selected, ask "Delete this record?" with Yes/No, and only if Yes DELETE WHERE id = selectedId. Then clear and reload.',
    lang: 'cs',
    answer: `private void btnDelete_Click(object sender, EventArgs e)
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
}`,
  },
  {
    id: 'valid', title: 'IsValid()',
    prompt: 'Write bool IsValid(): txtName must not be blank, and txtAge must be a whole number from 15 to 99. Show a message and return false on the first problem.',
    lang: 'cs',
    answer: `bool IsValid()
{
    if (string.IsNullOrWhiteSpace(txtName.Text))
    {
        MessageBox.Show("Name is required.");
        return false;
    }
    if (!int.TryParse(txtAge.Text, out int age) || age < 15 || age > 99)
    {
        MessageBox.Show("Age must be a number from 15 to 99.");
        return false;
    }
    return true;
}`,
  },
  {
    id: 'search', title: 'Search as you type',
    prompt: 'Write txtSearch_TextChanged: show only students whose full_name contains the search text. Use a LIKE parameter.',
    lang: 'cs',
    answer: `private void txtSearch_TextChanged(object sender, EventArgs e)
{
    using (var conn = new SqlConnection(connStr))
    {
        var da = new SqlDataAdapter("SELECT * FROM students WHERE full_name LIKE @q", conn);
        da.SelectCommand.Parameters.AddWithValue("@q", "%" + txtSearch.Text + "%");
        var dt = new DataTable();
        da.Fill(dt);
        dgv.DataSource = dt;
    }
}`,
  },
  {
    id: 'count', title: 'Count with ExecuteScalar',
    prompt: 'Write int CountStudents() that returns how many rows are in students.',
    lang: 'cs',
    answer: `int CountStudents()
{
    using (var conn = new SqlConnection(connStr))
    {
        conn.Open();
        var cmd = new SqlCommand("SELECT COUNT(*) FROM students", conn);
        return Convert.ToInt32(cmd.ExecuteScalar());
    }
}`,
  },
  {
    id: 'class', title: 'Product class',
    prompt: 'Write a Product class with Id (int), Name (string), Price (decimal) and Stock (int) properties.',
    lang: 'cs',
    answer: `class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    public int Stock { get; set; }
}`,
  },
  {
    id: 'listupdate', title: 'Update in a List',
    prompt: 'Given List<Product> products, find the product with Id 3 and set its Price to 99.50. Print "Not found" if it does not exist.',
    lang: 'cs',
    answer: `var p = products.Find(x => x.Id == 3);
if (p != null)
{
    p.Price = 99.50m;
}
else
{
    Console.WriteLine("Not found");
}`,
  },
  {
    id: 'sqltable', title: 'CREATE TABLE',
    prompt: 'SQL Server: create a products table with an auto-increment id primary key, a required unique name, price DECIMAL(10,2) and stock INT.',
    lang: 'sql',
    answer: `CREATE TABLE products (
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL
);`,
  },
  {
    id: 'sqlcrud', title: 'The four SQL statements',
    prompt: 'For the products table: insert a "Mouse" at 350.00 with 10 stock, select all products with stock below 5, set the price of id 2 to 499.00, and delete id 4.',
    lang: 'sql',
    answer: `INSERT INTO products (name, price, stock)
VALUES ('Mouse', 350.00, 10);

SELECT * FROM products
WHERE stock < 5;

UPDATE products
SET price = 499.00
WHERE id = 2;

DELETE FROM products
WHERE id = 4;`,
  },
];

// `bad` is the 0-based index of the line with the bug.
export const BUGS = [
  { id: 'noopen', title: 'Delete crashes', lang: 'cs',
    code: `using (var conn = new SqlConnection(connStr))
{
    var cmd = new SqlCommand("DELETE FROM students WHERE id = @id", conn);
    cmd.Parameters.AddWithValue("@id", selectedId);
    cmd.ExecuteNonQuery();
}`,
    bad: 4, why: 'ExecuteNonQuery needs an open connection, so this line throws. conn.Open() was never called.',
    fix: 'Add conn.Open(); right after the opening brace.' },
  { id: 'nowhere', title: 'Every name changed', lang: 'cs',
    code: `using (var conn = new SqlConnection(connStr))
{
    conn.Open();
    var cmd = new SqlCommand("UPDATE students SET full_name = @name", conn);
    cmd.Parameters.AddWithValue("@name", txtName.Text);
    cmd.ExecuteNonQuery();
}`,
    bad: 3, why: 'No WHERE, so every student gets the same name.',
    fix: '... SET full_name = @name WHERE id = @id, plus AddWithValue("@id", selectedId).' },
  { id: 'param', title: '"Must declare the scalar variable"', lang: 'cs',
    code: `var cmd = new SqlCommand("INSERT INTO students (full_name, course) VALUES (@name, @course)", conn);
cmd.Parameters.AddWithValue("@name", txtName.Text);
cmd.Parameters.AddWithValue("@crs", txtCourse.Text);
cmd.ExecuteNonQuery();`,
    bad: 2, why: 'The SQL uses @course but the parameter is named @crs, so @course is never given a value.',
    fix: 'cmd.Parameters.AddWithValue("@course", txtCourse.Text);' },
  { id: 'reader', title: 'Won\'t compile', lang: 'cs',
    code: `var cmd = new SqlCommand("SELECT full_name FROM students", conn);
var reader = cmd.ExecuteNonQuery();
while (reader.Read())
{
    Console.WriteLine(reader["full_name"]);
}`,
    bad: 1, why: 'ExecuteNonQuery returns an int (rows affected), not rows to read. SELECT needs ExecuteReader.',
    fix: 'var reader = cmd.ExecuteReader();' },
  { id: 'inject', title: 'Works, but fails the checker', lang: 'cs',
    code: `string sql = "DELETE FROM students WHERE id = " + txtId.Text;
var cmd = new SqlCommand(sql, conn);
cmd.ExecuteNonQuery();`,
    bad: 0, why: 'User text is glued into SQL. Typing 1 OR 1=1 deletes every row (SQL injection).',
    fix: 'Use "... WHERE id = @id" and cmd.Parameters.AddWithValue("@id", ...).' },
  { id: 'header', title: 'Crash when clicking the grid', lang: 'cs',
    code: `private void dgv_CellClick(object sender, DataGridViewCellEventArgs e)
{
    var row = dgv.Rows[e.RowIndex];
    txtName.Text = row.Cells["full_name"].Value.ToString();
}`,
    bad: 2, why: 'Clicking the header row gives RowIndex -1, and Rows[-1] throws.',
    fix: 'Add if (e.RowIndex < 0) return; before this line.' },
  { id: 'order', title: 'New record missing from the grid', lang: 'cs',
    code: `conn.Open();
var cmd = new SqlCommand("INSERT INTO students (full_name) VALUES (@name)", conn);
cmd.Parameters.AddWithValue("@name", txtName.Text);
LoadData();
cmd.ExecuteNonQuery();`,
    bad: 3, why: 'The grid reloads BEFORE the insert runs, so it shows old data.',
    fix: 'Move LoadData(); after ExecuteNonQuery (and after the using block).' },
  { id: 'parse', title: 'Typing "abc" crashes the app', lang: 'cs',
    code: `if (string.IsNullOrWhiteSpace(txtName.Text))
{
    MessageBox.Show("Name is required.");
    return;
}
int age = int.Parse(txtAge.Text);`,
    bad: 5, why: 'int.Parse throws FormatException on text that is not a number.',
    fix: 'if (!int.TryParse(txtAge.Text, out int age)) { MessageBox.Show("Age must be a number."); return; }' },
  { id: 'confirm', title: 'Delete does the opposite', lang: 'cs',
    code: `var answer = MessageBox.Show("Delete this record?", "Confirm", MessageBoxButtons.YesNo);
if (answer == DialogResult.Yes) return;
DeleteStudent(selectedId);`,
    bad: 1, why: 'It stops when the user says Yes and deletes when they say No.',
    fix: 'if (answer != DialogResult.Yes) return;' },
  { id: 'quotes', title: 'SQL syntax error', lang: 'sql',
    code: `INSERT INTO students (full_name, course)
VALUES (Ana Cruz, 'BSCS');`,
    bad: 1, why: 'Text values need single quotes. Without them SQL reads Ana Cruz as column names.',
    fix: "VALUES ('Ana Cruz', 'BSCS');" },
  { id: 'offbyone', title: 'Index out of range', lang: 'cs',
    code: `var names = new List<string> { "Ana", "Ben", "Cara" };
for (int i = 0; i <= names.Count; i++)
{
    Console.WriteLine(names[i]);
}`,
    bad: 1, why: 'i reaches 3, but the last index is 2.',
    fix: 'for (int i = 0; i < names.Count; i++)' },
  { id: 'modify', title: '"Collection was modified"', lang: 'cs',
    code: `foreach (var s in students)
{
    if (s.Course == "BSIT")
        students.Remove(s);
}`,
    bad: 3, why: 'You cannot remove items from a list while foreach is looping over it.',
    fix: 'students.RemoveAll(s => s.Course == "BSIT");' },
  { id: 'having', title: 'Aggregate in WHERE', lang: 'sql',
    code: `SELECT course, COUNT(*) AS total
FROM students
WHERE COUNT(*) > 30
GROUP BY course;`,
    bad: 2, why: 'WHERE runs before grouping, so it cannot use COUNT(*).',
    fix: 'Remove that line and add HAVING COUNT(*) > 30 after GROUP BY.' },
];
