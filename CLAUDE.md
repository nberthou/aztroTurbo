# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Discord + Twitch bot monorepo** built with Node.js/TypeScript. It consists of three applications that share common packages for database access, user management, and a virtual currency system ("stars").

## Commands

```bash
# Development (watch mode with hot reload)
yarn dev                          # Run all apps
yarn dev --filter=discord_bot     # Run specific app

# Build
yarn build                        # Build all apps (esbuild -> dist/main.js)

# Code quality
yarn lint                         # ESLint across all packages
yarn format                       # Prettier formatting

# Database
yarn workspace @repo/db prisma generate   # Regenerate Prisma client after schema changes

# Type checking
yarn workspace discord_bot type-check     # Per-app TypeScript validation
```

## Architecture

### Monorepo Structure

```
apps/
  discord_bot/     # Discord.js bot - commands, events, ranking system
  twitch_bot/      # Twurple-based bot - chat, EventSub, redemptions
  link_server/     # Express OAuth server for Twitch account linking

packages/
  db/              # Prisma + MongoDB data layer
  redis/           # Redis pub/sub client
  types/           # Shared TypeScript types
  userService/     # Cross-platform user management
  wallet/          # Stars currency system
  deathCounter/    # Death counter logic
```

### Data Model (Prisma/MongoDB)

- **User**: Links twitchId/discordId, tracks stars currency, guild membership, pokemon collection
- **Guild**: User groups with shared bank
- **Pokemon**: RPG-style creatures with stats, owned by users
- **Command**: Database-driven dynamic commands
- **DeathCounter**: Toggleable game death counters
- **TwitchToken**: OAuth token storage for Twitch API

### Application Patterns

**Discord Bot** (`apps/discord_bot/`):
- Class-based `DiscordBot` with singleton client
- Commands loaded from files + database-driven dynamic commands
- Events: ready, messageCreate, interactionCreate, voiceStateUpdate

**Twitch Bot** (`apps/twitch_bot/`):
- Class-based `TwitchBot` with separate bot/streamer clients
- `TokenManager` for OAuth token refresh
- EventSub (WebSocket) for real-time Twitch events
- Redis pub/sub for inter-application communication

**Link Server** (`apps/link_server/`):
- Express server (port 7176)
- OAuth2 callback handler to link Discord and Twitch accounts

### Key Dependencies

- **discord.js** 14.x for Discord API
- **@twurple/\*** for Twitch API (chat, api, eventsub-ws, pubsub)
- **Prisma** 5.x with MongoDB
- **Redis** 4.x for pub/sub
- **esbuild** for production bundling
- **tsx** for development with watch mode

## Environment Variables

Required variables (in `.env` files):
- `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`
- `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_CHANNEL_ID`, `TWITCH_CHANNEL_NAME`
- `DATABASE_URL` (MongoDB connection string)
- `REDIS_URL`
