# AcroNexus

AcroNexus is an advanced, AI-powered university academic management and scheduling platform designed to streamline department administration, timetable orchestration, faculty coordination, student attendance, and academic resource dissemination. Built with a modular, full-stack microservices architecture, AcroNexus bridges administrative rigor with high-precision artificial intelligence to automate complex academic workflows.

---

## Features

- **Authentication & Role-Based Access**: Multi-tier secure access control tailored for Heads of Department (HODs), Faculty members, Coordinators, and Students.
- **Faculty Management**: Comprehensive directory and administrative controls for faculty onboarding, specialization mapping, and workload tracking.
- **Student Management**: End-to-end student cohort tracking across academic years, semesters, and sections.
- **Coordinator Management**: Dedicated interfaces and workflows for academic batch and class coordinators.
- **Timetable Management**: Creation, viewing, and conflict-aware structural alignment of department timetables.
- **AI Match**: High-precision timetable ingestion engine powered by advanced LLM parsing and spatial line reconstruction to map subject codes, titles, and faculty allocations.
- **OCR Support**: Robust computer vision processing (PaddleOCR & OpenCV) enabling accurate ingestion of both digital PDFs and scanned/image timetables (JPG, JPEG, PNG).
- **Review & Assignment Workflow**: Interactive interactive confirmation UI allowing administrators to verify, edit, and assign AI-extracted timetable slots directly into the system database.
- **Classes Module**: Organized management of lecture sessions, tutorial slots, and practical lab groups.
- **Subject Cards**: Interactive academic course cards giving students and faculty immediate access to subject details, syllabi, and resources.
- **Academic Resources**: Secure upload and categorization of lecture notes, lab assignments, and study materials with multi-format support.
- **Attendance**: Real-time lecture and laboratory attendance recording and tracking interface.
- **Dashboard**: Centralized analytics and quick-action hub providing visibility into active semester operations.
- **Notifications**: System-wide announcements and targeted academic alerts.

---

## Upcoming Features

The project is currently under active development. The following modules and enhancements are planned for future releases:

- **Advanced Conflict Resolution & Auto-Scheduling**: Automated slot rearrangement to resolve overlapping faculty or room allocations.
- **Predictive Attendance Analytics**: Machine learning insights to identify students at risk of attendance shortages.
- **Examination & Grading Suite**: Comprehensive mark distribution, grade calculation, and transit sheet generation.
- **Interactive Syllabus Tracker**: Unit-by-unit real-time lesson plan tracking for theory and laboratory courses.
- **Mobile Application Integration**: Native iOS and Android interfaces tailored for real-time campus updates.

---

## Tech Stack

### Frontend
- **React**: Modern component-based UI engineering.
- **TypeScript**: End-to-end type-safe client development.
- **Tailwind CSS**: Responsive, utility-first design system.
- **Vite**: Ultra-fast module bundler and dev environment.

### Backend
- **Java 17+**: Robust enterprise backend processing.
- **Spring Boot**: RESTful web architecture and inversion of control.
- **Spring Security**: Enterprise-grade token verification and access control.
- **Hibernate / JPA**: Object-relational persistence layer.

### Database
- **PostgreSQL**: Advanced open-source relational SQL database.

### AI Services
- **Python 3.10+**: Core asynchronous AI computing server.
- **FastAPI**: High-performance AI service REST endpoints.
- **PaddleOCR**: Neural network optical character recognition for document scans.
- **OpenCV**: Image pre-processing, deskewing, and spatial coordinate clustering.

---

## Project Structure

