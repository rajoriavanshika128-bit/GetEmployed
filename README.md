# GetEmployed – Opportunity Intelligence Platform for Students

## Overview
GetEmployed is a smart web-based application designed to help students discover, analyze, and prioritize job and internship opportunities.

Unlike traditional platforms that only display listings, GetEmployed focuses on **decision-making intelligence**. It helps users identify the most relevant opportunities based on their skills, salary insights, and urgency, enabling smarter and faster application decisions.

---

## Problem Statement
Students often struggle with:
- Finding relevant job or internship opportunities
- Evaluating which opportunities are worth applying for
- Managing multiple options without clear prioritization

This results in:
- Missed opportunities  
- Poor decision-making  
- Time wasted on irrelevant applications  

---

## Solution
GetEmployed transforms opportunity discovery into an **intelligent decision-making process** by:

- Aggregating real-time job data from a public API  
- Ranking opportunities using a **Match Score algorithm**  
- Providing structured filtering and sorting  
- Highlighting urgency using a **deadline simulation system**  

---

## Key Features

### 🔍 Smart Search
Search opportunities by job title, company, or keywords.

---

### Advanced Filtering
- Filter by job category (Tech, Marketing, etc.)
- Filter by salary range
- Filter based on relevance

---

### Sorting System
- Sort by salary (high → low)
- Sort alphabetically
- Sort by relevance score

---

### Match Score (Core Feature)
A custom scoring system that ranks opportunities based on:
- Skill match  
- Category preference  
- Opportunity relevance  

This helps users quickly identify **best-fit opportunities**.

---

### Smart Deadline Indicator
Since most APIs do not provide deadlines, GetEmployed introduces a **simulated urgency system**:
- 🔴 Urgent (closing soon)  
- 🟡 Moderate  
- 🟢 Safe  

---

### Save Opportunities
Users can bookmark jobs using **localStorage** for later access.

---

### Dark Mode
Toggle between light and dark themes for better user experience.

---

### Top Picks (Highlight Feature)
Displays the most relevant opportunities based on highest match scores.

---

## Tech Stack

- **HTML** – Structure  
- **CSS / Tailwind CSS** – Styling & responsive UI  
- **JavaScript (ES6)** – Logic and interactivity  
- **Fetch API** – Data fetching  
- **LocalStorage** – Saving user preferences  

---

## API Used

### Adzuna Jobs API  
https://developer.adzuna.com/

The Adzuna API provides structured job data including:
- Job title  
- Company name  
- Category  
- Salary range  
- Location  
- Job description  

This enables efficient implementation of search, filtering, and sorting features.

---

## Setup and Run

### Clone the repository
```bash
git clone https://github.com/rajoriavanshika128-bit/OpTrack.git
