export const validateEnv = () => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret || jwtSecret.trim() === '') {
    console.error('FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is missing.');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    if (jwtSecret.length < 32 || jwtSecret.includes('your_jwt_secret') || jwtSecret.includes('change_in_production')) {
      console.error('FATAL CONFIGURATION ERROR: Insecure JWT_SECRET detected in production. Must be at least 32 characters and not a placeholder.');
      process.exit(1);
    }
  }

  return {
    PORT: process.env.PORT || 5001,
    JWT_SECRET: jwtSecret,
    NODE_ENV: process.env.NODE_ENV || 'development',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173'
  };
};
