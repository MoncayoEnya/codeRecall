// Plain-English explanation of a single line of code. Works offline and instantly,
// on the built-in snippets and on whatever the student types. C# and SQL get the most
// detail (that's the test); Java, JavaScript, C++ and Python get the common patterns.
// Returns a string, or null when there's no quick explanation.

const TYPE_WORDS = {
  int: 'a whole number', long: 'a big whole number', double: 'a number with decimals', float: 'a number with decimals',
  decimal: 'an exact decimal number (good for money)', string: 'text', String: 'text', bool: 'true or false', boolean: 'true or false',
  char: 'a single character', var: 'a value (C# works out the type for you)', let: 'a value that can change', const: 'a value that never changes',
  auto: 'a value (C++ works out the type)',
};
const KEYWORDS = new Set(['if', 'for', 'foreach', 'while', 'switch', 'catch', 'using', 'return', 'new', 'else', 'do', 'lock']);
const paramsText = (p) =>
  p.split(',').map((x) => {
    const parts = x.trim().replace(/[&*]/g, ' ').split(/\s+/).filter(Boolean);
    if (parts.length < 2) return parts[0];
    const name = parts[parts.length - 1], t = parts.slice(0, -1).join(' ').replace(/^(const|final)\s+/, '');
    return `${name} (${TYPE_WORDS[t] || t})`;
  }).join(', ');
const short = (s, n = 40) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const plainCond = (c) =>
  c.trim()
    .replace(/!int\.TryParse\(([^,]+),\s*out\s+(?:int\s+)?\w+\)/g, '$1 is not a whole number')
    .replace(/int\.TryParse\(([^,]+),\s*out\s+(?:int\s+)?\w+\)/g, '$1 is a whole number')
    .replace(/!string\.IsNullOrWhiteSpace\(([^)]+)\)/g, '$1 is not empty')
    .replace(/string\.IsNullOrWhiteSpace\(([^)]+)\)/g, '$1 is empty')
    .replace(/\s*&&\s*/g, ' and ')
    .replace(/\s*\|\|\s*/g, ' or ')
    .replace(/\s*===?\s*/g, ' equals ')
    .replace(/\s*!==?\s*/g, ' is not ')
    .replace(/\s*<=\s*/g, ' is at most ')
    .replace(/\s*>=\s*/g, ' is at least ')
    .replace(/\s*<\s*/g, ' is less than ')
    .replace(/\s*>\s*/g, ' is more than ');

