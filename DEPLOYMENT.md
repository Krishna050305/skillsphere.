# SkillSphere Deployment Guide

This document outlines the deployment strategy, required environment configurations, and the final smoke test checklist to ensure a production-ready state for the SkillSphere Monorepo.

## 1. Deployment Order

Due to service dependencies, deployments must occur in the following strict order:
1.  **ML Service (FastAPI)**: Deploy this first. The Node.js Server relies on this service for AI matching features.
2.  **Server (Express/Node)**: Deploy this second. You must provide the deployed ML Service URL as an environment variable to this deployment.
3.  **Client (React/Vite)**: Deploy this last. You must provide the deployed Server URL as an environment variable. After deploying the Client, take its production URL and update the `CORS_ALLOWED_ORIGINS` variable on the Server.

---

## 2. Environment Variables

### A. ML Service (`ml-service/`)
*   `PORT`: Port to listen on (e.g., `8000`).

### B. Server (`server/`)
*   `NODE_ENV`: Set to `production` to activate secure error handlers and limits.
*   `PORT`: Port to listen on (e.g., `5000`).
*   `MONGODB_URI`: Connection string for your production MongoDB cluster (e.g., MongoDB Atlas).
*   `JWT_SECRET`: A strong, randomly generated string for signing JWT tokens.
*   `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name for media hosting.
*   `CLOUDINARY_API_KEY`: Cloudinary API key.
*   `CLOUDINARY_API_SECRET`: Cloudinary API secret.
*   `RAZORPAY_KEY_ID`: Razorpay API Key ID (use Live key in true prod).
*   `RAZORPAY_KEY_SECRET`: Razorpay API Key Secret.
*   `ML_SERVICE_URL`: The fully qualified HTTPS URL of your deployed ML Service.
*   `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed origins. Example: `https://skillsphere.vercel.app`

### C. Client (`client/`)
*   `VITE_API_URL`: The fully qualified HTTPS URL of your deployed Node Server.
*   `VITE_SOCKET_URL`: The fully qualified HTTPS URL of your deployed Node Server (for Socket.IO).
*   `VITE_RAZORPAY_KEY_ID`: Razorpay public Key ID (matching the server).

---

## 3. Deployment Platforms

*   **Server & ML Service**: We provide a `render.yaml` Blueprint file at the root of this repo. You can connect your repository directly to [Render](https://render.com) and it will automatically provision both backend services.
*   **Client**: We recommend [Vercel](https://vercel.com) for the frontend. We have included a `client/vercel.json` file which configures wildcard rewrites to `index.html`, ensuring that direct links to nested routes (like `/freelancer/analytics`) load correctly without throwing a 404.

---

## 4. Manual Production Smoke Test Checklist

Before announcing the platform as live, a system administrator must perform this exact sequence of actions against the production URLs to verify end-to-end integrity:

- [ ] **1. Authentication**: Register a new Client account and a new Freelancer account. Log out and log in to verify JWT generation.
- [ ] **2. Profile Setup**: As the Freelancer, upload a portfolio item and set weekly availability. Ensure the profile saves correctly (verifies Cloudinary integration).
- [ ] **3. Gig Posting & ML Matching**: As the Client, post a new fixed-budget Gig. Switch to the Freelancer account and verify that the Gig appears in the "Recommendations" feed (verifies ML-Service integration).
- [ ] **4. Bidding Engine**: As the Freelancer, submit a Proposal to the Client's new Gig.
- [ ] **5. Escrow Payment & Webhooks**: As the Client, accept the Proposal and click "Fund Milestone 1". Complete the Razorpay checkout using test credentials. Verify the milestone status changes to "In Progress" (verifies Razorpay signature validation and webhook integrity).
- [ ] **6. Execution Progress**: As the Freelancer, update the milestone progress to 50% and upload a file via the Progress Logs feature.
- [ ] **7. Escrow Release**: As the Client, release the milestone payment. Check the Freelancer's Analytics Dashboard to confirm their `Total Earnings` incremented by the amount minus the 10% platform fee.
- [ ] **8. Reputation System**: As the Client, leave a 5-star review for the Freelancer. Check the Freelancer's public profile to ensure the review and updated average rating are visible.
- [ ] **9. Administration**: Log in as the Admin (created via the seed script) and navigate to the Admin Panel. Verify that the analytics charts load and the newly completed gig is visible in the moderation logs.
