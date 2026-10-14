// Turns a snippet into a complete program you can paste into a new project and run,
// and says how to create and run that project.

const indent = (code, n) => code.split('\n').map((l) => (l.trim() ? ' '.repeat(n) + l : '')).join('\n');

// Split top-level declarations (methods, classes) from statements.
// A declaration starts at column 0 and runs until its braces balance.
function splitTopLevel(code, isDecl) {
  const lines = code.split('\n');
  const decls = [], body = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/^\s/.test(line) && line.trim() && isDecl(line)) {
      const block = [];
      let depth = 0, opened = false;
      for (; i < lines.length; i++) {
        const l = lines[i];
        block.push(l);
        for (const ch of l) {
          if (ch === '{') { depth++; opened = true; }
          else if (ch === '}') depth--;
        }
        if (opened && depth <= 0) break;
      }
      decls.push(block.join('\n'));
    } else body.push(line);
  }
  const trim = (arr) => arr.join('\n').replace(/^\n+|\n+$/g, '').replace(/\n{3,}/g, '\n\n');
  return { decls: decls.map((d) => d.replace(/^\n+|\n+$/g, '')), body: trim(body) };
}

const isWinForms = (code) => /\b(MessageBox|txt[A-Z]\w*|dgv\w*|DataGridView|InitializeComponent|Form1)\b/.test(code);

function csUsings(code, forms) {
  const u = ['System'];
  if (/\b(List|Dictionary|Stack|Queue|HashSet)</.test(code)) u.push('System.Collections.Generic');
  if (/\b(DataTable|SqlDataAdapter)\b/.test(code) || forms) u.push('System.Data');
  if (/\bSql(Connection|Command|DataAdapter)\b/.test(code)) u.push('Microsoft.Data.SqlClient');
  if (forms) u.push('System.Windows.Forms');
  return u.map((x) => `using ${x};`).join('\n');
}

