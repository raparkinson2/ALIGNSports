# Team Manager

A mobile app for recreational sports teams to manage schedules, rosters, check-ins, payments, and team communication. Supports multiple sports including Hockey, Baseball, Basketball, and Soccer.

## Features

### Multi-Sport Support
- Choose your sport: Hockey, Baseball, Basketball, or Soccer
- Sport-specific positions automatically configured
- **Multiple Positions**: Players can be assigned multiple positions (e.g., LW/RW, SS/2B)
- Position names displayed appropriately for each sport

### Role-Based Access
- **Admin**: Full control - manage players, settings, create games, payment tracking
- **Captain**: Can create games, manage game invites, edit lineups
- **Player**: View schedules, check-in to games, view roster, chat

### Login
- Select your player profile to log in
- **Sign In with Apple**: iOS users can sign in with their Apple ID for quick, secure authentication
- **Email/Password**: Create an account with email and password
- **Security Questions**: Set up a security question during registration to help recover your account if you forget your password
- **Profile Photo Setup**: New players can optionally add a profile photo during account setup (can skip)
- **Password Reset**: Forgot your password? Enter your email, answer your security question, and set a new password
- Personalized experience based on your role
- Admin users see additional Admin tab

### Team Creation
- **5-Step Setup Flow**:
  1. Your Info: Name, email, phone number, role (Player or Coach), and jersey number (players only)
  2. Password: Create secure password
  3. Security Question: For account recovery
  4. Team Details: Team name and sport selection
  5. Jersey Colors: Select your team's jersey colors from presets
- **Coach Role**: Select "Coach" if you're not a player - coaches don't need a jersey number

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
- **Hockey Lines** (Hockey only): Captains/Admins can set line combinations
  - Configure forward lines (LW - C - RW), defense pairs (LD - RD), and goalies
  - Choose 1-4 forward lines, 1-4 defense pairs, and 1-2 goalies
  - Lines display on game detail screen for all players to see
  - Tap the Lines card to edit (Captains/Admins)
- **Soccer Formations** (Soccer only): Choose between different formations
  - **4-4-2**: Classic formation with 4 defenders, 4 midfielders (LM, CM, CM, RM), and 2 strikers
  - **Diamond 4-1-2-1-2**: Diamond midfield with CDM, LM, RM, CAM, and 2 strikers
  - Formation selector shows visual preview of each formation
  - Configured lineups display on game detail screen
- Send game invites via text or email (pre-fills recipients)
- **Invite More Players**: Admins/Captains can invite additional players after game creation
  - Invite individual players with one tap
  - Bulk invite all uninvited Active or Reserve players
  - Notifications sent automatically when inviting

### Game Creation (Admin/Captain)
- Set opponent, date, time
- **Location Search**: Search for venues and addresses with autocomplete
  - Type venue names (e.g., "Winterhurst") or addresses
  - Suggestions appear as you type
  - Tap a suggestion to select it
- Select jersey color from team's configured colors
- Add optional notes
- **Player Selection**:
  - Select which players to invite
  - Quick buttons to select all Active, all Reserve, or All players
  - Individual player toggle for custom selection
  - Defaults to all Active players if none selected
- **Invite Release Options** (NEW):
  - **Release invites now**: Players are notified immediately when game is created
  - **Schedule release**: Choose a specific date and time to send invites
  - **Don't send invites**: Create the game without notifications; send manually from game details later

### Roster Tab
- View all team players organized by position groups
- See player roles (Admin badge, Captain crown)
- See player status (Active/Reserve)
- Captain and Admin badges displayed next to names
- **Player Stats on Cards**: Each player card shows their stats directly below their name and position
  - Display-only (edit via Team Stats screen)
  - Sport-specific stats shown for each player
  - Hockey: GP, G, A, P, PIM, +/- (goalies: GP, W-L-T, SA, SV, SV%)
  - Baseball: AB, H, HR, RBI, K
  - Basketball: PTS, REB, AST, STL, BLK
  - Soccer: G, A, YC (goalies: GP, W-L-T, SA, SV, SV%)
