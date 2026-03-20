# 🕷️ Web Crawler

A command-line web crawler built in **Node.js** that recursively traverses hyperlinks and collects data from web pages.

![Node.js](https://img.shields.io/badge/Node.js-18.7.0-green?style=flat&logo=node.js)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-yellow?style=flat&logo=javascript)
![Jest](https://img.shields.io/badge/tested%20with-jest-orange?style=flat&logo=jest)
![License](https://img.shields.io/badge/license-ISC-blue?style=flat)

## About

Built as a hands-on project for learning how HTTP and the web work under the hood. The crawler recursively follows links starting from a given URL, respects `robots.txt` rules, and handles concurrent page fetching using async patterns.

## Features

- 🔗 Recursive link traversal with configurable depth limit
- ⚡ Concurrent page fetching via `p-limit` for controlled parallelism
- 🔁 Visited URL tracking to prevent duplicate requests and infinite loops
- 🤖 `robots.txt` compliance via `robots-parser`
- 🧪 Test suite powered by Jest

## Project Structure

```
webcrawler/
├── src/           # Core crawler logic
├── tests/         # Jest test suites
├── main.js        # Entry point
├── package.json
└── .nvmrc         # Node version: 18.7.0
```

## Getting Started

### Prerequisites

- Node.js `18.7.0` (use [nvm](https://github.com/nvm-sh/nvm) for version management)

```bash
nvm use   # automatically picks up .nvmrc
```

### Install

```bash
git clone https://github.com/Lazzar19/webcrawler.git
cd webcrawler
npm install
```

### Run

```bash
npm start
```

or directly:

```bash
node main.js
```

### Tests

```bash
npm test
```

## Dependencies

| Package | Purpose |
|---|---|
| `jsdom` | HTML parsing and link extraction |
| `p-limit` | Concurrency limiter for async requests |
| `robots-parser` | Parses and respects `robots.txt` rules |
| `jest` | Testing framework (dev dependency) |

## Author

**Lazar Nikolic** — [GitHub](https://github.com/Lazzar19) · [LinkedIn](https://www.linkedin.com/in/lazar-nikolic-41aab6344/)