```
AcroNexus/
├── backend/                   # Spring Boot Core Application Server
│   ├── src/main/java/        # Controllers, Services, Repositories, Entities & DTOs
│   ├── src/main/resources/   # Application properties & migration configs
│   └── pom.xml               # Maven dependency configurations
│
├── frontend/                  # React + TypeScript Single-Page Application (SPA)
│   ├── src/components/       # Reusable UI component library
│   ├── src/pages/            # Application feature modules & workflows
│   ├── src/services/         # Client API communication layers
│   └── vite.config.ts        # Bundler setting definitions
│
├── ai-services/              # Python FastAPI Microservice for AI Ingestion & OCR
│   ├── app/routers/          # Timetable OCR and AI parsing endpoints
│   ├── app/config/           # AI service configuration settings
│   └── requirements.txt      # Python environment dependency manifest
│
└── db-migration/             # SQL initialization scripts and data seeders
    ├── 01_init_schema.sql    # Primary PostgreSQL relational schema definition
    └── 02_add_profile.sql    # Supplemental table field updates
```

---

## Installation

### Prerequisites
- Node.js (v18 or above) & npm / pnpm
- Java JDK 17 or above & Maven
- Python (3.10 to 3.12 recommended)
- PostgreSQL (v14 or above)

### 1. Database Setup
1. Create a clean PostgreSQL database named `acronexus`:
   ```sql
   CREATE DATABASE acronexus;
   ```
2. Execute the initial SQL migration scripts inside `db-migration/` to provision tables and default schema structures.

### 2. Backend Installation
1. Navigate to the backend service directory:
   ```bash
   cd backend
   ```
2. Build project and download Maven dependencies:
   ```bash
   mvn clean install -DskipTests
   ```

### 3. AI Services Installation
1. Navigate to the AI microservice folder:
   ```bash
   cd ai-services
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS / Linux:
   source venv/bin/activate
   ```
3. Install required core Python libraries:
   ```bash
   pip install -r requirements.txt
   ```

### 4. Frontend Installation
1. Navigate to the UI dashboard directory:
   ```bash
   cd frontend
   ```
2. Install Javascript dependencies:
   ```bash
   npm install
   ```

---

## Running the Project

To execute AcroNexus locally, start all three independent core application servers simultaneously:

### Start PostgreSQL & Backend Server
```bash
cd backend
mvn spring-boot:run
```
> Server runs on default HTTP port: `8080`.

### Start AI Fast Ingestion Server
```bash
cd ai-services
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
> AI microservice operates on HTTP port: `8000`.

### Start Frontend Client UI
```bash
cd frontend
npm run dev
```
> Frontend Vite client becomes accessible at `http://localhost:5173/` (or designated console port).

---

## Environment Variables

For security and local configuration independence, never hardcode credentials into versioned files. Use environment variables or local override files (`.env`, `application-local.properties`) excluded by `.gitignore`.

### Backend Configuration Table (`application.properties` / Env overrides)

| Variable Name / Property | Description | Example Placeholder |
| :--- | :--- | :--- |
| `DB_PASSWORD` / `spring.datasource.password` | PostgreSQL Database Access Password | `your_postgres_password_here` |
| `JWT_SECRET` / `acronexus.app.jwtSecret` | 256-bit Base64 Secret for Signing Tokens | `your_256_bit_random_secret_key_string_here` |
| `AI_SERVICE_URL` / `ai.service.base-url` | Base Routing HTTP address for AI engine | `http://localhost:8000` |

### AI Service Configuration Table (`ai-services/.env`)

| Variable Name | Description | Example Placeholder |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | API Key for LLM Parsing Inference | `gsk_your_api_key_string_here` |
| `GROQ_MODEL` | Default Target Inference Model | `llama-3.3-70b-versatile` |
| `TIMEOUT_MS` | AI Request Timeout Target in Milliseconds | `300000` |

---

## Screenshots

*Application dashboard, AI Match interactive parsing popup, and responsive academic management interfaces.*

> *(Screenshots section reserved for demonstration media during upcoming release deployments).*

---

## Contributors

- **Yogita** – Core Software Architecture & Full-Stack Development
- **AcroNexus Academic Team** – Domain Engineering & Workflow Verification

---

## License

This project is open-source software licensed under the **MIT License**.
