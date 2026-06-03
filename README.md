# FORM-MATE

AI Powered Form Filling System

This project is a React + Node.js banking assistant that helps users complete onboarding, KYC, and form-filling workflows with AI-powered OCR, face verification, speech recognition, and form auto-population.

## What this project does

- Captures and verifies user identity through onboarding and face-registration flows
- Uses OCR to extract details from Aadhaar, PAN, and other documents
- Uses speech-to-text and smart matching to pre-fill bank forms
- Provides a responsive UI for account selection, document review, and form submission
- Connects to a backend API and MongoDB for user and form data storage

## Main features

- Smart onboarding flow for new users
- AI-assisted form filling for banking forms
- Face registration and verification support
- OCR-based document data extraction
- Speech-enabled input assistance
- MongoDB-backed user and submission management

## Tech stack

- Frontend: React, Vite, CSS
- Backend: Express.js, Node.js, Mongoose
- AI / document tools: OCR, speech-to-text, face verification integrations
- Database: MongoDB

## Project structure

- `src/` — frontend pages, components, hooks, and styles
- `server/` — Express API, controllers, routes, models, and seed scripts
- `public/` — static assets

## Getting started

1. Install frontend dependencies
   ```bash
   npm install
   ```

2. Install backend dependencies
   ```bash
   cd server
   npm install
   ```

3. Start the frontend
   ```bash
   npm run dev
   ```

4. Start the backend
   ```bash
   cd server
   npm start
   ```

5. If you use the face/OCR services, make sure the required local services are running as configured in `server/`.

## Notes

This repository contains the latest UI and onboarding updates for the smart banking form-filling system. The README is now updated to reflect the real purpose of the project and how to run it locally.

