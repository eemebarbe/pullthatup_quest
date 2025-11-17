# Pull That Up Quest - Expo React Native for Horizon OS

An Expo React Native application built for Meta Quest's Horizon OS.

## Features

- Built with Expo SDK 54
- Configured for Meta Quest 2, Quest 3, and Quest 3S
- Uses `expo-horizon-core` for proper Horizon OS support
- Separate build variants for mobile and Quest platforms
- Landscape orientation optimized for VR viewing
- Panel dimensions: 1280dp × 800dp

## Prerequisites

- Node.js installed
- Meta Quest device (Quest 2, Quest 3, or Quest 3S)
- Android development environment configured
- Meta Quest Developer Hub (recommended)
- Expo Go app installed on Meta Quest (for quick testing)

## Installation

```bash
npm install
```

## Configuration

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

## Project Structure

```
.
├── App.js                     # Main application component
├── app.json                   # Expo configuration
├── android/                   # Generated Android native code
│   └── app/src/
│       ├── main/             # Shared Android code
│       ├── mobile/           # Mobile-specific configuration
│       └── quest/            # Quest-specific configuration
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
