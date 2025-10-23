# Browser Support

## Supported Browsers

This application supports the following browsers:

### Desktop Browsers
- **Chrome**: Last 2 versions (87+)
- **Firefox**: Last 2 versions (78+) + ESR
- **Safari**: Last 2 versions (14+)
- **Edge**: Last 2 versions (88+)

### Mobile Browsers
- **iOS Safari**: Last 2 versions (14+)
- **Android Chrome**: Last 2 versions (87+)

## Browser Features Used

### Modern JavaScript (ES2020)
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- Dynamic imports
- Async/await
- Arrow functions
- Template literals
- Destructuring

### Web APIs
- **Web Crypto API**: SHA-256, SHA-512 hashing (all modern browsers)
- **Service Workers**: PWA offline support (all modern browsers)
- **LocalStorage**: State persistence (all browsers)
- **Clipboard API**: Copy functionality (all modern browsers)
- **Navigator Online**: Network status detection (all browsers)

### CSS Features
- **CSS Grid**: Layout system (all modern browsers)
- **CSS Flexbox**: Component layouts (all browsers)
- **CSS Custom Properties**: Theme variables (all modern browsers)
- **CSS Transitions**: Animations (all browsers)

## Testing

Cross-browser testing is performed using:
- **Playwright**: Automated E2E tests on Chromium, Firefox, and WebKit
- **Mobile Testing**: iOS Safari and Android Chrome emulation

## Known Limitations

- **IE 11**: Not supported (deprecated browser)
- **Older browsers**: May have issues with modern JavaScript features

## Progressive Enhancement

The application is built with progressive enhancement:
1. Core functionality works in all supported browsers
2. Modern features enhance the experience in newer browsers
3. Service workers provide offline capabilities where supported
4. Graceful degradation for unsupported features
