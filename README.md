# TaskFlow

A habit-forming TODO management app with streak tracking, AI task breakdown, and GitHub integration.

## Features

- **Streak Tracking**: Build habits with daily completion streaks
- **AI Task Breakdown**: Break down complex tasks using OpenAI (optional)
- **GitHub Integration**: Auto-complete tasks from commit messages
- **Project Organization**: Group tasks by project with color coding
- **Recurring Tasks**: Set daily, weekly, or monthly recurring tasks
- **Statistics & Achievements**: Track your productivity with charts and unlock achievements

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + Shadcn/ui
- Zustand (state management)
- date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/kunho817/TaskFlow.git
cd TaskFlow
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Edit `.env` and add your API keys (see [Environment Variables](#environment-variables))

5. Start the development server
```bash
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GITHUB_CLIENT_ID` | Optional | GitHub OAuth App Client ID |
| `VITE_GITHUB_REDIRECT_URI` | Optional | GitHub OAuth callback URL |
| `VITE_OPENAI_API_KEY` | Optional | OpenAI API key for AI features |

### Setting up GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: `TaskFlow`
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:5173/auth/github/callback`
4. Copy the Client ID to `VITE_GITHUB_CLIENT_ID`

### Setting up OpenAI API

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy to `VITE_OPENAI_API_KEY`

> Note: The app works without these keys - GitHub and AI features will just be disabled.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