const RULES = [
  // ---------- comments and braces ----------
  [/^\s*(\/\/|#(?!include)|--)\s*(.*)$/, (m) => `A comment: "${short(m[2], 50)}". The computer skips it; it's a note for people.`],
  [/^\s*\{\s*$/, () => 'Opens a block. Everything until the matching } belongs to the line above.'],
  [/^\s*\}\s*;?\s*$/, () => 'Closes the block that was opened above.'],

  // ---------- program structure ----------
  [/^\s*using\s+([\w.]+)\s*;/, (m) => `Lets this file use things from the ${m[1]} library without typing the full name every time.`],
  [/^\s*#include\s*<(\w+)>/, (m) => `Brings in the C++ ${m[1]} library so you can use it.`],
  [/^\s*import\s+([\w.*]+)\s*;/, (m) => `Brings in ${m[1]} so this Java file can use it.`],
  [/^\s*using namespace std;/, () => 'Lets you write cout and string instead of std::cout and std::string.'],
  [/^\s*namespace\s+(\w+)/, (m) => `Groups your classes under the name ${m[1]}. Visual Studio writes this for you when you create the project.`],
  [/static\s+void\s+Main\s*\(/, () => 'Main: the program starts running here. Every C# console app has exactly one.'],
  [/public\s+static\s+void\s+main\s*\(/, () => 'main: the Java program starts running here.'],
  [/^\s*int\s+main\s*\(/, () => 'main: the C++ program starts running here.'],
  [/^\s*InitializeComponent\(\);/, () => "Builds the buttons, textboxes and grid you drew in the Designer. Visual Studio writes this; keep it as the first line."],
  [/^\s*(?:public\s+|private\s+|internal\s+)?(?:static\s+)?(?:partial\s+)?class\s+(\w+)\s*(?::\s*(\w+))?/, (m) =>
    `Starts a class named ${m[1]}: a blueprint that groups data and the methods that use it.` + (m[2] === 'Form' ? ' ": Form" means it is a window.' : '')],
  [/^\s*struct\s+(\w+)/, (m) => `Starts a struct named ${m[1]}: a simple bundle of related values.`],
  [/^\s*def\s+(\w+)\((.*)\):/, (m) => `Defines a function named ${m[1]}` + (m[2].trim() ? ` that takes ${m[2]}.` : ' with no inputs.')],
  [/^\s*def\s+__init__/, () => 'The constructor: runs when you create the object. It sets up the starting values.'],
  [/^\s*constructor\((.*)\)/, () => 'The constructor: runs when you create the object with new. It sets up the starting values.'],
  [/^\s*(?:async\s+)?function\s+(\w+)\((.*)\)/, (m) => `Defines a function named ${m[1]}` + (m[2].trim() ? ` that takes ${m[2]}.` : ' with no inputs.')],

  // properties, constructors, methods, event handlers
  [/^\s*(?:public|private)\s+([\w<>?\[\]]+)\s+(\w+)\s*\{\s*get;\s*set;\s*\}/, (m) =>
    `A property named ${m[2]} that holds ${TYPE_WORDS[m[1]] || m[1]}. get lets other code read it; set lets it change it.`],
  [/^\s*(?:public\s+|private\s+)?(\w+)\s*\(([^)]*)\)\s*(?::[^{]*)?\{?\s*\}?\s*$/, (m, line) => {
    if (KEYWORDS.has(m[1]) || !/^[A-Z]/.test(m[1])) return null;
    return `The constructor for ${m[1]}: runs once when you write new ${m[1]}(…). It sets up the starting values.`;
  }],
  [/^\s*(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:async\s+)?([\w<>\[\]&]+)\s+(\w+)\s*\(([^)]*)\)\s*(?:const\s*)?\{?\s*$/, (m) => {
    const [, ret, name, params] = m;
    if (KEYWORDS.has(ret) || KEYWORDS.has(name) || ret === 'new' || ret === 'return') return null;
    if (/_Click$/.test(name)) return `Runs when the user clicks ${name.replace(/_Click$/, '')}. Visual Studio connects it when you double-click that button in the Designer.`;
    if (/_CellClick$/.test(name)) return 'Runs when the user clicks a cell in the grid. e.RowIndex tells you which row.';
    if (/_TextChanged$/.test(name)) return `Runs every time the text in ${name.replace(/_TextChanged$/, '')} changes, so it updates as the user types.`;
    const inputs = params.trim() ? `It takes ${paramsText(params)}` : 'It takes no inputs';
    const out = ret === 'void' ? 'gives nothing back' : `gives back ${TYPE_WORDS[ret] || ret}`;
    return `Starts a method named ${name}. ${inputs} and ${out}.`;
  }],

  // ---------- loops ----------
  [/^\s*for\s*\(\s*(?:int|let|var|auto)?\s*(\w+)\s*=\s*([^;]+);\s*([^;]+);\s*([^)]+)\)/, (m) =>
    `A for loop: ${m[1]} starts at ${m[2].trim()}, the loop keeps going while ${plainCond(m[3])}, and ${m[4].trim()} runs after each round.`],
  [/^\s*foreach\s*\(\s*(?:var|[\w<>]+)\s+(\w+)\s+in\s+(.+?)\)\s*$/, (m) =>
    `Goes through every item in ${m[2]}, one at a time. Inside the loop, the current item is called ${m[1]}.`],
  [/^\s*for\s*\(\s*(?:const\s+|let\s+|var\s+|final\s+)?(?:auto|[\w<>]+)?\s*&?\s*(\w+)\s*(?::|of)\s*(.+?)\)/, (m) =>
    `Goes through every item in ${m[2]}, one at a time, calling the current one ${m[1]}.`],
  [/^\s*for\s+(\w+)\s+in\s+range\((.*)\):/, (m) => `Repeats the indented lines, with ${m[1]} taking each number from range(${m[2]}). The end number is not included.`],
  [/^\s*for\s+(\w+)\s+in\s+(.+):/, (m) => `Goes through every item in ${m[2]}, one at a time, calling it ${m[1]}.`],
  [/^\s*\}\s*while\s*\((.*)\)\s*;/, (m) => `End of the do-while: if ${plainCond(m[1])}, go back to "do" and run the block again.`],
  [/^\s*do\s*\{?\s*$/, () => 'Starts a do-while loop. The block always runs once before the condition is checked.'],
  [/^\s*while\s*\(\s*true\s*\)|^\s*while\s+True\s*:/, () => 'Loops forever until a break inside stops it.'],
  [/^\s*while\s*\((.*)\)\s*\{?\s*$/, (m) => `A while loop: repeats the block as long as ${plainCond(m[1])}. Something inside must change, or it never stops.`],
  [/^\s*while\s+(.*):/, (m) => `Repeats the indented lines as long as ${plainCond(m[1])}.`],
  [/^\s*break\s*;?/, () => 'Stops the loop (or switch) right now and jumps past it.'],
  [/^\s*continue\s*;?/, () => 'Skips the rest of this round and starts the next round of the loop.'],

  // ---------- decisions ----------
  [/^\s*if\s*\(\s*e\.RowIndex\s*<\s*0\s*\)\s*return/, () => 'If the header row was clicked (row -1), stop here so the app does not crash.'],
  [/^\s*if\s*\(\s*selectedId\s*==\s*0\s*\)/, () => 'If no record is selected yet, show a message and stop.'],
  [/^\s*if\s*\(\s*!IsValid\(\)\s*\)\s*return/, () => 'Runs the validation first. If something is wrong, stop before saving.'],
  [/^\s*if\s*\(\s*MessageBox\.Show\(/, () => 'Asks the user to confirm. If they do not press Yes, stop and do nothing.'],
  [/^\s*(?:\}\s*)?else\s+if\s*\((.*)\)/, (m) => `Otherwise, if ${plainCond(m[1])}, run this block instead.`],
  [/^\s*elif\s+(.*):/, (m) => `Otherwise, if ${plainCond(m[1])}, run this instead.`],
  [/^\s*if\s*\((.*)\)\s*(return|break|continue)\b(.*)$/, (m) => `If ${plainCond(m[1])}, ${m[2] === 'return' ? 'leave the method right away' : m[2] === 'break' ? 'stop the loop' : 'skip to the next round'}${m[3].trim() && m[3].trim() !== ';' ? ' (' + short(m[3].replace(/;$/, '').trim()) + ')' : ''}.`],
  [/^\s*if\s*\((.*)\)\s*\{?\s*$/, (m) => `Checks if ${plainCond(m[1])}. The block below runs only when that is true.`],
  [/^\s*if\s*\((.*?)\)\s+(.+);/, (m) => `If ${plainCond(m[1])}, then: ${short(m[2])}.`],
  [/^\s*if\s+(.*):/, (m) => `Checks if ${plainCond(m[1])}. The indented lines run only when that is true.`],
  [/^\s*(?:\}\s*)?else\s*:?\s*\{?\s*$/, () => 'Runs when none of the conditions above were true.'],
  [/^\s*switch\s*\((.*)\)/, (m) => `Compares ${m[1]} against the cases below and runs the one that matches.`],
  [/^\s*case\s+(.+):/, (m) => `Runs when the value is ${m[1]}.`],
  [/^\s*default\s*:/, () => 'Runs when no case matched.'],

  // ---------- errors ----------
  [/^\s*try\s*:?\s*\{?\s*$/, () => 'Try the code in this block. If it crashes, jump to catch instead of closing the app.'],
  [/^\s*(?:\}\s*)?catch\s*\(\s*(?:const\s+)?([\w.]+)&?\s*(\w*)\s*\)/, (m) => `Runs only if a ${m[1]} happened in the try block above. This is where you show a friendly message.`],
  [/^\s*(?:\}\s*)?catch\s*\(\s*(\w+)\s*\)/, () => 'Runs if anything in the try block failed.'],
  [/^\s*except\s+(\w+)/, (m) => `Runs only if a ${m[1]} happened in the try block.`],
  [/^\s*(?:\}\s*)?finally\s*:?\s*\{?\s*$/, () => 'Always runs at the end, whether there was an error or not.'],

  // ---------- database (C#) ----------
  [/using\s*\(\s*var\s+(\w+)\s*=\s*new\s+SqlConnection/, (m) => `Opens a connection to the database called ${m[1]}. "using" closes it automatically when the block ends, even after an error.`],
  [/using\s*\(\s*var\s+(\w+)\s*=\s*(\w+)\.ExecuteReader\(\)/, (m) => `Runs the SELECT and gives back a reader called ${m[1]} for going through the rows. "using" closes it when done.`],
  [/new\s+SqlCommand\(\s*"?\s*(INSERT|UPDATE|DELETE|SELECT)/i, (m) => `Prepares a SQL ${m[1].toUpperCase()} to run on this connection. Values written as @name get filled in by Parameters below.`],
  [/new\s+SqlCommand\(/, () => 'Prepares a SQL command to run on this connection.'],
  [/new\s+SqlDataAdapter\(/, () => 'Prepares to run a SELECT and copy the results into a DataTable. It opens and closes the connection by itself.'],
  [/Parameters\.AddWithValue\(\s*"(@\w+)"\s*,\s*(.+)\)\s*;/, (m) => `Fills in ${m[1]} with ${short(m[2])}. Using parameters instead of adding text keeps the query safe from SQL injection.`],
  [/\.ExecuteNonQuery\(\)/, () => 'Runs the INSERT, UPDATE or DELETE on the database. It returns how many rows changed.'],
  [/\.ExecuteScalar\(\)/, () => 'Runs the query and gives back just one value, like the number from COUNT(*).'],
  [/\.ExecuteReader\(\)/, () => 'Runs the SELECT and gives back a reader for going through the rows.'],
  [/\b(\w+)\.Read\(\)/, () => 'Moves to the next row. It returns false when there are no rows left, which ends the loop.'],
  [/\b(\w+)\.Open\(\)/, () => 'Opens the connection to the database. Commands cannot run until this happens.'],
  [/\.Fill\((\w+)\)/, (m) => `Runs the SELECT and puts every row into ${m[1]}.`],
  [/new\s+DataTable\(\)/, () => 'Creates an empty table in memory to hold the rows from the database.'],
  [/(\w+)\.DataSource\s*=\s*(\w+)/, (m) => `Shows ${m[2]} in the grid ${m[1]}. This is how records appear on screen.`],
  [/\.Rows\[e\.RowIndex\]/, () => 'Gets the row the user clicked.'],
  [/(\w+)\.Text\s*=\s*row\.Cells\["(\w+)"\]/, (m) => `Copies the ${m[2]} column of the clicked row into the ${m[1]} textbox.`],
  [/(\w+)\s*=\s*Convert\.ToInt32\(row\.Cells\["(\w+)"\]/, (m) => `Saves the clicked row's ${m[2]} in ${m[1]}, so Update and Delete know which record to change.`],

  // ---------- WinForms ----------
  [/MessageBox\.Show\(\s*"([^"]+)"/, (m) => `Shows a pop-up that says "${short(m[1], 50)}".`],
  [/^\s*(\w+)\.Clear\(\);/, (m) => `Empties ${m[1]}.`],
  [/^\s*(\w+)\.Text\s*=\s*""\s*;/, (m) => `Empties ${m[1]}.`],
  [/string\.IsNullOrWhiteSpace\(([^)]+)\)/, (m) => `Checks whether ${m[1]} is empty or only spaces.`],

  // ---------- conversions and input ----------
  [/(\w+)\s*=\s*(?:int|double|decimal)\.Parse\(\s*Console\.ReadLine\(\)\s*\)/, (m) => `Waits for the user to type something, turns it into a number, and stores it in ${m[1]}. It crashes if they type letters; int.TryParse is safer.`],
  [/(\w+)\[(\w+)\]\s*=\s*\(?\1(?:\.GetValueOrDefault\(\2\)|\.get\(\2,\s*0\)|\[\2\]\s*\|\|\s*0\)?)\s*\+\s*1/, (m) => `Adds 1 to the count for ${m[2]}. If ${m[2]} hasn't been seen before, its count starts at 0.`],
  [/(\w+)\.put\((\w+),\s*\1\.getOrDefault\(\2,\s*0\)\s*\+\s*1\)/, (m) => `Adds 1 to the count for ${m[2]}. getOrDefault gives 0 the first time ${m[2]} is seen.`],
  [/^\s*(\w+)\[(\w+)\]\+\+/, (m) => `Adds 1 to the count for ${m[2]} in ${m[1]}.`],
  [/int\.TryParse\(([^,]+),\s*out\s+(?:int\s+)?(\w+)\)/, (m) => `Tries to turn ${m[1].trim()} into a number. If it works, the number goes into ${m[2]}; if not, it returns false instead of crashing.`],
  [/(?:int|double|decimal)\.Parse\(([^)]+)\)/, (m) => `Turns the text ${m[1]} into a number. It crashes on text like "abc", so TryParse is safer.`],
  [/Integer\.parseInt\(([^)]+)\)/, (m) => `Turns the text ${m[1]} into a number. It throws an error on text like "abc".`],
  [/Convert\.ToInt32\(([^)]+)\)/, () => 'Converts the value into a whole number.'],
  [/Console\.ReadLine\(\)/, () => 'Waits for the user to type something and press Enter, and gives back what they typed as text.'],
  [/\.nextLine\(\)|\.nextInt\(\)/, () => 'Reads what the user types in the console.'],
  [/^\s*cin\s*>>/, () => 'Reads what the user types into the variable.'],
  [/input\((.*)\)/, () => 'Shows the prompt and waits for the user to type something.'],

  // ---------- output ----------
  [/Console\.WriteLine\((.*)\)\s*;/, (m) => (m[1].trim() ? `Prints ${short(m[1])} on the screen, then moves to a new line.` : 'Prints an empty line.')],
  [/Console\.Write\((.*)\)\s*;/, (m) => `Prints ${short(m[1])} without moving to a new line.`],
  [/System\.out\.println\((.*)\)\s*;/, (m) => `Prints ${short(m[1])}, then moves to a new line.`],
  [/^\s*cout\s*<<\s*(.*?)(?:<<\s*endl)?\s*;/, (m) => `Prints ${short(m[1].replace(/<<\s*$/, '').trim())} on the screen.`],
  [/console\.log\((.*)\)/, (m) => `Prints ${short(m[1])} to the console.`],
  [/^\s*print\((.*)\)/, (m) => `Prints ${short(m[1])} on the screen.`],

  // ---------- collections ----------
  [/(\w+)\s*=\s*new\s+(List|Dictionary|Stack|Queue|HashSet|ArrayList|HashMap|LinkedList)\s*<(.+?)>\s*\(/, (m) =>
    `Creates an empty ${m[2]} named ${m[1]} that holds ${m[3]} values.`],
  [/^\s*(?:var|List<.+?>)\s+(\w+)\s*=\s*new\s+List<(.+?)>\s*\{(.*)\}/, (m) => `Creates a list named ${m[1]} that already holds ${m[3].trim()}.`],
  [/^\s*(\w+)\[\]\s+(\w+)\s*=\s*\{(.*)\}/, (m) => `Makes an array named ${m[2]} holding ${m[3].trim()}. An array's size is fixed once it's made.`],
  [/^\s*(?:const|let|var)\s+(\w+)\s*=\s*\[(.*)\]/, (m) => `Makes an array named ${m[1]}` + (m[2].trim() ? ` holding ${m[2].trim()}.` : ' that starts empty.')],
  [/^\s*(\w+)\s*=\s*\[(.*)\]\s*$/, (m) => `Makes a list named ${m[1]}` + (m[2].trim() ? ` holding ${m[2].trim()}.` : ' that starts empty.')],
  [/(\w+)\.Push\((.*)\)/, (m) => `Puts ${short(m[2])} on top of ${m[1]} (a stack: last in, first out).`],
  [/(\w+)\.Enqueue\((.*)\)/, (m) => `Adds ${short(m[2])} to the back of ${m[1]} (a queue: first in, first out).`],
  [/(\w+)\.(Add|add|append|push|push_back)\((.*)\)/, (m) => `Adds ${short(m[3])} to the end of ${m[1]}.`],
  [/(\w+)\.RemoveAll\((\w+)\s*=>\s*(.+)\)/, (m) => `Deletes every item in ${m[1]} where ${plainCond(m[3].replace(new RegExp('\\b' + m[2] + '\\.', 'g'), ''))}.`],
  [/(\w+)\.RemoveAt\((.+)\)/, (m) => `Removes the item at position ${m[2]} from ${m[1]} (positions start at 0).`],
  [/(\w+)\.(Remove|removeIf|erase)\(/, (m) => `Removes an item from ${m[1]}.`],
  [/(\w+)\.Find\((\w+)\s*=>\s*(.+)\)/, (m) => `Searches ${m[1]} and gives back the first item where ${plainCond(m[3].replace(new RegExp('\\b' + m[2] + '\\.', 'g'), ''))}, or null if there is none.`],
  [/(\w+)\.(Pop|pop)\(\)/, (m) => `Takes the last item off ${m[1]} and gives it back (last in, first out).`],
  [/(\w+)\.(Dequeue|poll|shift|popleft)\(\)/, (m) => `Takes the first item out of ${m[1]} and gives it back (first in, first out).`],
  [/(\w+)\.(Count|Length|length|size\(\))\b/, (m) => `Uses how many items ${m[1]} has.`],

  // ---------- objects ----------
  [/^\s*(?:var|[A-Z]\w*)\s+(\w+)\s*=\s*new\s+([A-Z]\w*)\((.*)\)\s*;/, (m) => `Creates a new ${m[2]} object named ${m[1]}` + (m[3].trim() ? ` using ${short(m[3])}.` : '.')],
  [/^\s*this\.(\w+)\s*=\s*(\w+)\s*;/, (m) => `Saves the ${m[2]} that was passed in into this object's ${m[1]}.`],
  [/^\s*self\.(\w+)\s*=\s*(\w+)/, (m) => `Saves ${m[2]} into this object's ${m[1]}.`],

  // ---------- return ----------
  [/^\s*return\s*;/, () => 'Leaves the method right away.'],
  [/^\s*return\s+(.+?);?\s*$/, (m) => `Sends ${short(m[1])} back to the code that called this method, and leaves the method.`],

  // ---------- variables and math ----------
  [/^\s*(\w+)\+\+\s*;?/, (m) => `Adds 1 to ${m[1]}.`],
  [/^\s*(\w+)--\s*;?/, (m) => `Subtracts 1 from ${m[1]}.`],
  [/^\s*([\w.\[\]]+)\s*\+=\s*(.+?);?\s*$/, (m) => `Adds ${short(m[2])} to ${m[1]} (same as ${m[1]} = ${m[1]} + ${short(m[2], 20)}).`],
  [/^\s*(\w+)\s*-=\s*(.+?);?\s*$/, (m) => `Subtracts ${m[2]} from ${m[1]}.`],
  [/^\s*(\w+)\s*\/\/?=\s*(.+?);?\s*$/, (m) => `Divides ${m[1]} by ${m[2]}. With whole numbers, the decimal part is dropped.`],
  [/^\s*(int|double|decimal|string|String|bool|boolean|char|var|let|const|float|long|auto)\s+(\w+)\s*=\s*(.+?);?\s*$/, (m) =>
    `Creates a variable named ${m[2]} that holds ${TYPE_WORDS[m[1]] || m[1]}, starting at ${short(m[3])}.`],
  [/^\s*(int|double|decimal|string|String|bool|char|float|long)\s+(\w+)\s*;/, (m) => `Creates a variable named ${m[2]} for ${TYPE_WORDS[m[1]]}, without a value yet.`],
  [/^\s*(int|double|string|bool)\s+(\w+)\s*=\s*\d+\s*,\s*(\w+)\s*=/, (m) => `Creates two ${TYPE_WORDS[m[1]]} variables, ${m[2]} and ${m[3]}, on one line.`],
  [/^\s*\(([^)]+)\)\s*=\s*\(([^)]+)\)\s*;/, () => 'Swaps the two values in one step.'],
  [/^\s*\[([^\]]+)\]\s*=\s*\[([^\]]+)\]\s*;/, () => 'Swaps the two values in one step.'],
  [/^\s*swap\(/, () => 'Swaps the two values.'],

  // ---------- SQL ----------
  [/^\s*CREATE\s+TABLE\s+(\w+)/i, (m) => `Creates a new table named ${m[1]}. The lines below list its columns.`],
  [/^\s*CREATE\s+DATABASE\s+(\w+)/i, (m) => `Creates a new database named ${m[1]}.`],
  [/^\s*(\w+)\s+INT\s+PRIMARY\s+KEY\s+(IDENTITY|AUTO_INCREMENT)/i, (m) => `The ${m[1]} column: a whole number that is unique for every row, and the database numbers it for you.`],
  [/^\s*(\w+)\s+(VARCHAR|INT|DECIMAL|DATE)\s*(\([\d,\s]+\))?\s*(.*)/i, (m) =>
    `The ${m[1]} column holds ${/VARCHAR/i.test(m[2]) ? `text${m[3] ? ' up to ' + m[3].replace(/[()]/g, '') + ' characters' : ''}` : /INT/i.test(m[2]) ? 'whole numbers' : /DECIMAL/i.test(m[2]) ? 'decimal numbers' : 'dates'}` +
    (/NOT NULL/i.test(m[4]) ? ', and it is required' : '') + (/UNIQUE/i.test(m[4]) ? ', and no two rows can have the same value' : '') + '.'],
  [/^\s*INSERT\s+INTO\s+(\w+)\s*\(([^)]*)\)/i, (m) => `Adds a new row to ${m[1]}, filling the columns ${m[2]}.`],
  [/^\s*VALUES\s*\((.*)\)/i, (m) => `The values for the new row, in the same order as the columns: ${short(m[1])}.`],
  [/^\s*SELECT\s+(.+?)\s+FROM\s+(\w+)/i, (m) => `Reads ${m[1].trim() === '*' ? 'every column' : m[1]} from the ${m[2]} table.`],
  [/^\s*SELECT\s+(.+)$/i, (m) => `Chooses which columns to read: ${short(m[1])}.`],
  [/^\s*FROM\s+(\w+)/i, (m) => `From the ${m[1]} table.`],
  [/^\s*UPDATE\s+(\w+)/i, (m) => `Changes existing rows in ${m[1]}. Without a WHERE, it changes every row.`],
  [/^\s*SET\s+(.+)/i, (m) => `The new values: ${short(m[1])}.`],
  [/^\s*DELETE\s+FROM\s+(\w+)/i, (m) => `Deletes rows from ${m[1]}. Without a WHERE, it deletes every row.`],
  [/^\s*WHERE\s+(.+)/i, (m) => `Only the rows where ${plainCond(m[1].replace(/;$/, ''))}.`],
  [/^\s*(?:INNER\s+|LEFT\s+)?JOIN\s+(\w+)\s+(\w+\s+)?ON\s+(.+)/i, (m) => `Connects rows from ${m[1]} where ${m[3].replace(/;$/, '')}.`],
  [/^\s*GROUP\s+BY\s+(.+)/i, (m) => `Puts rows with the same ${m[1].replace(/;$/, '')} together, so COUNT or SUM works per group.`],
  [/^\s*HAVING\s+(.+)/i, (m) => `Keeps only the groups where ${m[1].replace(/;$/, '')}.`],
  [/^\s*ORDER\s+BY\s+(.+)/i, (m) => `Sorts the results by ${m[1].replace(/;$/, '')}.`],
  [/^\s*GO\s*$/i, () => 'Tells SQL Server to run everything above before continuing.'],
  [/^\s*USE\s+(\w+)/i, (m) => `Switches to the ${m[1]} database.`],

  // ---------- more languages and odd lines ----------
  [/^\s*\)\s*;?\s*$/, () => 'Closes the brackets opened on the line above.'],
  [/^\s*"(INSERT|UPDATE|DELETE|SELECT)/i, (m) => `The SQL ${m[1].toUpperCase()} text for the command started on the line above.`],
  [/\.execute\(\s*"(INSERT|UPDATE|DELETE|SELECT)/i, (m) => `Runs a SQL ${m[1].toUpperCase()}. Each ? is filled in, in order, with the values after the comma, which keeps it safe from SQL injection.`],
  [/\.(commit)\(\)/, () => 'Saves the changes to the database. Without this, INSERT, UPDATE and DELETE are lost.'],
  [/\.(close|end)\(\)/, () => 'Closes the connection to the database.'],
  [/^\s*import\s+(\w+)\s*$/, (m) => `Brings in the ${m[1]} library.`],
  [/DriverManager\.getConnection\(/, () => 'Connects to the database. try ( … ) closes the connection automatically when done.'],
  [/prepareStatement\(\s*$/, () => 'Prepares a SQL command. The SQL text is on the next line; each ? is filled in later.'],
  [/prepareStatement\(\s*"(\w+)/, (m) => `Prepares a SQL ${m[1].toUpperCase()}. Each ? is filled in with setInt or setString.`],
  [/(\w+)\.set(String|Int|Double)\((\d+),\s*(.+)\)/, (m) => `Fills in the ${['first', 'second', 'third', 'fourth'][+m[3] - 1] || m[3] + 'th'} ? with ${short(m[4])}.`],
  [/\.executeUpdate\(\)/, () => 'Runs the INSERT, UPDATE or DELETE.'],
  [/\.executeQuery\(/, () => 'Runs the SELECT and gives back the rows as a ResultSet.'],
  [/\.createStatement\(\)/, () => 'Makes a statement for running SQL on this connection.'],
  [/^\s*(?:private|public|protected)\s+(int|double|String|boolean|string|bool|decimal)\s+(\w+)\s*;/, (m) => `A field named ${m[2]} that every object of this class keeps. It holds ${TYPE_WORDS[m[1]]}.`],
  [/^\s*(?:public|private|protected)\s*:\s*$/, (m) => 'Everything below this line can be used from outside the class.'],
  [/Array\.Reverse\((\w+)\)/, (m) => `Reverses the order of the items in ${m[1]}.`],
  [/\.ToCharArray\(\)/, () => 'Splits the text into an array of single characters.'],
  [/^\s*string\s+(\w+)\((\w+)\.rbegin\(\)/, (m) => `Builds ${m[1]} from ${m[2]} read backwards.`],
  [/^\s*(\w+)\s+(\w+)\[\]\s*=\s*\{(.*)\}/, (m) => `Makes an array named ${m[2]} holding ${m[3].trim()}. Its size is fixed.`],
  [/^\s*(?:let|var)\s+(\w+)\s*;/, (m) => `Creates a variable named ${m[1]} with no value yet.`],
  [/^\s*([A-Z]\w*)\s+(\w+)\((.+)\)\s*;/, (m) => `Creates a ${m[1]} object named ${m[2]} using ${short(m[3])}.`],
  [/^\s*(\w+)\(([^)]*)\)\s*\{\s*$/, (m) => (KEYWORDS.has(m[1]) ? null : `Starts a method named ${m[1]}` + (m[2].trim() ? ` that takes ${m[2]}.` : ' with no inputs.'))],
  [/^\s*\[.*\]\s*=\s*\[.*\]\s*;?/, () => 'Swaps the two values in one step.'],
  [/^\s*([^,=]+?),\s*([^,=]+?)\s*=\s*\2\s*,\s*\1\s*$/, () => 'Swaps the two values in one step.'],
  [/^\s*(\w+),\s*(\w+)\s*=\s*([^,]+),\s*(.+)$/, (m) => `Sets ${m[1]} to ${m[3].trim()} and ${m[2]} to ${m[4].trim()} at the same time.`],
  [/^\s*else\s+(.+);/, (m) => `Otherwise: ${short(m[1])}.`],
  [/^\s*\[\]\(.*\)\s*\{\s*return (.+?);\s*\}/, (m) => `A small inline function that checks ${plainCond(m[1])}.`],
  [/^\s*(?:private\s+|public\s+)?((?:[\w:]+)\s*<[^=;]+>|\w+\[\]|[A-Z]\w*)\s+(\w+)\s*(?:=\s*(.+?))?;\s*$/, (m) =>
    `Creates ${m[2]}, which holds ${TYPE_WORDS[m[1]] || m[1].replace(/\s+/g, '')}` + (m[3] ? `, starting as ${short(m[3])}.` : '.')],

  // ---------- fallbacks ----------
  [/^\s*([\w.]+(?:\[[^\]]+\])*)\s*=\s*(.+?);?\s*$/, (m) => `Sets ${short(m[1])} to ${short(m[2])}.`],
  [/^\s*(\w+)\((.*)\)\s*;?\s*$/, (m) => `Calls the ${m[1]} method${m[2].trim() ? ` with ${short(m[2])}` : ''}.`],
];

// A short note about lambdas, since they show up in CRUD code and confuse beginners.
function lambdaNote(line) {
  const m = line.match(/\b(\w+)\s*=>\s*/);
  return m ? ` (${m[1]} => … means "for each ${m[1]}, check this".)` : '';
}

export function explainLine(line) {
  if (!line || !line.trim()) return null;
  for (const [re, fn] of RULES) {
    const m = line.match(re);
    if (m) {
      const out = fn(m, line);
      if (out) return out + (/RemoveAll|Find\(|removeIf|filter|find\(/.test(line) ? '' : lambdaNote(line));
    }
  }
  return null;
}