- Add/edit players (Admin/Captain only)
- **Player Invites**: When creating a new player with phone/email, you can immediately send them a text or email invite to register and join the team
- **Role & Status Management** (Admin only): When editing a player, admins can:
  - Set player status: Active or Reserve
  - Toggle player roles: Captain and/or Admin
  - Players can have multiple roles simultaneously

### Chat Tab (NEW)
- Real-time team chat within the app
- Send messages to the entire team
- See who sent each message with avatars
- Messages grouped by date
- Modern chat interface with message bubbles

### Payments Tab
- **Payment Methods**: Admin can add Venmo, PayPal, Zelle, or Cash App accounts
- **One-Tap Payments**: Players tap a button to open the payment app directly
- **Payment Tracking** (Admin/Captain):
  - Create payment periods (e.g., "Season Dues - Fall 2025")
  - Set total amount per player
  - **Player Selection**: Choose which players to include in each period
    - Quick select: All Active, All Reserve, All, or None
    - Individual player toggle for custom groups
    - Create different payment periods for different player groups with different amounts
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
- **Push Notifications**: Get notified even when the app is closed
  - Enable via More > Notification Settings > "Enable Push Notifications"
  - Send a test notification to verify it's working
  - Requires a physical device (not available in simulator)
- **Notification Preferences**: Customize which notifications you receive
  - Game Invites: Get notified when invited to games
  - Day Before Reminder: 24 hours before game time
  - Hours Before Reminder: 2 hours before game time
  - Chat Messages: Team chat notifications
  - Payment Reminders: Outstanding payment alerts
- **Local Scheduled Reminders**: Game reminders are scheduled on your device

### Admin Panel (Admin only)
- **Team Settings**: Edit team name
- **Sport Selection**: Change sport type (automatically remaps all player positions to equivalent positions in the new sport and clears stats)
- **Jersey Colors**: Add/remove team jersey colors
- **Payment Methods**: Configure Venmo/PayPal/Zelle/Cash App for the team
- **Refreshment Duty Toggle**: Enable/disable per game
- **Create Lines/Lineups Toggle**: Enable/disable the ability to set game lines (hockey) or lineups (other sports)
- **Manage Team**:
  - **Add new players** with name, jersey number, position(s), phone, and email
  - **Position Selection**: Tap to select multiple positions for a player
  - **Coach Role**: Mark a member as a Coach - coaches don't need jersey numbers or positions
  - Send text/email invites to new players after creation
  - Edit existing player names, jersey numbers, positions, phone, and email
  - Phone numbers formatted as (XXX)XXX-XXXX
  - Assign roles (Captain, Admin, Coach)
  - Set status (Active, Reserve, Injured, Suspended)

### More Tab
- View your current player profile
- Access notifications with unread badge
- **Notification Settings**: Manage push notification preferences
- Email the entire team at once
- Send game invites to potential subs
- **Team Stats**: View comprehensive team statistics
  - Season record (Wins/Losses/Ties)
  - Win percentage (formatted as .XXX)
  - Season statistics summary (Games Played + sport totals)
  - Roster breakdown (active vs total players)
  - Player statistics with sport-specific columns:
    - Hockey: Goals, Assists, PIM (skaters) | GP, SA, SV, SV% (goalies)
    - Baseball: At Bats, Hits, Home Runs, RBI, Strikeouts
    - Basketball: Points, Rebounds, Assists, Steals, Blocks
    - Soccer: Goals, Assists, Yellow Cards (players) | GP, SA, SV, SV% (goalies)
  - Tap any player to add game stats
  - **Game Log**: Enter stats per game with date picker
    - Select game date
    - Enter stats for that specific game
    - View game log history at bottom of modal
    - Delete individual game entries
    - Cumulative stats automatically calculated from all game logs
- **Feature Request**: Submit suggestions for new app features via email
- **Report Bug**: Report issues and bugs via email
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
- **Zelle**: Shows recipient info (bank-specific, no universal deep link)
- **Cash App**: Opens Cash App with recipient pre-filled

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
