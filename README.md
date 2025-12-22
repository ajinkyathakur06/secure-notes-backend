# 🔐 Secure Notes Backend

A backend service for a **Secure Notes & File Sharing application** built using **NestJS**, **Prisma ORM**, and **JWT authentication**, supporting **CRUD operations**, **file upload with text extraction**, **note sharing**, and **real-time updates via WebSockets**.

---

## 🚀 Features

- User authentication (JWT)
- Notes CRUD operations
- File upload & text extraction (PDF / TXT)
- Download notes as `.txt`
- Share notes with other users (read-only)
- Real-time updates using WebSockets (Socket.IO)
- Audit logging
- Prisma ORM with migrations
- Modular NestJS architecture

---

## 🧱 Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL (Production), SQLite (Local)
- **ORM:** Prisma
- **Authentication:** JWT
- **File Upload:** Multer
- **Real-time:** Socket.IO
- **DevOps:** Docker, Jenkins, SonarQube, Nexus, Kubernetes

---

## 📂 Project Structure

```text
src/
 ├── auth/
 ├── users/
 ├── notes/
 ├── files/
 ├── shares/
 ├── audit/
 ├── websocket/
 ├── prisma/
 └── main.ts
