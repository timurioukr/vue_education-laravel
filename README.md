# Laravel for Vue Developers: From Frontend to Fullstack in 4 Weeks

> **Language / Мова:** The course is currently available in Ukrainian only. English version is in progress.

## About This Course

A hands-on Laravel course for frontend developers who already work with Vue/Nuxt and want to learn how to build a backend on their own. Throughout the course we will step by step create a fully functional **Task Manager API**, and at the end connect a Vue SPA frontend to it.

Each lesson includes theory explained in "frontend developer language" -- with parallels to JavaScript, npm, Vue Router, and other familiar tools. Code is written in English, explanations are in Ukrainian.

## Who This Is For

- Vue 3 or Nuxt developers who want to become fullstack specialists
- Frontend developers tired of waiting for a backend developer
- Those who want to understand what happens "on the other side of the API"

## Prerequisites

- Node.js and npm (you already have these as a Vue developer)
- Experience with Vue 3 (Composition API, Pinia, Vue Router)
- Basic understanding of the terminal (cd, ls, mkdir -- that's enough)
- Understanding of HTTP requests (GET, POST, PUT, DELETE -- you do this every day via axios/fetch)

## What You Need to Install

| Tool     | Version | Purpose                                       |
| -------- | ------- | --------------------------------------------- |
| PHP      | 8.2+    | The language Laravel runs on                  |
| Composer | 2.x     | PHP package manager (equivalent of npm)       |
| SQLite   | 3.x     | Database (built-in, no server setup required) |

> **For macOS:** PHP and SQLite are already installed. Composer is installed with one command:
>
> ```bash
> php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" && php composer-setup.php --install-dir=/usr/local/bin --filename=composer
> ```

## Running the Interactive Platform

The course has an interactive web platform (Vue 3 SPA) with lessons, quizzes, and code examples.

**Requirements:** Node.js 18+, npm, PHP 8.2+ (Laravel Herd or installed manually)

```bash
# Navigate to the app folder
cd app

# Install dependencies
npm install

# Start the dev server
npm run dev
```

To run PHP code interactively in lessons, start a local PHP server in a second terminal:

```bash
php -S localhost:8088 app/server/executor.php
```

After starting, open the link from the terminal (usually `http://localhost:5173`).

### Other Commands

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run build`   | Build for production                 |
| `npm run preview` | Preview the production build locally |

## Course Structure

### Week 1: PHP and Laravel Basics

| Lesson | Topic                                         | What We Build                                          |
| ------ | --------------------------------------------- | ------------------------------------------------------ |
| 1      | PHP for JS developers: syntax, types, arrays  | First PHP scripts, comparison with JS                  |
| 2      | OOP in PHP: classes, interfaces, traits       | Modeling Task Manager entities                         |
| 3      | Installing Laravel, project structure         | New Laravel project, directory overview                |
| 4      | Routing and controllers                       | First API endpoints                                    |
| 5      | Blade templates and how Laravel renders pages | Simple HTML page (for understanding SSR)               |
| 6      | Request/Response lifecycle                    | Understanding middleware, how a request flows through Laravel |

### Week 2: Database and Eloquent ORM

| Lesson | Topic                             | What We Build                                  |
| ------ | --------------------------------- | ---------------------------------------------- |
| 7      | Migrations: database versioning   | tasks, categories, users tables                |
| 8      | Eloquent models: CRUD operations  | Creating, reading, updating, deleting tasks    |
| 9      | Relationships                     | Tasks belong to users and categories           |
| 10     | Seeding and factories             | Populating the database with test data         |
| 11     | Query Builder and complex queries | Filtering, sorting, searching tasks            |
| 12     | Pagination and API Resources      | JSON responses for the frontend                |

### Week 3: Authentication, Validation and Security

| Lesson | Topic                                   | What We Build                          |
| ------ | --------------------------------------- | -------------------------------------- |
| 13     | Form Requests and validation            | Validation for creating/updating tasks |
| 14     | Laravel Sanctum: API authentication     | Registration, login, tokens            |
| 15     | Middleware and authorization (Policies) | Route protection, access rights check  |
| 16     | Error handling and API responses        | Unified JSON errors for the frontend   |
| 17     | File Storage and file uploads           | Attaching files to tasks               |
| 18     | CORS, rate limiting, API security       | Setting up access for Vue SPA          |

### Week 4: Advanced Topics and Vue Integration

| Lesson | Topic                                | What We Build                     |
| ------ | ------------------------------------ | --------------------------------- |
| 19     | Events, Listeners, Notifications     | Email notifications for deadlines |
| 20     | Queues and background jobs           | Deferred message sending          |
| 21     | API Testing (Feature and Unit tests) | Tests for all endpoints           |
| 22     | API Documentation (Scribe/Swagger)   | Auto-generated API docs           |
| 23     | Deploying a Laravel application      | Publishing to a server            |
| 24     | Connecting Vue SPA to Laravel API    | Full fullstack Task Manager       |

## How to Use

1. Go through lessons **in order** -- each one builds on the previous
2. Write all code yourself, don't copy -- it's better for memorization
3. Use the cheatsheets in the `cheatsheets/` folder as a reference
4. After each week there is a practical assignment to reinforce the material

## Project: Task Manager API

Throughout the course we will build a REST API for a task manager with the following features:

- User registration and authentication (tokens)
- CRUD for tasks (create, read, update, delete)
- Categories and tags for tasks
- Filtering, sorting, search
- Result pagination
- File attachment uploads
- Email notifications for deadlines
- Full test coverage

At the end, we will connect a Vue 3 SPA as the frontend.

## Capstone Project: DevBlog (Fullstack Inertia.js)

After finishing the course, the final hands-on assignment is to build a complete fullstack app **from scratch** in a **new domain** — a content platform (blog) — so you have to *recall and apply* the material instead of copying the Task Manager.

Unlike the course (decoupled Vue SPA + Sanctum API), the capstone uses a **monolithic Inertia.js architecture** (Laravel + Vue in one app, session auth, server-driven forms). Being able to explain the trade-offs between the two approaches is a strong point in a junior interview.

The capstone is a staged assignment (M0 → M13) covering the full junior Laravel basis — migrations, Eloquent relationships, validation, policies/RBAC, transactions & service layer, events/queues, testing (Pest), and the Inertia + Vue frontend. Each stage has subtasks, a Definition of Done, interview questions, and links back to the relevant lessons.

> The capstone docs are in Ukrainian (same as the lessons).

| File                                       | Description                                          |
| ------------------------------------------ | ---------------------------------------------------- |
| [capstone/README.md](capstone/README.md)   | Full assignment: domain model, route map, stages M0–M13, interview checklist |
| [capstone/CHECKLIST.md](capstone/CHECKLIST.md) | Progress tracker for each stage                  |

## Cheatsheets

| File                                                                     | Description                          |
| ------------------------------------------------------------------------ | ------------------------------------ |
| [cheatsheets/php-vs-js.md](cheatsheets/php-vs-js.md)                    | PHP vs JavaScript: syntax comparison |
| [cheatsheets/artisan-commands.md](cheatsheets/artisan-commands.md)       | Main Artisan commands                |
| [cheatsheets/eloquent-cheatsheet.md](cheatsheets/eloquent-cheatsheet.md) | Eloquent ORM: quick reference        |
