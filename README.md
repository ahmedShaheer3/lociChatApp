Here's a user-friendly README file for your chat application built with Node.js, MongoDB, and Socket.io. This README is designed to help users and developers understand your project, set it up, and use it effectively.

Chat App
Welcome to the Chat App! This application is a real-time chat platform built using Node.js, MongoDB, and Socket.io. It supports features like typing indicators, user active/inactive status, last message tracking for each conversation, and group chats.

Features
Real-Time Messaging: Instant communication with Socket.io.
Typing Indicator: See when others are typing a message.
User Status: Check if users are active or inactive.
Last Message Tracking: Displays the last message for each conversation.
Group Chat: Create and manage group conversations.
Getting Started
Follow these instructions to set up and run the project on your local machine.

Prerequisites
Make sure you have the following installed:

Node.js: Download and install Node.js
MongoDB: Download and install MongoDB
npm: Comes with Node.js, but you can update it with npm install -g npm
TypeScript: Install globally with npm install -g typescript
Installation
Clone the repository:

bash
Copy code
git clone https://github.com/your-username/chat-app.git
cd chat-app
Install dependencies:

bash
Copy code
npm install
Set up environment variables:

Create a .env file in the root directory with the following variables:

plaintext
Copy code
MONGODB_URI=<your-mongodb-connection-string>
PORT=3000
Replace <your-mongodb-connection-string> with your actual MongoDB connection string.

Running the Application
You can run the application in different environments using the provided npm scripts:

Development:

bash
Copy code
npm run dev
This command uses nodemon to automatically restart the server when changes are detected.

Production:

bash
Copy code
npm run prod
This command starts the server using ts-node.

Linting and Formatting
To maintain code quality and consistency, the following scripts are available:

Linting:

bash
Copy code
npm run lint
This will run ESLint to check your code for issues.

Fix Linting Issues:

bash
Copy code
npm run lint-fix
This command attempts to automatically fix linting errors.

Code Formatting:

bash
Copy code
npm run format
This will format your code using Prettier.

Testing
Currently, no tests are defined. You can add your tests in the test directory and update the test script in package.json to run them.

Contributing
Contributions are welcome! Please fork the repository and create a pull request with your changes. Make sure to run linting and formatting checks before submitting your PR.

License
This project is licensed under the MIT License. See the LICENSE file for more details.

Contact
If you have any questions or suggestions, feel free to open an issue or reach out via email@example.com.
