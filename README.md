# Pull That Up Quest - Expo React Native for Horizon OS

An Expo React Native application built for Meta Quest's Horizon OS.

## Features

- Built with Expo SDK 54
- Configured for Meta Quest 2, Quest 3, and Quest 3S
- Uses `expo-horizon-core` for proper Horizon OS support
- Separate build variants for mobile and Quest platforms
- Landscape orientation optimized for VR viewing
- Panel dimensions: 1280dp × 800dp
- **Real-time multiplayer rooms** with Firebase Realtime Database
- **Presence detection** - See who's in your room in real-time
- **6-character room IDs** for easy sharing
- **Automatic user management** with persistent user IDs and random usernames

## Prerequisites

- Node.js installed
- Meta Quest device (Quest 2, Quest 3, or Quest 3S)
- Android development environment configured
- Meta Quest Developer Hub (recommended)
- Expo Go app installed on Meta Quest (for quick testing)
- Firebase project with Realtime Database enabled

## Installation

```bash
npm install
```

## Configuration

### Firebase Setup

This app uses Firebase Realtime Database for room management and presence detection.

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup wizard
   - Enable Google Analytics (optional)

2. **Enable Realtime Database**:
   - In your Firebase project, go to "Build" > "Realtime Database"
   - Click "Create Database"
   - Choose a location (preferably close to your users)
   - Start in **test mode** for development (update security rules for production)

3. **Get Your Configuration**:
   - Go to Project Settings (gear icon) > General
   - Scroll down to "Your apps" section
   - Click the web icon (`</>`) to add a web app
   - Register your app (nickname: "Pull That Up Quest")
   - Copy the `firebaseConfig` object

4. **Configure the App**:
   - Open `firebase.config.js` in the project root
   - Replace the placeholder values with your Firebase config:

   ```javascript
   export const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     databaseURL: "https://your-project-default-rtdb.firebaseio.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

5. **Database Security Rules** (for production):
   ```json
   {
     "rules": {
       "rooms": {
         "$roomId": {
           ".read": true,
           ".write": true,
           "users": {
             "$userId": {
               ".write": "$userId === auth.uid || !exists()"
             }
           }
         }
       }
     }
   }
   ```

### Meta Horizon App ID

To publish to the Meta Horizon Store, you'll need to obtain a Horizon App ID:

1. Visit [Meta Quest Developer Hub](https://developers.meta.com/horizon/)
2. Create a new application
3. Copy your Horizon App ID
4. Update `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-horizon-core",
        {
          "horizonAppId": "YOUR_HORIZON_APP_ID_HERE"
        }
      ]
    ]
  }
}
```

5. Run `npm run prebuild:clean` to regenerate native files

## Development

### Quick Testing with Expo Go

For rapid development and testing:

```bash
npm start
```

Then scan the QR code with Expo Go on your Meta Quest device.

### Development Builds

After making changes to native configuration or installing new native modules:

```bash
npm run prebuild:clean
```

### Running on Meta Quest

Connect your Meta Quest via ADB and run:

```bash
# Development build
npm run quest

# Production build
npm run quest:release
```

### Running on Android Mobile

```bash
# Development build
npm run android

# Production build
npm run android:release
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run mobile debug build
- `npm run android:release` - Run mobile release build
- `npm run quest` - Run Quest debug build
- `npm run quest:release` - Run Quest release build
- `npm run prebuild` - Generate native Android files
- `npm run prebuild:clean` - Clean and regenerate native files

## App Features

### Room Management

**Creating a Room**:
1. Tap "Create Room" on the home screen
2. A room is automatically created with a unique 6-character ID
3. You're immediately joined to the room
4. Share the room ID with friends to invite them

**Joining a Room**:
1. Get a room ID from a friend
2. Enter the 6-character code on the home screen
3. Tap "Join Room"
4. You'll see all users currently in the room

**Room Features**:
- **Real-time presence**: See who's online instantly
- **Automatic cleanup**: Users are removed when they disconnect
- **Room ID in corner**: Easy to copy and share
- **User list**: Shows all participants with online status
- **Random usernames**: Each user gets a fun auto-generated name

## Project Structure

```
.
├── App.js                     # Main application with navigation
├── app.json                   # Expo configuration
├── firebase.config.js         # Firebase configuration (gitignored)
├── firebase.config.example.js # Firebase config template
├── android/                   # Generated Android native code
│   └── app/src/
│       ├── main/             # Shared Android code
│       ├── mobile/           # Mobile-specific configuration
│       └── quest/            # Quest-specific configuration
├── screens/
│   ├── HomeScreen.js         # Room creation and joining
│   └── RoomScreen.js         # Active room with user list
├── services/
│   └── firebase.js           # Firebase Realtime Database integration
├── utils/
│   ├── roomId.js             # Room ID generation and validation
│   └── userId.js             # User ID and username management
├── assets/                    # Images and static assets
└── package.json              # Dependencies and scripts
```

## Horizon OS Compatibility

This app uses `expo-horizon-core` which automatically:

- Configures Android product flavors (mobile and quest)
- Blocks 117+ prohibited permissions for Horizon OS
- Generates Quest-specific AndroidManifest
- Provides runtime utilities:
  - `ExpoHorizon.isHorizonDevice` - Detects if running on Quest hardware
  - `ExpoHorizon.isHorizonBuild` - Detects if built with Quest variant
  - `ExpoHorizon.horizonAppId` - Returns configured Horizon App ID

### Usage Example

```javascript
import ExpoHorizon from 'expo-horizon-core';

if (ExpoHorizon.isHorizonDevice) {
  console.log('Running on Meta Quest!');
}
```

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Meta Horizon OS Developers](https://developers.meta.com/horizon/)
- [expo-horizon-core Documentation](https://github.com/software-mansion-labs/expo-horizon)
- [Getting Started with Expo on Meta Quest](https://www.callstack.com/blog/getting-started-with-expo-on-meta-quest)

## Notes

- The app is configured for landscape orientation to match VR viewing
- Google Play Services are not available on Horizon OS
- Some Expo libraries may need Quest-compatible forks (see expo-horizon-core docs)
- Always test on actual Quest hardware before publishing

## License

MIT
