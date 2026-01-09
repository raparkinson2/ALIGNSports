# Team Manager

A mobile app for recreational sports teams to manage schedules, rosters, check-ins, and team communication. Supports multiple sports including Hockey, Baseball, Basketball, and Soccer.

## Features

### Multi-Sport Support
- Choose your sport: Hockey, Baseball, Basketball, or Soccer
- Sport-specific positions automatically configured
- Position names displayed appropriately for each sport

### Role-Based Access
- **Admin**: Full control - manage players, settings, create games, invite players
- **Captain**: Can create games, manage game invites, edit lineups
- **Player**: View schedules, check-in to games, view roster

### Login
- Select your player profile to log in
- Personalized experience based on your role
- Admin users see additional Admin tab

### Schedule Tab
- View upcoming games with opponent, date, time, and location
- See jersey color for each game (configurable in admin)
- Quick view of check-in status
- Admins/Captains can add new games via the + button
- Tap any game to view full details

### Game Details
- Full game information including time, location, and jersey color
- Tap location to open in Maps for directions
- Check in/out for games
- See who's been invited and who's checked in
- Send game invites via text or email

### Game Creation (Admin/Captain)
- Set opponent, date, time
- Choose location with address
- Select jersey color from team's configured colors
- Add optional notes
- Auto-invites all active players

### Roster Tab
- View all team players organized by position groups
- See player roles (Admin badge, Captain crown)
- See player status (Active/Reserve)
- Captain and Admin badges displayed next to names
- Add/edit players (Admin/Captain only)

### Photos Tab
- Team photo gallery
- Add photos from camera roll or take new photos
- Share game memories with the team

### Admin Panel (Admin only)
- **Team Settings**: Edit team name
- **Sport Selection**: Change sport type (updates positions)
- **Jersey Colors**: Add/remove team jersey colors
- **Player Management**:
  - View all player contact info (email, phone)
  - Assign roles (Admin, Captain, Player)
  - Set status (Active, Reserve)

### More Tab
- View your current player profile
- Email the entire team at once
- Send game invites to potential subs
- Group message the team
- Log out to switch players

## Player Status
- **Active**: Regular roster players, auto-invited to games
- **Reserve**: Backup players, can be selectively invited

## Communication
- Send text invites that open your messaging app with pre-filled game details
- Send email invites with full game information
- Communication opens native apps (SMS/Email) with recipients pre-populated

## Tech Stack
- Expo SDK 53 / React Native
- Expo Router for navigation
- Zustand for state management with AsyncStorage persistence
- NativeWind (Tailwind CSS) for styling
- React Native Reanimated for animations
- Lucide icons

## Design
- Dark theme with ice blue (#67e8f9) accents
- Purple accents (#a78bfa) for admin features
- Smooth animations and haptic feedback
- Mobile-first, thumb-friendly design
