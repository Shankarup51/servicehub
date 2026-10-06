# ServiceHub

ServiceHub is a full-stack **Smart Service Marketplace & Booking Platform** that connects customers with verified service providers.

The platform enables customers to discover services, check provider availability, book services, make payments, manage bookings, and provide reviews. Service providers can manage their profiles, services, availability, and bookings, while administrators and support users manage platform operations.

---

## Project Overview

ServiceHub is designed as a production-oriented service marketplace with a focus on:

- Secure authentication and authorization
- Verified service providers
- Provider-owned services
- Service availability management
- Booking lifecycle management
- Online and cash payments
- Booking cancellation and rescheduling
- Provider reassignment
- Reviews and provider responses
- Coupon and discount management
- Notifications
- Administrative operations
- Audit logging

The project is being developed as a portfolio-focused full-stack application using a scalable backend architecture and a modern frontend.

---

## Core Actors

### Customer

Customers can:

- Browse available services
- View service and provider information
- Manage saved addresses
- Check service availability
- Create bookings
- Manage their bookings
- Make payments
- Cancel or reschedule bookings according to platform rules
- Review completed services
- Use eligible coupons
- Receive notifications

### Provider

Providers can:

- Manage their provider profile
- Submit verification information
- Manage their services
- Configure service areas
- Configure availability
- Manage bookings
- Accept or reject booking requests
- Complete services
- Respond to customer reviews

Providers must be verified before they can actively provide services through the platform.

### Support

Support users handle operational activities such as:

- Customer assistance
- Booking assistance
- Cancellation support
- Provider reassignment
- Refund assistance
- Operational issue resolution

### Admin

Administrators manage the platform and have access to administrative capabilities including:

- User management
- Role and permission management
- Provider verification
- Provider suspension
- Category management
- Service oversight
- Booking management
- Provider reassignment
- Refund operations
- Coupon management
- Audit logs
- Platform administration

---

## Key Platform Features

### Authentication & Authorization

- User registration
- Email verification
- Secure password hashing
- Login
- Access and refresh token authentication
- Password reset
- Role-based access control
- Permission-based authorization
- Session and refresh-token management

### Provider Management

- Provider profiles
- Provider verification workflow
- Verification documents
- Provider service areas
- Provider operational status
- Provider suspension handling
- Provider reassignment for affected bookings

### Service Management

- Provider-owned services
- Hierarchical service categories
- Service descriptions
- Service pricing
- Service duration
- Service images
- Primary service images
- Service activation/deactivation

### Availability Management

- Weekly recurring availability
- Multiple availability windows
- Provider timezone support
- Blocked time slots
- Booking-aware availability

### Booking Management

- Service booking
- Booking availability checks
- Booking holds
- Booking confirmation
- Provider acceptance/rejection
- Booking expiration
- Cancellation
- Rescheduling
- Booking status history
- Provider reassignment
- Historical booking snapshots

### Payments

- Online payments
- Cash payments
- Payment attempts
- Payment status tracking
- Refund management
- Payment history

### Reviews

- Customer reviews
- Rating system
- One review per completed booking
- Provider responses

### Coupons

- Percentage discounts
- Fixed discounts
- Service-specific coupons
- Category-specific coupons
- Platform-wide coupons
- Customer usage limits
- Coupon usage tracking

### Notifications

- In-app notifications
- Booking-related notifications
- Account notifications
- Operational notifications

### Audit & Administration

- Administrative actions
- Provider verification history
- Booking overrides
- Reassignment tracking
- Refund interventions
- Role and permission changes
- Audit logging

---

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Redux Toolkit
- RTK Query

### Backend

- NestJS
- TypeScript
- REST APIs
- Swagger / OpenAPI
- Prisma 8
- PostgreSQL

### Testing

- Jest
- Supertest

### Development & Version Control

- Git
- GitHub
- GitHub Actions

### Planned Infrastructure & DevOps

- Redis
- BullMQ
- Docker
- Docker Compose
- Nginx
- CI/CD
- Cloud deployment

---

## Repository Structure

The repository contains two main applications:

```text
servicehub/
│
├── frontend/
│   └── README.md
│
├── backend/
│   └── README.md
│
└── README.md