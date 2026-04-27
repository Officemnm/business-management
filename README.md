# Business Management Dashboard

A modern business management dashboard built with Next.js, React, and Framer Motion. This application provides a comprehensive interface for managing business operations, tracking projects, monitoring team activities, and analyzing performance metrics.

## Features

- **Modern Dashboard**: Interactive dashboard with animated statistics and charts
- **Project Management**: Track project progress with visual progress bars
- **Team Activity**: Monitor recent team activities and updates
- **Responsive Design**: Fully responsive layout for desktop and mobile
- **Animations**: Smooth animations using Framer Motion
- **Dark Mode Support**: Automatic dark mode based on system preference
- **Real-time Updates**: Simulated real-time data updates

## Tech Stack

- **Next.js 14** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Axios** - HTTP client
- **React Query** - Data fetching and caching
- **React Table** - Table utilities
- **Date-fns** - Date manipulation

## Installation

1. Navigate to the project directory:
   ```bash
   cd app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── app/                    # Next.js app router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Navbar.tsx         # Navigation bar
│   ├── DashboardCard.tsx  # Statistic cards
│   ├── ProjectProgress.tsx # Project progress component
│   ├── RecentActivity.tsx # Activity feed
│   └── MotionProvider.tsx # Animation provider
├── public/                # Static assets
└── package.json          # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint (if configured)

## Key Components

### Dashboard
- Revenue statistics
- Project completion rates
- Team member counts
- Performance metrics

### Project Management
- Visual progress tracking
- Deadline monitoring
- Priority indicators
- Timeline views

### Team Activity
- Real-time activity feed
- User actions tracking
- Notification system
- Collaboration tools

## Customization

1. **Theming**: Modify colors in `globals.css` and Tailwind config
2. **Data Sources**: Replace mock data with API calls in components
3. **Animations**: Adjust Framer Motion settings in `MotionProvider`
4. **Layout**: Modify component structure in `layout.tsx`

## Dependencies Installed

- `next`: 16.2.4
- `react`: 19.2.4
- `react-dom`: 19.2.4
- `framer-motion`: 12.38.0
- `lucide-react`: 1.11.0
- `axios`: 1.15.2
- `@tanstack/react-query`: 5.100.5
- `@tanstack/react-table`: 8.21.3
- `clsx`: 2.1.1
- `tailwind-merge`: 3.5.0
- `date-fns`: 4.1.0

## Development

The project uses:
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **ESLint** for code quality (optional)
- **Prettier** for code formatting (optional)

## Deployment

Build the project for production:

```bash
npm run build
```

The built application can be deployed to any hosting service that supports Next.js, such as Vercel, Netlify, or AWS.

## License

MIT

## Contact

For questions or support, please contact the development team.

---

**Note**: This is a demo application with mock data. Replace with real API endpoints for production use.
