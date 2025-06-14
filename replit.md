# TrainUp - Athlete Performance Management Platform

## Overview

TrainUp is a comprehensive web-based sports performance management platform designed for coaches and athletes. The application provides real-time monitoring of athlete wellness, training load analysis, and performance insights to optimize training programs and reduce injury risk.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development
- **Styling**: Tailwind CSS with custom component library using shadcn/ui
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Recharts for data visualization
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple
- **API Design**: RESTful endpoints with TypeScript interfaces

### Database Schema
- **Users**: Athletes and coaches with role-based access
- **Teams**: Team management with PIN-based joining
- **Training Entries**: Individual training sessions with RPE and load calculations
- **Morning Diaries**: Daily wellness assessments including sleep, recovery, and symptoms
- **Health Reports**: Comprehensive health tracking and alerts
- **Fitness Metrics**: Performance tracking over time

## Key Components

### Authentication System
- Role-based authentication (athlete/coach)
- Team-based organization with PIN codes
- Session management with secure password hashing
- Password reset functionality

### Athlete Interface
- Morning self-control diary with wellness metrics
- Training entry logging with RPE and emotional load
- Personal fitness progress tracking
- Smart health recommendations

### Coach Interface
- Team dashboard with key performance metrics
- Advanced load insights with ACWR (Acute:Chronic Workload Ratio) analysis
- Athlete status monitoring and alerts
- Training session management and recommendations
- Data export capabilities (CSV format)

### Analytics Engine
- Training load calculations using configurable coefficients
- ACWR monitoring for injury risk assessment
- Wellness trend analysis
- Automated health recommendations

## Data Flow

1. **Athletes** submit daily wellness data through morning diaries
2. **Training sessions** are logged with RPE, duration, and emotional load
3. **Load calculations** are performed using type-specific coefficients
4. **Analytics engine** processes data to generate insights and alerts
5. **Coaches** access processed data through dashboard and reports
6. **Recommendations** are generated based on rule-based algorithms

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL (configured via DATABASE_URL)
- **Session Storage**: Redis-compatible session store
- **Email Service**: SendGrid for notifications (optional)

### Development Tools
- **Build Tool**: Vite with TypeScript support
- **ORM**: Drizzle with automatic migrations
- **Testing**: Built-in development error handling
- **Deployment**: Replit-optimized configuration

## Deployment Strategy

### Production Build
- Frontend built to `dist/public` directory
- Backend bundled with esbuild for Node.js deployment
- Database migrations handled via Drizzle push commands
- Environment variables for database and session secrets

### Development Environment
- Hot module replacement via Vite
- PostgreSQL module pre-configured in Replit
- Automatic database provisioning
- Real-time error overlay for debugging

### Scaling Considerations
- Autoscale deployment target configured
- Session store can be moved to Redis for horizontal scaling
- Database queries optimized with proper indexing
- API responses cached where appropriate

## Changelog

- June 14, 2025. Updated injury pain scale in Morning Self-Control Diary from 1-10 to 1-5 scale for simplified assessment
- June 14, 2025. Implemented week-based Training Log with auto-expansion for current/previous weeks and collapsible older weeks with Monday-Sunday grouping
- June 14, 2025. Enhanced 7-Day Team Wellness Trends chart: removed 0% Y-axis label, increased subtitle spacing (mb-4), ultra-narrow left margin (2px)
- June 14, 2025. Removed "Export Data to Sheets" button from Athlete Status Overview on main coach screen
- June 14, 2025. Updated "Awaiting Data" font styling in coach interface key metrics to match alerts button
- June 13, 2025. Enhanced Smart Doctor with comprehensive symptom analysis and fever detection
- June 13, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.