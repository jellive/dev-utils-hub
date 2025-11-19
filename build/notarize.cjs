// Notarization placeholder for development builds
// For production releases, configure with Apple ID and app-specific password
// See: https://www.electron.build/configuration/mac#how-to-notarize-app

module.exports = async function notarize(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  console.log('⚠️  Skipping notarization in development mode');
  console.log('   For production builds, configure APPLE_ID and APPLE_ID_PASSWORD');

  // Skip notarization in development
  return;
};
