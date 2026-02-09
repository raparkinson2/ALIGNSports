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
- **Email/Password**: Create an account with email and password (synced with Supabase cloud authentication)
- **Security Questions**: Set up a security question during registration to help recover your account if you forget your password
- **Profile Photo Setup**: New players can optionally add a profile photo during account setup (can skip)
- **Password Reset**: Forgot your password? Enter your email to receive a reset link via Supabase, or use security questions for offline recovery
- **Multi-Team Support**: If you belong to multiple teams, you'll see a team selection screen after login
  - Choose which team to view
  - Switch teams anytime via More > Switch Team
  - **Create New Team**: Add a new team without logging out via More > Create New Team
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
- **Real-Time Validation**: Email and phone are validated immediately when you move to the next field
  - If email or phone is already in use, you'll see an error right away
  - No more waiting until the end to find out there's a conflict
- **Form Persistence**: Your progress is automatically saved for 10 minutes
  - If you leave the app (e.g., to allow photo permissions), your data is preserved
  - Form is cleared when you successfully create a team or go back to login

### Schedule Tab
- View upcoming games, practices, and events with date, time, and location
- See jersey color for each game (shows color name like "White" or "Black")
- Quick view of check-in status
- Admins/Captains can add new games, practices, or events via the + button
- Tap any item to view full details
- **View Toggle**: Switch between List and Calendar views
  - List view shows items in a scrollable list
  - Calendar view shows a monthly calendar with indicators:
    - Green: Games
    - Orange: Practices
    - Blue: Events
  - **Persistent Preference**: Your last selected view is remembered and restored on app reopen

### Creating Games, Practices & Events (Admin/Captain)
- **Game**: Schedule a game against an opponent
  - Set opponent, date, time, jersey color
  - Add optional notes
  - Invite players and set invite release options
- **Practice**: Schedule a team practice
  - Set date, time, and location
  - Add optional notes
  - Invite players
  - Practices display with orange accent color
- **Event**: Schedule team events (meetings, dinners, social gatherings)
  - Set event name, date, time, and location
  - Add optional notes
  - Invite players
  - Events display with blue accent color

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
  - **Admin Protection**: Cannot remove your own admin role if you're the only admin
  - **Confirmation Dialog**: Removing admin role shows a warning explaining what privileges will be lost

### Chat Tab
- Real-time team chat within the app
- Send messages to the entire team
- See who sent each message with avatars
- Messages grouped by date
- Modern chat interface with message bubbles
- **@Mentions**: Tag teammates to notify them
  - Type **@** to open the autocomplete dropdown
  - Type **@everyone** to notify all team members
  - Start typing a name after @ to filter the list
  - Tap a name to insert the mention
  - Mentions appear highlighted in cyan in messages
  - Mention notifications can be toggled in notification settings
- **GIF Support**: Send GIFs via GIPHY integration
- **Image Sharing**: Share images from your camera roll

### Payments Tab
- **Payment Methods**: Admin can add Venmo, PayPal, Zelle, or Cash App accounts
- **One-Tap Payments**: Players tap a button to open the payment app directly
- **Payment Tracking** (Admin/Captain):
  - Create payment periods (e.g., "Season Dues - Fall 2025")
  - Set total amount per player
  - **Team Total Owed** (Admin-only): Set the total amount owed by the team for each payment period
    - Displays total owed, total collected, and remaining balance
    - Automatically updates as players make payments
    - Only visible to admin users
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
- **Team Stats Settings**:
  - **Use Team Stats**: Enable/disable the team stats feature
  - **Allow Player to Manage Own Stats**: When enabled, players can add and update their own game stats (not just admins)
- **Email Team**: Send an email to all or selected players directly from the app
  - Compose subject and message in-app
  - Select specific recipients or email entire team
  - Emails sent from noreply@alignsports.com (requires Supabase Edge Function setup)
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
- **Switch Team**: If you belong to multiple teams, tap to switch between them
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
- **My Availability**: Set dates when you're unavailable
  - **List View**: See all upcoming unavailable dates in a scrollable list
  - **Calendar View**: Visual monthly calendar showing unavailable dates
  - Add unavailable dates with date picker
  - Remove dates by tapping them
  - **Auto Check-Out**: When you add an unavailable date that has a game or event, you are automatically marked as OUT with note "Unavailable"
  - View conflicts with scheduled games/events before confirming
- Log out to switch players

### Photos Tab
- View team photos in a gallery grid
- Take photos directly from the app
- Add photos from your camera roll
- All players can view and add photos

## Player Status
- **Active**: Regular roster players, auto-invited to games
- **Reserve**: Backup players, can be selectively invited
- **Injured/Suspended**: Set end date to automatically mark player OUT for games within that period
  - When you set or update an injury/suspension end date, all existing games on or before that date will have the player auto-marked as OUT
  - When the end date is cleared or player is no longer injured/suspended, the OUT status is automatically removed from games where it was set for that reason

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
