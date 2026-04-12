# GetEmployed: Opportunity Search Platform

A professional job discovery and career intelligence platform designed for graduates and early-career professionals. This application provides real-time access to live job listings, simplified filtering, and personalized shortlisting capabilities.

## Project Overview

GetEmployed is built as a single-page application (SPA) focused on high-performance data handling and accessible user interface design. The platform leverages the Adzuna Global Jobs API to provide verified graduate roles, internships, and entry-level positions. 

The primary technical objective of this project is to demonstrate proficiency in contemporary frontend development without the use of external frameworks or libraries, strictly utilizing Vanilla JavaScript, CSS3, and Semantic HTML5.

## Core Features

### Data-Driven Search and Discovery
Users can navigate thousands of roles via a real-time search engine. The search logic indexes job titles, company names, locations, and categories to ensure accurate result retrieval.

### Advanced Functional Data Logic
The application utilizes a functional programming approach for all internal data operations. Searching, filtering, and sorting are executed through a custom-built processing pipeline that exclusively uses Array Higher-Order Functions (HOFs) including `.filter()`, `.map()`, `.reduce()`, and `.sort()`. This architecture ensures modularity and optimal performance without traditional iterative loops.

### Personalized Shortlisting
A state-persistent dashboard allows users to save specific job roles for later review. This functionality is implemented using the Browser LocalStorage API, ensuring that a user's shortlist remains intact across sessions and page refreshes.

### Responsive Theme Architecture
The platform features a comprehensive light and dark theme system. It is built using a CSS Custom Property (variables) architecture that enables seamless transitions across the entire interface. The theme preference is automatically saved to provide a consistent user experience.

## Technical Architecture

### Performance Optimization
*   **Event Throttling:** Continuous events such as window scrolling and resizing are throttled to reduce CPU overhead and prevent layout thrashing.
*   **Request Caching:** A temporary local cache is implemented for API requests to minimize redundant network traffic and improve response times during navigation.
*   **Intersection Observer:** The application uses the Intersection Observer API for scroll-revealed animations, ensuring performance remains stable by only animating elements when they enter the viewport.

### API Integration and Resilience
*   **Fetch Lifecycle:** Native `fetch()` is used to communicate with the Adzuna API, incorporating comprehensive error handling for network failures or rate limits.
*   **Exponential Backoff:** The application includes a retry mechanism with exponential backoff to handle intermittent server issues gracefully.
*   **Data Fallbacks:** In the event of persistent API unavailability, the application seamlessly pivots to a local mock dataset to maintain full functionality and a zero-error user state.

## Installation and Execution

The project requires zero build steps and can be run in any modern web browser.

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/get-employed.git
    cd get-employed
    ```

2.  **Run Locally:**
    Open `index.html` using a local development server. 
    *   **VS Code:** Use the Live Server extension.
    *   **Python:** Run `python3 -m http.server 8000`.
    *   **Node.js:** Run `npx serve .`.

## Milestone Compliance Checklist

This project successfully fulfills the requirements for the following milestones:

*   **Milestone 1:** Defined project scope, integrated public API, and established foundational repository structure.
*   **Milestone 2:** Implemented dynamic API integration using `fetch()`, managed async loading states with skeleton screens, and ensured 100% responsiveness across mobile, tablet, and desktop viewports.
*   **Milestone 3:** Developed the three required core features (Search, Filter, Sort) alongside additional bonus features (Theme Toggling and Shortcuts). All data operations strictly adhere to the use of Array Higher-Order Functions.

---
© 2026 GetEmployed Platform. Developed as a Web Application Programming Project.
