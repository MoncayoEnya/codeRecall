// Study content: concept cards, 27-day plan and output quiz.
import { CRUD_CONCEPTS, CS, CS_QUIZ } from './csharp';

const BASE=[
{id:"for",group:"Basics",title:"for loop",
 use:"You know how many times to repeat, or you are going through every item in an array, list or string.",
 warn:"Off-by-one: i <= length goes one past the end. Use i < length.",
 code:{py:`nums = [3, 7, 1, 9]
total = 0
for n in nums:
    total += n
print(total)  # 20

for i in range(1, 6):
    print(i)  # 1 2 3 4 5`,
java:`int[] nums = {3, 7, 1, 9};
int total = 0;
for (int i = 0; i < nums.length; i++) {
    total += nums[i];
}
System.out.println(total); // 20`,
cpp:`int nums[] = {3, 7, 1, 9};
int total = 0;
for (int i = 0; i < 4; i++) {
    total += nums[i];
}
cout << total << endl; // 20`,
js:`const nums = [3, 7, 1, 9];
let total = 0;
for (let i = 0; i < nums.length; i++) {
  total += nums[i];
}
console.log(total); // 20`}},
{id:"while",group:"Basics",title:"while loop",
 use:"You don't know how many times. Keep going until something changes: input is valid, a number reaches 0, a file ends.",
 warn:"Forgetting to change the variable inside the loop gives an infinite loop.",
 code:{py:`n = 4096
digits = 0
while n > 0:
    n //= 10
    digits += 1
print(digits)  # 4`,
java:`int n = 4096;
int digits = 0;
while (n > 0) {
    n /= 10;
    digits++;
}
System.out.println(digits); // 4`,
cpp:`int n = 4096;
int digits = 0;
while (n > 0) {
    n /= 10;
    digits++;
}
cout << digits << endl; // 4`,
js:`let n = 4096;
let digits = 0;
while (n > 0) {
  n = Math.floor(n / 10);
  digits++;
}
console.log(digits); // 4`}},
{id:"dowhile",group:"Basics",title:"do-while loop",
 use:"The body must run at least once before checking — menus, \"play again?\", asking for input until it is valid.",
 warn:"Java, C++ and JS need the semicolon after while (...). Python has no do-while.",
 code:{py:`# Python has no do-while: use while True + break
while True:
    choice = int(input("1) Play  0) Exit: "))
    if choice == 0:
        break`,
java:`Scanner sc = new Scanner(System.in);
int choice;
do {
    System.out.println("1) Play  0) Exit");
    choice = sc.nextInt();
} while (choice != 0);`,
cpp:`int choice;
do {
    cout << "1) Play  0) Exit" << endl;
    cin >> choice;
} while (choice != 0);`,
js:`let roll;
do {
  roll = Math.floor(Math.random() * 6) + 1;
  console.log("Rolled", roll);
} while (roll !== 6);`}},
{id:"if",group:"Basics",title:"if / else if / else",
 use:"Choosing between ranges or conditions (grades, prices). Use switch instead when one variable is compared to fixed values like menu numbers.",
 warn:"Order matters: check the biggest range first, or score >= 80 catches a 95.",
 code:{py:`score = 85
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
else:
    grade = "C"
print(grade)  # B`,
java:`int score = 85;
String grade;
if (score >= 90) {
    grade = "A";
} else if (score >= 80) {
    grade = "B";
} else {
    grade = "C";
}
System.out.println(grade); // B`,
cpp:`int score = 85;
string grade;
if (score >= 90) {
    grade = "A";
} else if (score >= 80) {
    grade = "B";
} else {
    grade = "C";
}
cout << grade << endl; // B`,
js:`const score = 85;
let grade;
if (score >= 90) {
  grade = "A";
} else if (score >= 80) {
  grade = "B";
} else {
  grade = "C";
}
console.log(grade); // B`}},
{id:"func",group:"Basics",title:"functions",
 use:"You repeat the same logic twice, or a task has a clear input and output. Test questions often say \"write a function that…\".",
 warn:"Printing is not returning. If the question says return, use return.",
 code:{py:`def area(w, h):
    return w * h

print(area(4, 5))  # 20`,
java:`static int area(int w, int h) {
    return w * h;
}

public static void main(String[] args) {
    System.out.println(area(4, 5)); // 20
}`,
cpp:`int area(int w, int h) {
    return w * h;
}

int main() {
    cout << area(4, 5) << endl; // 20
    return 0;
}`,
js:`function area(w, h) {
  return w * h;
}

console.log(area(4, 5)); // 20`}},
{id:"array",group:"Data",title:"arrays & lists: find the max",
 use:"Storing many values of the same kind and looping over them. Max, min, sum and average are classic test questions.",
 warn:"Start biggest at the first element, not 0 — all-negative arrays break biggest = 0.",
 code:{py:`nums = [4, 15, 8, 23]
biggest = nums[0]
for n in nums:
    if n > biggest:
        biggest = n
print(biggest)  # 23`,
java:`int[] nums = {4, 15, 8, 23};
int biggest = nums[0];
for (int n : nums) {
    if (n > biggest) {
        biggest = n;
    }
}
System.out.println(biggest); // 23`,
cpp:`vector<int> nums = {4, 15, 8, 23};
int biggest = nums[0];
for (int n : nums) {
    if (n > biggest) {
        biggest = n;
    }
}
cout << biggest << endl; // 23`,
js:`const nums = [4, 15, 8, 23];
let biggest = nums[0];
for (const n of nums) {
  if (n > biggest) {
    biggest = n;
  }
}
console.log(biggest); // 23`}},
{id:"string",group:"Data",title:"strings: palindrome",
 use:"Reverse, compare, count vowels, check palindromes — string problems appear on almost every skills test.",
 warn:"In Java compare strings with .equals(), never ==.",
 code:{py:`word = "level"
if word == word[::-1]:
    print("palindrome")
else:
    print("not palindrome")`,
java:`String word = "level";
String rev = new StringBuilder(word).reverse().toString();
if (word.equals(rev)) {
    System.out.println("palindrome");
} else {
    System.out.println("not palindrome");
}`,
cpp:`string word = "level";
string rev(word.rbegin(), word.rend());
if (word == rev) {
    cout << "palindrome" << endl;
} else {
    cout << "not palindrome" << endl;
}`,
js:`const word = "level";
const rev = word.split("").reverse().join("");
if (word === rev) {
  console.log("palindrome");
} else {
  console.log("not palindrome");
}`}},
{id:"map",group:"Data",title:"hash map: count things",
 use:"Counting how many times something appears, or looking up a value by a key fast (O(1)).",
 warn:"Reading a key that doesn't exist yet: use get(ch, 0) / getOrDefault / || 0.",
 code:{py:`text = "banana"
count = {}
for ch in text:
    count[ch] = count.get(ch, 0) + 1
print(count)  # {'b': 1, 'a': 3, 'n': 2}`,
java:`String text = "banana";
Map<Character, Integer> count = new HashMap<>();
for (char ch : text.toCharArray()) {
    count.put(ch, count.getOrDefault(ch, 0) + 1);
}
System.out.println(count); // {a=3, b=1, n=2}`,
cpp:`string text = "banana";
map<char, int> count;
for (char ch : text) {
    count[ch]++;
}
for (auto& p : count) {
    cout << p.first << "=" << p.second << endl;
}`,
js:`const text = "banana";
const count = {};
for (const ch of text) {
  count[ch] = (count[ch] || 0) + 1;
}
console.log(count); // { b: 1, a: 3, n: 2 }`}},
{id:"stack",group:"Data",title:"stack & queue",
 use:"Stack (LIFO): undo, checking balanced brackets, reversing. Queue (FIFO): lines, scheduling, BFS.",
 warn:"Popping an empty stack or queue crashes — check that it's not empty first.",
 code:{py:`from collections import deque

stack = []
stack.append(1)
stack.append(2)
print(stack.pop())  # 2 (LIFO)

queue = deque()
queue.append(1)
queue.append(2)
print(queue.popleft())  # 1 (FIFO)`,
java:`Stack<Integer> stack = new Stack<>();
stack.push(1);
stack.push(2);
System.out.println(stack.pop()); // 2 (LIFO)

Queue<Integer> queue = new LinkedList<>();
queue.add(1);
queue.add(2);
System.out.println(queue.poll()); // 1 (FIFO)`,
cpp:`stack<int> st;
st.push(1);
st.push(2);
cout << st.top() << endl; // 2 (LIFO)
st.pop();

queue<int> q;
q.push(1);
q.push(2);
cout << q.front() << endl; // 1 (FIFO)
q.pop();`,
js:`const stack = [];
stack.push(1);
stack.push(2);
console.log(stack.pop()); // 2 (LIFO)

const queue = [];
queue.push(1);
queue.push(2);
console.log(queue.shift()); // 1 (FIFO)`}},
{id:"recur",group:"Algorithms",title:"recursion: factorial",
 use:"The problem contains a smaller copy of itself: factorial, Fibonacci, trees, folders inside folders.",
 warn:"No base case = stack overflow. Write the base case first.",
 code:{py:`def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))  # 120`,
java:`static int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

System.out.println(factorial(5)); // 120`,
cpp:`int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

cout << factorial(5) << endl; // 120`,
js:`function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

console.log(factorial(5)); // 120`}},
{id:"bsearch",group:"Algorithms",title:"binary search",
 use:"Finding a value in a SORTED array. O(log n): 1,000,000 items take about 20 checks. Unsorted? Use linear search, O(n).",
 warn:"Use low <= high, and move to mid + 1 / mid - 1, or it loops forever.",
 code:{py:`def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`,
java:`static int binarySearch(int[] arr, int target) {
    int low = 0, high = arr.length - 1;
    while (low <= high) {
        int mid = (low + high) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
cpp:`int binarySearch(vector<int>& arr, int target) {
    int low = 0, high = arr.size() - 1;
    while (low <= high) {
        int mid = (low + high) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
js:`function binarySearch(arr, target) {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`}},
{id:"bubble",group:"Algorithms",title:"bubble sort",
 use:"When the test says \"sort without using built-in sort\". Nested loops swap neighbors. O(n²) — fine for small arrays.",
 warn:"Inner loop goes to n - 1 - i, or arr[j + 1] goes out of bounds.",
 code:{py:`def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - 1 - i):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`,
java:`static void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`,
cpp:`void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}`,
js:`function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`}},
{id:"oop",group:"OOP & errors",title:"class & object",
 use:"Modeling a thing with data + behavior (Student, Account, Product). Expect questions on constructor, encapsulation, inheritance.",
 warn:"Inside methods use this. (Java/JS/C++) or self. (Python) to reach the object's fields.",
 code:{py:`class Student:
    def __init__(self, name, gpa):
        self.name = name
        self.gpa = gpa

    def is_honor(self):
        return self.gpa <= 1.75

s = Student("Ana", 1.5)
print(s.is_honor())  # True`,
java:`class Student {
    private String name;
    private double gpa;

    Student(String name, double gpa) {
        this.name = name;
        this.gpa = gpa;
    }

    boolean isHonor() {
        return gpa <= 1.75;
    }
}

Student s = new Student("Ana", 1.5);
System.out.println(s.isHonor()); // true`,
cpp:`class Student {
public:
    string name;
    double gpa;

    Student(string n, double g) : name(n), gpa(g) {}

    bool isHonor() {
        return gpa <= 1.75;
    }
};

Student s("Ana", 1.5);
cout << s.isHonor() << endl; // 1`,
js:`class Student {
  constructor(name, gpa) {
    this.name = name;
    this.gpa = gpa;
  }

  isHonor() {
    return this.gpa <= 1.75;
  }
}

const s = new Student("Ana", 1.5);
console.log(s.isHonor()); // true`}},
{id:"try",group:"OOP & errors",title:"try / catch",
 use:"Code that can fail at runtime: user input, dividing, files, array index, parsing JSON.",
 warn:"Catch the specific error, not everything, and never leave the catch block empty.",
 code:{py:`try:
    age = int(input("Age: "))
    print(100 / age)
except ValueError:
    print("Not a number")
except ZeroDivisionError:
    print("Age can't be 0")`,
java:`try {
    int[] a = {1, 2, 3};
    System.out.println(a[5]);
} catch (ArrayIndexOutOfBoundsException e) {
    System.out.println("Index out of range");
} finally {
    System.out.println("done");
}`,
cpp:`try {
    vector<int> a = {1, 2, 3};
    cout << a.at(5) << endl;
} catch (const out_of_range& e) {
    cout << "Index out of range" << endl;
}`,
js:`try {
  const data = JSON.parse("{bad json}");
  console.log(data);
} catch (err) {
  console.log("Invalid JSON:", err.message);
} finally {
  console.log("done");
}`}},
{id:"sql",group:"SQL",title:"SQL: JOIN & GROUP BY",
 use:"WHERE filters rows before grouping. HAVING filters groups after GROUP BY. JOIN connects tables through a foreign key.",
 warn:"Every non-aggregated column in SELECT must be in GROUP BY.",
 code:{sql:`SELECT s.name, c.title, e.grade
FROM students s
JOIN enrollments e ON e.student_id = s.id
JOIN courses c ON c.id = e.course_id
WHERE e.grade <= 1.75
ORDER BY e.grade;

SELECT course_id, COUNT(*) AS total
FROM enrollments
GROUP BY course_id
HAVING COUNT(*) > 30;`}}
];

// CRUD cards first (the skills test topic), then the rest with C# added.
const ALL=[...CRUD_CONCEPTS, ...BASE.map((c)=>(CS[c.id]?{...c,code:{...c.code,cs:CS[c.id]}}:c))];

// The learning path: easiest first, in the same order as the 27-day plan.
export const LEVELS = [
  { id: 'beginner', title: 'Beginner', desc: 'The building blocks every program uses. Start here.',
    ids: ['for', 'while', 'dowhile', 'if', 'func', 'array', 'string'] },
  { id: 'intermediate', title: 'Intermediate', desc: 'Objects, lists of records, and keeping bad input out. This is CRUD without a database yet.',
    ids: ['oop', 'crudlist', 'validate', 'try', 'map', 'stack', 'recur'] },
  { id: 'advanced', title: 'Advanced', desc: 'CRUD with a real database. This is the core of your skills test.',
    ids: ['sqlcrud', 'dbcrud', 'grid', 'sql', 'template'] },
  { id: 'extra', title: 'Extra: algorithms', desc: 'Searching and sorting. Less likely on a CRUD test, but common in interviews and other exams.',
    ids: ['bsearch', 'bubble'] },
];
// Every topic in path order, tagged with its level and step number.
export const CONCEPTS = (() => {
  const out = [];
  for (const l of LEVELS) for (const id of l.ids) { const c = ALL.find((x) => x.id === id); if (c) out.push({ ...c, level: l.id }); }
  for (const c of ALL) if (!out.some((x) => x.id === c.id)) out.push({ ...c, level: 'extra' }); // anything added later
  return out.map((c, i) => ({ ...c, step: i + 1 }));
})();

export const PLAN=[
 {w:"Week 1: Fundamentals in C#",days:[
  ["for loops","Read the card, type it twice in Copy mode, once in Memory mode.","for"],
  ["while & do-while","Build a console menu: 1) Add 2) View 0) Exit with do-while.","dowhile"],
  ["if / else / switch","Turn the menu choices into a switch. Then a grade calculator, no AI.","if"],
  ["functions","Make AddStudent(), ViewStudents() methods your menu calls.","func"],
  ["lists & arrays","List<T>: Add, loop with foreach, find max, count.","array"],
  ["strings","Trim, ToUpper, Contains, palindrome. Search a name in a list.","string"],
  ["Week 1 review","Memory mode on every Week 1 snippet. Then clear today's Review list.",null]]},
 {w:"Week 2: Objects and CRUD logic",days:[
  ["classes & objects","Student class with Id, Name, Course properties and a constructor.","oop"],
  ["CRUD on a list","Full Create, Read, Update, Delete on List<Student> in a console app.","crudlist"],
  ["input validation","Block empty names, letters in number fields, duplicate IDs.","validate"],
  ["try / catch","Wrap bad input and missing records so the app never crashes.","try"],
  ["Dictionary & search","Look up students by Id with Dictionary<int, Student>.","map"],
  ["Build day","Read the Setup sheet, then type the full form template in Copy mode twice.","template"],
  ["Week 2 review","Bug hunt: all 13 bugs. Write from scratch: LoadData and the Add button.",null]]},
 {w:"Week 3: Database CRUD",days:[
  ["SQL CRUD statements","Create a students table. Write INSERT, SELECT, UPDATE, DELETE by hand.","sqlcrud"],
  ["Connect + INSERT","SqlConnection + SqlCommand with parameters. Save one record.","dbcrud"],
  ["READ into a grid","Load all records into a DataGridView. Click a row to fill the textboxes.","grid"],
  ["UPDATE & DELETE","Update and delete the selected row by Id. Refresh the grid after.","dbcrud"],
  ["Search & JOIN","Search with WHERE name LIKE @q. One JOIN between two tables.","sql"],
  ["Polish","Clear button, confirm before delete, validation messages, no crashes.","validate"],
  ["Week 3 build","Build it: Student Records, timer on. Save your checklist score.",null]]},
 {w:"Week 4: Test mode",days:[
  ["Timed build 1","Build it: Library Books in 75 minutes. Fix every unticked check after.",null],
  ["Weak spots","Clear your whole Review list. Redo every Write task under 80%.",null],
  ["Timed build 2","Build it: Product Inventory or Payroll. No AI, no notes.",null],
  ["Mock test","Tutor gives a full mock skills test, then grades your answers.",null],
  ["Final rehearsal","Build it: Clinic Appointments, from the first 15 minutes on the Setup sheet.",null],
  ["Light review","Full form template in Memory mode once. Read Error → fix. Sleep early.","template"]]}
];

export const START = new Date(2026, 9, 14);
export const TEST = new Date(2026, 10, 10);

export const QUIZ=[
 {l:"Python",q:"What does this print?",code:`for i in range(2, 10, 3):
    print(i, end=" ")`,opts:["2 5 8","2 5 8 11","3 6 9","2 3 4 5 6 7 8 9"],a:0,why:"range(start, stop, step) starts at 2, adds 3 each time, and stops before 10."},
 {l:"Java",q:"What does this print?",code:`int a = 7 / 2;
double b = 7 / 2.0;
System.out.println(a + " " + b);`,opts:["3 3.5","3.5 3.5","3 3","4 3.5"],a:0,why:"int / int drops the decimal (integer division). One double makes the whole division a double."},
 {l:"JavaScript",q:"What does this print?",code:`console.log("5" + 3, "5" - 3);`,opts:["53 2","8 2","53 53","8 NaN"],a:0,why:"+ with a string joins text. - only works on numbers, so \"5\" is converted to 5."},
 {l:"C++",q:"What does this print?",code:`int i = 0;
while (i < 3) {
    cout << i;
    i++;
}`,opts:["012","0123","123","Infinite loop"],a:0,why:"It prints 0, 1, 2 and stops when i becomes 3."},
 {l:"Python",q:"What does this print?",code:`print([x * x for x in range(4)])`,opts:["[0, 1, 4, 9]","[1, 4, 9, 16]","[0, 1, 2, 3]","[0, 2, 4, 6]"],a:0,why:"range(4) is 0,1,2,3. Each is squared."},
 {l:"Java",q:"What does this print?",code:`String s = "BSCS";
System.out.println(s.charAt(1) + s.length());`,opts:["87","S4","B4","Compile error"],a:0,why:"charAt returns a char. char + int is math: 'S' is 83, plus length 4 = 87. Use \"\" + s.charAt(1) to join as text."},
 {l:"Python",q:"What does f(4) return?",code:`def f(n):
    if n == 0:
        return 0
    return n + f(n - 1)`,opts:["10","4","24","Error"],a:0,why:"4 + 3 + 2 + 1 + 0 = 10. The base case n == 0 stops the recursion."},
 {l:"JavaScript",q:"What does this print?",code:`let i = 0;
do {
  i++;
} while (i < 0);
console.log(i);`,opts:["1","0","Nothing","Infinite loop"],a:0,why:"A do-while runs its body once before checking the condition."},
 {l:"C++",q:"What does this print?",code:`int arr[] = {1, 2, 3, 4};
cout << sizeof(arr) / sizeof(arr[0]);`,opts:["4","16","1","10"],a:0,why:"Total bytes divided by the bytes of one element gives the number of elements."},
 {l:"Python",q:"What does this print?",code:`s = "hello"
print(s[1:4])`,opts:["ell","hel","ello","hell"],a:0,why:"Slicing includes the start index (1) and stops before the end index (4)."},
 {l:"Java",q:"What is count at the end?",code:`int count = 0;
for (int i = 0; i < 3; i++)
    for (int j = 0; j < 2; j++)
        count++;`,opts:["6","5","3","9"],a:0,why:"The inner loop runs 2 times for each of the 3 outer runs: 3 × 2 = 6."},
 {l:"JavaScript",q:"What does this print?",code:`console.log([1, 2, 3].map(n => n * 2).filter(n => n > 2));`,opts:["[4, 6]","[2, 4, 6]","[6]","[3]"],a:0,why:"map doubles to [2,4,6], then filter keeps values greater than 2."},
 {l:"Theory",q:"Time complexity of binary search on a sorted array?",code:`n = 1,000,000 items`,opts:["O(log n)","O(n)","O(1)","O(n²)"],a:0,why:"Each step halves the search space, so about log₂(n) ≈ 20 steps."},
 {l:"SQL",q:"Which clause filters groups after GROUP BY?",code:`SELECT dept, COUNT(*) FROM staff
GROUP BY dept
____ COUNT(*) > 5;`,opts:["HAVING","WHERE","ORDER BY","FILTER"],a:0,why:"WHERE filters rows before grouping; HAVING filters the groups."},
 {l:"Java",q:"What does this print?",code:`String a = new String("hi");
String b = new String("hi");
System.out.println((a == b) + " " + a.equals(b));`,opts:["false true","true true","true false","false false"],a:0,why:"== compares references (two different objects). equals compares the text."},
 {l:"Python",q:"What does this print?",code:`nums = [1, 2, 3]
nums.append([4, 5])
print(len(nums))`,opts:["4","5","3","Error"],a:0,why:"append adds ONE item — the whole list [4, 5]. Use extend to add each element."},
 ...CS_QUIZ
];

export const LANGS = { cs: 'C#', py: 'Python', java: 'Java', cpp: 'C++', js: 'JavaScript' };
export const LANG_SHORT = { cs: 'C#', py: 'Py', java: 'Java', cpp: 'C++', js: 'JS' };
export const byId = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]));
