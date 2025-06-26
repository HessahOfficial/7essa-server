# 7essa Server 🏢💰 

This is the backend repository for **7essa**, a sophisticated real estate investment platform. Built with **Node.js, Express, MongoDB**, and following RESTful API design principles, this server provides robust functionality for property investments, user management, and payment processing.

## 🚀 Key Features

- 🔐 **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin, User, Partner)
  - Google OAuth integration
  - Email verification system

- 🏘️ **Property Management**
  - Property listing and details
  - Investment shares tracking
  - Property status monitoring (Available, Funded, Exited)
  - Rental property management

- 💰 **Investment System**
  - Investment creation and tracking
  - Returns calculation and distribution
  - Share price management
  - Investment status monitoring

- 💳 **Payment Processing**
  - Multiple payment methods (InstaPay, VodafoneCash, Bank Transfer)
  - Payment status tracking
  - Automated balance updates
  - Transaction history

- 👥 **User Management**
  - Profile management
  - Role-based permissions
  - Activity monitoring
  - Admin control panel

## 🛠️ Tech Stack

- Node.js & Express.js
- MongoDB & Mongoose
- JWT Authentication
- Passport.js
- Nodemailer
- Firebase Admin
- Cloudinary
- Express Session
- Moment.js
- Validator

## 🚀 Getting Started

1. Clone the repository:
```bash
git clone https://github.com/HessahOfficial/7essa-server.git
cd 7essa-server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your environment variables. You can use `.env.example` as a reference.

5. Start the development server:
```bash
npm start
```

## 📁 Project Structure

```
├── Config/         # Configuration files (DB, Firebase, etc.)
├── Controllers/    # Request handlers
├── Middlewares/    # Custom middleware functions
├── Models/         # Database models
├── Routes/         # API routes
├── utils/          # Utility functions
└── views/          # Email templates (Pug)
```

## 🔒 API Security

- JWT-based authentication
- Role-based access control
- Request validation
- Error handling middleware
- CORS configuration
- Rate limiting

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b Feature/awesome-feature`
3. Commit your changes: `git commit -m 'Add awesome feature'`
4. Push to the branch: `git push origin Feature/awesome-feature`
5. Open a Pull Request

### Important Notes :
**To ensure a streamlined development process, adhere to the following guidelines:**

- **1. Folder Structure Guidelines:**
> Ensure a well-organized folder structure for server-side development, distinctly arranging directories for controllers, routes, middlewares, models, and utilities
- **2. [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/) Guidelines:**
> Follow a disciplined branching strategy (Example) such as using master/main for production, development for ongoing work, and feature branches for new functionalities or fixes.
- **3. JSON Response ([JSend Rules](https://github.com/omniti-labs/jsend)) Guidelines:**
>Implement a uniform response structure (Example) adhering to JSend specifications for successful and error responses, coupled with appropriate HTTP status codes.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
