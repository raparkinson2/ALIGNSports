# Team Manager

A mobile app for recreational sports teams to manage schedules, rosters, check-ins, payments, and team communication. Supports multiple sports including Hockey, Baseball, Basketball, and Soccer.

## Features

### Multi-Sport Support
- Choose your sport: Hockey, Baseball, Basketball, or Soccer
- Sport-specific positions automatically configured
- Position names displayed appropriately for each sport

### Role-Based Access
- **Admin**: Full control - manage players, settings, create games, payment tracking
- **Captain**: Can create games, manage game invites, edit lineups
- **Player**: View schedules, check-in to games, view roster, chat

### Login
- Select your player profile to log in
- Personalized experience based on your role
- Admin users see additional Admin tab

### Schedule Tab
- View upcoming games with opponent, date, time, and location
- See jersey color for each game (shows color name like "White" or "Black")
- Quick view of check-in status
- Admins/Captains can add new games via the + button
- Tap any game to view full details

### Game Details
- Full game information including time, location, and jersey color
- Tap location to open in Maps for directions
- Check in/out for games
- See who's been invited and who's checked in
- **In-App Notifications**: Send game invites and reminders to all players
- **Refreshment Duty**: Admin toggle to show/hide who's bringing drinks (age-appropriate toggle)
- Send game invites via text or email (pre-fills recipients)
- **Invite More Players**: Admins/Captains can invite additional players after game creation
  - Invite individual players with one tap
  - Bulk invite all uninvited Active or Reserve players
  - Notifications sent automatically when inviting

### Game Creation (Admin/Captain)
- Set opponent, date, time
- Choose location with address
- Select jersey color from team's configured colors
- Add optional notes
- **Player Selection**:
  - Select which players to invite
  - Quick buttons to select all Active, all Reserve, or All players
  - Individual player toggle for custom selection
  - Defaults to all Active players if none selected

### Roster Tab
- View all team players organized by position groups
- See player roles (Admin badge, Captain crown)
- See player status (Active/Reserve)
- Captain and Admin badges displayed next to names
- Add/edit players (Admin/Captain only)

### Chat Tab (NEW)
- Real-time team chat within the app
- Send messages to the entire team
- See who sent each message with avatars
- Messages grouped by date
- Modern chat interface with message bubbles

### Payments Tab
- **Payment Methods**: Admin can add Venmo, PayPal, or Zelle accounts
- **One-Tap Payments**: Players tap a button to open the payment app directly
- **Payment Tracking** (Admin/Captain):
  - Create payment periods (e.g., "Season Dues - Fall 2025")
  - Set total amount per player
  - Tap any player to view/add payments
  - **Payment Ledger**: Add multiple payments with amounts and dates
  - Payments automatically sum up and update status
  - Visual progress bar showing team payment status
- **Player Payment Details**:
  - View balance summary (Total Due, Paid, Remaining)
  - Add new payments with amount, date, and optional note
  - View complete payment history with dates
  - Delete incorrect payment entries
- **My Payment Status** (Players):
  - See your own payment details and history
  - View balance: what you owe vs what you've paid
  - Color-coded status: green for paid, amber for partial, default for unpaid

### Notifications
- In-app notification system for game invites and reminders
- View notifications in More > Notifications
- Unread badge shows count
- Tap notification to go to game details

### Admin Panel (Admin only)
- **Team Settings**: Edit team name
- **Sport Selection**: Change sport type (updates positions)
- **Jersey Colors**: Add/remove team jersey colors
- **Payment Methods**: Configure Venmo/PayPal/Zelle for the team
- **Refreshment Duty Toggle**: Enable/disable per game
- **Player Management**:
  - View all player contact info (email, phone - formatted as (XXX)XXX-XXXX)
  - Edit player names and jersey numbers
  - Assign roles (Admin, Captain, Player)
  - Set status (Active, Reserve)

### More Tab
- View your current player profile
- Access notifications with unread badge
- Email the entire team at once
- Send game invites to potential subs
- Log out to switch players

### Photos Tab
- View team photos in a gallery grid
- Take photos directly from the app
- Add photos from your camera roll
- All players can view and add photos

## Player Status
- **Active**: Regular roster players, auto-invited to games
- **Reserve**: Backup players, can be selectively invited

## Communication
- **In-App Notifications**: Game invites and reminders delivered within the app
- Send text invites that open your messaging app with pre-filled game details
- Send email invites with full game information
- Communication opens native apps (SMS/Email) with recipients pre-populated

## Payment Deep Links
When players tap a payment method:
- **Venmo**: Opens Venmo app with recipient pre-filled
- **PayPal**: Opens PayPal.me link in browser
- **Zelle**: Opens Zelle app with recipient pre-filled

## Tech Stack
- Expo SDK 53 / React Native
- Expo Router for navigation
- Zustand for state management with AsyncStorage persistence
- NativeWind (Tailwind CSS) for styling
- React Native Reanimated for animations
- Lucide icons

## Design
- Dark theme with ice blue (#67e8f9) accents
- Green accents (#22c55e) for payments
- Purple accents (#a78bfa) for admin features
- Amber accents (#f59e0b) for refreshment duty
- Smooth animations and haptic feedback
- Mobile-first, thumb-friendly design

## Testing Admin Features
Log in as **Mike Johnson** (#12) to access admin features. He is set as admin in the mock data.
