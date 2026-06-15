# Database ERD Designer & SQL Generator

An interactive tool built directly inside the browser for visual database design. Quickly prototype Entity-Relationship Diagrams (ERDs) and compile database schemas into clean, production-ready SQL scripts.

## 🚀 Features
- **Visual Entity Designer**: Add, edit, or remove tables and columns with custom data types.
- **Relational Connections**: Establish primary-to-foreign key relationships dynamically linked on the canvas workspace.
- **Dynamic Bezier Curves**: Interactive SVG curves connect fields and automatically adjust when elements are dragged.
- **SQL dialect Compiler**: Generates standard syntax instantly for PostgreSQL, MySQL, and SQLite.
- **Local State Persistency**: Keeps your designs saved across browser reloads using robust JSON LocalStorage mapping.
- **One-Click Export**: Download compiled scripts directly as a `.sql` file.

## 🛠️ Implementation Details
- Built using native vanilla JavaScript DOM manipulation and custom SVG drawing elements.
- Clean styling with modern css transitions, infinite dot-matrix grid layout, and responsive side panels.
- Dark mode theme support integrated with the dashboard's unified global variables.
