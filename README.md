# Pull That Up Quest - Multi-Platform Real-Time Rooms

A real-time multiplayer room application built with Expo React Native. Works seamlessly across Meta Quest (Horizon OS), iOS, Android, and Web.

## Features

### Multi-Platform Support
- **Web**: Works in any modern browser (Chrome, Firefox, Safari, etc.)
- **iOS**: Native iOS app via Expo
- **Android**: Native Android app with mobile and Quest variants
- **Meta Quest**: Optimized for Quest 2, 3, and 3S via Horizon OS
- **Responsive Design**: Adapts to all screen sizes and orientations

### Real-Time Multiplayer
- **Firebase Realtime Database** for instant synchronization
- **Presence detection** - See who's online in real-time
- **6-character room IDs** for easy sharing
- **Automatic cleanup** when users disconnect
- **Cross-platform rooms** - Join from any device!

### User Experience
- **Auto-generated usernames** (e.g., "BraveDragon42")
- **Persistent user IDs** across app restarts
- **One-tap room creation**
- **Copy-to-clipboard** room codes
- **Real-time user list** with online indicators

### Technical Features
- Built with Expo SDK 54 and React Native
- Uses `expo-horizon-core` for Quest/Horizon OS support
- Separate build variants for mobile and Quest platforms
- Responsive layouts with platform-specific optimizations

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

### Running on Web

The app works great on web browsers! Perfect for testing or as a companion experience:

```bash
npm run web
```

Then open your browser to the URL shown (usually http://localhost:8081).

**Web Features:**
- Full Firebase integration
- Real-time room updates
- Works on desktop and mobile browsers
- No installation required - share the URL with friends!

### Running on iOS

```bash
npm run ios
```

Note: Requires a Mac with Xcode installed.

## Testing Across Platforms

You can test the multi-platform experience by:

1. **Start the web version**: `npm run web`
2. **Open Expo Go on mobile**: Scan the QR code from `npm start`
3. **Join the same room** from both devices
4. **See real-time presence** working across platforms!

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run mobile debug build
- `npm run android:release` - Run mobile release build
- `npm run quest` - Run Quest debug build
- `npm run quest:release` - Run Quest release build
- `npm run web` - Run web version in browser
- `npm run ios` - Run iOS app (requires Mac)
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
