#!/bin/bash

# This script fixes all player.name references to use getPlayerName(player) or player.firstName

# Fix more.tsx
sed -i 's/player\.name/getPlayerName(player)/g' src/app/\(tabs\)/more.tsx

# Fix payments.tsx
sed -i 's/player\.name/getPlayerName(player)/g' src/app/\(tabs\)/payments.tsx

# Fix roster.tsx display references (not form state yet)
sed -i '238s/player\.name/getPlayerName(player)/' src/app/\(tabs\)/roster.tsx
sed -i '928s/player\.name/getPlayerName(player)/' src/app/\(tabs\)/roster.tsx

# Fix simple app files
sed -i 's/player\.name/getPlayerName(player)/g' src/app/feature-request.tsx
sed -i 's/player\.name/getPlayerName(player)/g' src/app/login.tsx
sed -i 's/player\.name/getPlayerName(player)/g' src/app/report-bug.tsx
sed -i 's/player\.name/getPlayerName(player)/g' src/app/game/\[id\].tsx

# Fix register.tsx - special case with name: property
sed -i 's/name: player\.name/firstName: player.firstName, lastName: player.lastName/g' src/app/register.tsx

# Fix team-stats.tsx - uses formatName(player.name)
sed -i 's/formatName(player\.name)/formatName(getPlayerName(player))/g' src/app/team-stats.tsx

# Fix component files
sed -i 's/player\.name/getPlayerName(player)/g' src/components/BaseballLineupEditor.tsx
sed -i 's/player\.name/getPlayerName(player)/g' src/components/BaseballLineupViewer.tsx
sed -i 's/player\.name/getPlayerName(player)/g' src/components/BasketballLineupEditor.tsx
sed -i 's/player\.name/getPlayerName(player)/g' src/components/BasketballLineupViewer.tsx
sed -i 's/player\.name/getPlayerName(player)/g' src/components/LineupEditor.tsx
sed -i 's/player\.name/getPlayerName(player)/g' src/components/LineupViewer.tsx
sed -i 's/player\.name/getPlayerName(player)/g' src/components/SoccerDiamondLineupEditor.tsx
sed -i 's/player\.name/getPlayerName(player)/g' src/components/SoccerLineupEditor.tsx

echo "Done with basic replacements. Now you need to:"
echo "1. Add getPlayerName import to all these files"
echo "2. Fix roster.tsx form state (lines 389, 411, 434, 459)"
echo "3. Verify all changes"
