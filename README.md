# 📚 EduPlanner – Training Center Management System

## 📋 Description

**EduPlanner** is a complete smart web-based management platform for training centers. It combines a robust Spring Boot backend with a modern frontend to deliver a full solution for automatic session scheduling, resource management (trainers, students, rooms, equipment), and intelligent conflict detection and resolution.

---

## ✨ Key Features

### 🔐 Multi-Role Management with JWT Authentication
- **Administrator**: Full system management with planning validation and publication
- **Trainer**: Availability management, session visualization and validation
- **Student**: Schedule consultation, group registration, unavailability declaration

### 📊 Smart Dashboard
- Automatically calculated real-time statistics
- Role-based activity overview
- Custom performance indicators
- Automatic statistics generation

### 👥 Human Resource Management

#### Trainers
- Profiles with specialties and unique registration numbers
- Weekly availability management (day, start/end time)
- Assigned session tracking and personal statistics
- Course validation

#### Students
- Organization into groups with maximum capacity
- Dynamic enrollment with capacity checks
- Training history and progress tracking
- Emergency unavailability declaration

---

### 🏫 Infrastructure Management

#### Rooms
- Multiple types (classroom, amphitheater, laboratory, computer room, meeting room)
- Capacity and building location
- Real-time availability
- Optimized allocation

#### Equipment
- Inventory by type (Computer, Projector, Tablet, etc.)
- Status tracking (New, Good, Needs Repair, Out of Service)
- Quantity and capacity management
- Session assignment validation

---

## 📅 Intelligent Scheduling

### Automatic Scheduling
- Optimization algorithm with backtracking
- Automatic time slot generation
- Weighted constraints:
  - Preferences: 40%
  - Availability: 30%
  - Capacity: 20%
  - Balance: 10%
- Local optimization by slot swapping

### Manual Scheduling
- Daily / weekly / monthly views
- Drag & drop adjustments
- Slot creation and modification

### Schedule States
- `IN_PROGRESS`
- `VALIDATED`
- `PUBLISHED`

---

## ⚠️ Advanced Conflict Management

### Automatic Detection
- Trainer availability conflicts
- Room occupancy conflicts
- Equipment capacity conflicts
- Group session overlap
- Date and week constraints
- Severity levels (1–5)

### Intelligent Resolution
- Prioritized solutions
- One-click global resolution
- Individual solution application

Solution types include:
- Slot date/time correction
- Trainer availability creation
- Trainer / room / group change
- Move to a fully available slot

---

## 🔄 Automatic Status Updates
- Scheduler runs every 5 minutes
- Session states:
  - `PLANNED`
  - `UPCOMING`
  - `IN_PROGRESS`
  - `COMPLETED`
- Update on application startup

---

## 🛠️ Architecture & Technologies

### Backend – Spring Boot


```
📦 MVC Architecture
├── Controllers
├── Services
├── Repositories
├── Entities
├── DTOs
└── Configuration (Security & CORS)
```

**Tech Stack**
- Spring Boot 3.x
- Spring Data JPA
- Spring Security
- JWT Authentication
- Hibernate
- H2 / MySQL / PostgreSQL
- Lombok
- Jackson
- BCrypt

---

### Frontend – Modular Architecture

```
📦 ES6 Modules
├── HTML5 / CSS3
├── Vanilla JavaScript (ES6+)
├── Font Awesome
└── Google Fonts
```


- Role-based modules (Admin / Trainer / Student)
- Centralized API configuration
- Local state management

---

## 📦 Installation & Configuration

### Prerequisites

**Backend**
- Java 17+
- Maven 3.6+ or Gradle 7+
- MySQL / PostgreSQL (optional)

**Frontend**
- Modern web browser
- Optional local HTTP server

---

### Clone the Repository

```bash
git clone https://github.com/ZeinebGhrab/EduPlanner.git
cd EduPlanner
```

### Backend Configuration

```bash
back-end/src/main/resources/application.properties
```

```
server.port=8080

spring.datasource.url=jdbc:h2:mem:eduplannerdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

jwt.secret=MySecretKeyForJWTTokenGenerationInSpringBootApplicationCentreFormation2025
jwt.expiration=864000000

```

### Run the Backend

```bash
cd back-end
./mvnw spring-boot:run
```


---

## 🚀 Usage Guide

**Initial Setup** 

- Create admin account

- Configure rooms, equipment, and groups

- Validate trainers

- Define standard time slots

**Planning Workflow** 

1. Manual or automatic scheduling

2. Conflict detection

3. Conflict resolution

4. Validation

5. Publication

---

## 🎯 Scheduling Algorithm

**Steps**

1. Priority sorting (group size, equipment rarity)

2. Greedy allocation

3. Backtracking for complex sessions

4. Local optimization

**Scoring Formula**

```bash
Score = 0.4 × Preferences
      + 0.3 × Availability
      + 0.2 × Capacity
      + 0.1 × Balance
```

---

## 🏁 Conclusion

EduPlanner is a powerful, scalable, and intelligent training center management system designed to automate scheduling, optimize resources, and drastically reduce administrative workload.