function csharp(code) {
  const forms = isWinForms(code);
  const usings = csUsings(code, forms);
  if (forms) {
    // Already a whole form class?
    if (/class\s+Form1/.test(code)) {
      return {
        code: `${usings}\n\nnamespace StudentApp\n{\n${indent(code, 4)}\n}`,
        kind: 'forms',
      };
    }
    // Methods (LoadStudents, dgv_CellClick…) go straight inside Form1;
    // loose statements (validation) go inside a button's Click method.
    const isMethod = (l) => /^(?:(?:private|public|protected|static)\s+)*[\w<>\[\]]+\s+\w+\s*\([^;=]*\)\s*\{?\s*$/.test(l);
    const { decls, body } = splitTopLevel(code, isMethod);
    const parts = [];
    if (/connStr/.test(code) && !/string\s+connStr/.test(code)) {
      parts.push('string connStr = @"Server=.\\SQLEXPRESS;Database=SchoolDb;Trusted_Connection=True;TrustServerCertificate=True;";');
    }
    const loader = decls.map((d) => d.match(/void\s+(Load\w*)\s*\(\s*\)/)).find(Boolean);
    parts.push(`public Form1()\n{\n    InitializeComponent();${loader ? `\n    ${loader[1]}();` : ''}\n}`);
    if (body.trim()) parts.push(`private void btnSave_Click(object sender, EventArgs e)\n{\n${indent(body, 4)}\n}`);
    parts.push(...decls);
    return {
      code: `${usings}\n\nnamespace StudentApp\n{\n    public partial class Form1 : Form\n    {\n${indent(parts.join('\n\n'), 8)}\n    }\n}`,
      kind: 'forms',
    };
  }
  // Console app: methods become static methods of Program, classes sit beside it.
  const { decls, body } = splitTopLevel(code, (l) => /^(static|class|struct|public|private|enum)\b/.test(l));
  const classes = decls.filter((d) => /^(public\s+)?(class|struct|enum)\b/.test(d));
  const methods = decls.filter((d) => !classes.includes(d)).map((d) => (/^static\b/.test(d) ? d : 'static ' + d));
  const inner = [`static void Main(string[] args)\n{\n${indent(body || '// your code here', 4)}\n}`, ...methods].join('\n\n');
  const program = `class Program\n{\n${indent(inner, 4)}\n}`;
  return {
    code: `${usings}\n\nnamespace Practice\n{\n${indent([program, ...classes].join('\n\n'), 4)}\n}`,
    kind: 'console',
  };
}

function java(code) {
  const imports = [];
  if (/\b(List|ArrayList|Map|HashMap|Stack|Queue|LinkedList|Scanner)\b/.test(code)) imports.push('import java.util.*;');
  if (/\b(Connection|DriverManager|PreparedStatement|ResultSet)\b/.test(code)) imports.push('import java.sql.*;');
  if (/public\s+static\s+void\s+main/.test(code)) {
    return { code: `${imports.join('\n')}${imports.length ? '\n\n' : ''}public class Main {\n${indent(code, 4)}\n}`, kind: 'console' };
  }
  const { decls, body } = splitTopLevel(code, (l) => /^(static|class|public|private)\b/.test(l));
  const classes = decls.filter((d) => /^(public\s+)?class\b/.test(d));
  const methods = decls.filter((d) => !classes.includes(d));
  const usesScanner = /\bsc\./.test(body) && !/new Scanner/.test(body);
  const mainBody = (usesScanner ? 'Scanner sc = new Scanner(System.in);\n' : '') + (body || '// your code here');
  const throwsSql = /DriverManager/.test(code) ? ' throws Exception' : '';
  const inner = [`public static void main(String[] args)${throwsSql} {\n${indent(mainBody, 4)}\n}`, ...methods].join('\n\n');
  const extra = classes.map((c) => c.replace(/^public\s+class/, 'class')).join('\n\n');
  const studentStub = /new Student\(/.test(code) && !/class Student/.test(code)
    ? '\n\nclass Student {\n    int id;\n    String name, course;\n\n    Student(int id, String name, String course) {\n        this.id = id;\n        this.name = name;\n        this.course = course;\n    }\n}'
    : '';
  return {
    code: `${imports.join('\n')}${imports.length ? '\n\n' : ''}public class Main {\n${indent(inner, 4)}\n}${extra ? '\n\n' + extra : ''}${studentStub}`,
    kind: 'console',
  };
}

function cpp(code) {
  const inc = ['iostream'];
  for (const [re, h] of [[/\bvector</, 'vector'], [/\bstring\b/, 'string'], [/\bmap</, 'map'], [/\bstack</, 'stack'], [/\bqueue</, 'queue'], [/\b(remove_if|swap|sort)\b/, 'algorithm'], [/out_of_range/, 'stdexcept']]) if (re.test(code)) inc.push(h);
  const head = inc.map((h) => `#include <${h}>`).join('\n') + '\nusing namespace std;';
  if (/\bint\s+main\s*\(/.test(code)) return { code: `${head}\n\n${code}`, kind: 'console' };
  const { decls, body } = splitTopLevel(code, (l) => /^(class|struct|int|void|bool|double|string)\s+\w+\s*(\(|\{|$)/.test(l) && !/;\s*$/.test(l));
  return {
    code: `${head}\n\n${decls.length ? decls.join('\n\n') + '\n\n' : ''}int main() {\n${indent(body || '// your code here', 4)}\n    return 0;\n}`,
    kind: 'console',
  };
}

export function fullProgram(code, lang) {
  if (lang === 'cs') return csharp(code);
  if (lang === 'java') return java(code);
  if (lang === 'cpp') return cpp(code);
  return { code, kind: 'script' }; // Python, JavaScript and SQL run as they are
}

// How to create the project and run it.
export function howToRun(lang, kind) {
  if (lang === 'cs' && kind === 'forms') {
    return [
      'Open Visual Studio and choose Create a new project.',
      'Pick "Windows Forms App" (C#), give it a name, and press Create.',
      'Install the database package: Project, Manage NuGet Packages, Browse, "Microsoft.Data.SqlClient".',
      'Drag the controls you need from the Toolbox onto the form and rename them (txtName, btnAdd, dgv).',
      'Right-click Form1 and choose View Code. Replace the class with this code; keep your own namespace name.',
      'Double-click each button in the Designer so its Click method is connected, then press F5 to run.',
    ];
  }
  if (lang === 'cs') {
    return [
      'Open Visual Studio and choose Create a new project.',
      'Pick "Console App" (C#), give it a name, and press Create.',
      'Open Program.cs and replace everything in it with this code.',
      'Press Ctrl + F5 to run it. The output appears in a black console window.',
      'New projects may show just one line, Console.WriteLine("Hello, World!"). That is the short style; both styles work.',
    ];
  }
  if (lang === 'java') return ['Save the code as Main.java.', 'In a terminal: javac Main.java, then java Main. Or paste it into an online Java compiler.'];
  if (lang === 'cpp') return ['Save the code as main.cpp.', 'In a terminal: g++ main.cpp -o main, then ./main. Or create a C++ Console App in Visual Studio and press Ctrl + F5.'];
  if (lang === 'py') return ['Save the code as main.py.', 'In a terminal: python main.py. Python runs from top to bottom; no Main method is needed.'];
  if (lang === 'js') return ['Save the code as main.js.', 'In a terminal: node main.js. Or paste it into your browser console (F12).'];
  if (lang === 'sql') return ['Open SQL Server Management Studio (or phpMyAdmin for MySQL).', 'Open a New Query on your database, paste this, and press Execute (F5).'];
  return [];
}
