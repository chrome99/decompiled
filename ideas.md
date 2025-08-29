# Advanced Javascript
## Starting the article
Syntactic sugar is a wonderful thing - it simplifies complexity, which is when of the hallmarks of great design.
Day-to-day coding is hard enough and should be made simple and accesible as much as possible.
BuHowever, the strength of syntactic sugar is also it's weakness - it inherently obscures the inner working of things. 
  I've heard of people that work in these big companies, they have inner CI/CD layers and inner libraries.
  They push code and don't know what happens to it - the work they do is entirely segmented and they lack an understanding of end-to-end application behavior.
  A similar thing is already happening with programmers. The daily task at work is to push features and fix bugs. It isn't to understand.
  There may be a planning phase accompaning a workflow, but it rarely amounts to studying.
  In every company I worked with, there's very little time allowed for individual studying - instead employers often downplay complexity to avoid the time costs of learning.
- [ ] Method to learn advanced Javascript
  About syntactic sugar: it's great for day-to-day programming, but obscures how things work.
- [ ] Write about `Subjects - Basics`
  - [ ] Start with async / promises
  - [ ] Write the corresponding exercise - helps to clarify
- [ ] Shoul be a multi-part series (3-5)

## Writing Guidelines
- Maximize on clarity
- Maximize on deeply understanding
  - First yourself
  - Then pass this exprience to the reader
- When the reader finishes the article, he should be set for an interview on the specific subject!
  - Maybe add a difficult quiz at the end

## Javascript Exercises
> [!NOTE]
> All of these must be implemented without syntactic sugar.
- Async & Promises
- Iterator function (without for of)
- Generator (without *, using closures)
- Class function (without class)
- Manual bind!
- event emitter

## Subjects
### Basics
- Call / Apply / Bind
- Promises and async
- Type coercion: double vs triple equals vs quaruple equals
- Scope: function vs. block scope, var vs. let vs. const
- this keyword: how it works in different contexts (arrow functions, regular functions, classes, event handlers)
- Deep vs. Shallow Copy
- Prototype & Inheritance
- ES6+ features (destructuring, spread, rest, optional chaining, nullish coalescing)

### How Javascript Works
- call stack, event loop, microtasks vs. macrotasks
- Event loop and concurrency model


### Advanced subjects
- Currying / Higher-Order Functions
- Composition
- Memoization
- Generators 
- Event Propagation (bubbling/capturing)
- Memory leaks → very important for frontend & Node.js, often asked
- Event delegation → simple but asked a lot in frontend interviews
- Code splitting → modern apps, Webpack/Vite — worth knowing basics
- Lazy loading → related to perf, often part of optimizing large apps
- Patterns: Module pattern, Observer / Pub-Sub pattern, Factory pattern, Singleton pattern
