# odata-client

An OData client for Node.js
> **NOTE:** Only the JSON format of OData is supported by this library.

## Features

-   DSL for creating complex OData queries.
-   Nested comparison expressions.
-   Nested logical expressions.
-   Nested `$select/$expand`
-   `any/all` filters.
-   `$orderby`.
-   `$top` and `$skip`.
-   First class pagination via asynchronous generators.
-   Generates client methods dynamically based on the service root.
-   Lazy method generation. It doesn't create methods you don't use.

## Environment

You need to have this features in your JavaScript environment to use this.

-   `Proxy`
-   `Symbol.asyncIterator` (for pagination)
-   `async/await`

## Installation

Using NPM.

```shell
npm install --save odata-client
```

> **NOTE**: You will need an SSH key or a GitHub personal token (if using https) in your system to download using NPM. See [this link](https://docs.github.com/en/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account) to learn how to setup an SSH key for your account.

## Usage

### Quick start

Import the package.

```js
// require
// const {createODataClient} = require('odata-client');
// ES6 imports
// import {createODataClient} from 'odata-client';
const client = await createODataClient({
    baseURL: 'https://my-odata-service-root.com',
    // Other axios options you want to add.
});
```

Let's say your service root returned something like.

```json
[
    {
        "name": "Students",
        "kind": "EntitySet",
        "url": "Students"
    },
    {
        "name": "ClassSections",
        "kind": "EntitySet",
        "url": "ClassSections"
    }
]
```

The `name` of each entity set will be a method on our client using the camelcase format.

```js
const students = await client.students().top(5).fetch(); // will send /Students?$top=5.
const classSections = await client.classSections().top(5).fetch(); // will send /ClassSections?$top=5.

// Retrieve a specific student.
const students = await client.students(1234).fetch(); // will send /Students(1234)
// or
const students = await client.students({acme: 'acme1234'}).fetch(); // will send /Students(acme=1234)
```

### Filtering

Basic filtering.

```js
const {Op} = require('odata-client');
const students = await client
    .students()
    .filter('Age', Op.GT, 25)
    .fetch(); // /Students?$filter=Age gt 25
```

Using logical operators.

```js
const {Op, fn, field} = require('odata-client');
const students = await client
    .students()
    .filter('Age', Op.GT, 25)
    // You can use functions too.
    .and(fn('startswith', field('Name'), 'Pa'))
    .fetch(); // /Students?$filter=Age gt 25 and startswith(Name, 'Pa')

const inactiveClassSections = await client
  .students()
  .filter(Op.NOT, 'IsActive')
  .fetch(); // /Students?$filter=not IsActive
```

### Pagination

Using `$top` and `$skip`.

```js
// Get the first five students.
const students = await client
  .students()
  .top(5)
  .fetch();
```

Getting all pages for a resource.

```js
for await (const page of client.students()) {
  console.log(page); //
}
```

This will get all pages of the student resource. The default page size is 500.
You can change using the `.top()` method.

```js
// Get all student pages in pages of size 1000
for await (const page of client.students().top(1000)) {
  console.log(page.length) // 1000
}
```

Using a Readable stream.

```js
const stream = Readable.from(client.students());

stream.on('data', (page) => {
  console.log(page.length); // 500
});
```

## TODO
-   [ ] `POST` and `PUT` support.
-   [ ] Batch requests.
-   [ ] Strict validation of function overloads
-   [ ] Reflection and validation with the service `$metadata`.
