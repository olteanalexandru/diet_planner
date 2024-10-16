# Recipe Management Application

## Table of Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Technologies](#technologies)
4. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Environment Variables](#environment-variables)
5. [Usage](#usage)
6. [API Routes](#api-routes)
7. [Database Schema](#database-schema)
8. [Authentication](#authentication)
9. [Contributing](#contributing)
10. [License](#license)

## Introduction

This Recipe Management Application is a full-stack web application built with Next.js, React, and TypeScript. It allows users to discover, save, and share recipes, as well as plan meals and interact with other users through a social feed.

## Features

- User authentication with Auth0
- Recipe search and discovery
- Favorite recipes
- Social features (follow users, activity feed)
- Commenting system
- Meal planning
- Premium subscription features

## Technologies

- Next.js 14.2
- React 18
- TypeScript
- Prisma (ORM)
- PostgreSQL
- Auth0 (Authentication)
- Stripe (Payment processing)
- Bootstrap 5 (Styling)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/olteanalexandru/diet_planner.git
   cd recipe-management-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your environment variables (see [Environment Variables](#environment-variables) section).

4. Run Prisma migrations:
   ```
   npx prisma migrate dev
   ```

5. Start the development server:
   ```
   npm run dev
   ```

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
DATABASE_URL="postgresql://username:password@localhost:5432/recipe_db"
AUTH0_SECRET='your_auth0_secret'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your_client_id'
AUTH0_CLIENT_SECRET='your_client_secret'
OPENAI_API_KEY='your_openai_api_key'
PEXELS_API_KEY='your_pexels_api_key'
STRIPE_SECRET_KEY='your_stripe_secret_key'
STRIPE_PRICE_ID='your_stripe_price_id'
```

Replace the placeholder values with your actual credentials.

## Usage

After starting the development server, open your browser and navigate to `http://localhost:3000`. You can now use the application to search for recipes, save favorites, plan meals, and interact with other users.

## API Routes

- `/api/auth/*`: Auth0 authentication routes
- `/api/recipes`: CRUD operations for recipes
- `/api/comments`: Get and post comments
- `/api/followUsers`: Follow/unfollow users
- `/api/mealPlanning`: Manage meal plans
- `/api/premium`: Handle premium subscriptions
- `/api/socialFeed`: Get user activity feed

## Database Schema

The main entities in the database are:
- User
- Recipe
- Comment
- Follow
- MealPlan
- Activity

Refer to the `prisma/schema.prisma` file for detailed schema information.

## Authentication

This application uses Auth0 for user authentication. Users can sign up and log in using their email or social accounts configured in your Auth0 application.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.



