const passport = require('passport');
const GoogleStrategy =
  require('passport-google-oauth20').Strategy;
const User = require('../Models/userModel');

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        'http://localhost:3000/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Debug: Log profile information
        console.log('Google Profile:', profile);

        const email = profile.emails?.[0]?.value;

        if (!email) {
          console.log(
            'Error: Google profile does not have an email address',
          );
          return done(
            new Error(
              'Google profile does not have an email address',
            ),
            null,
          );
        }

        let user = await User.findOne({ email });

        if (!user) {
          console.log(
            `Creating new user with email: ${email}`,
          );
          user = await User.create({
            googleId: profile.id,
            email,
            name: `${profile.name.givenName} ${profile.name.familyName}`,
            role: 'user',
          });
        } else {
          console.log(`User found: ${user.name}`);
        }

        return done(null, user);
      } catch (error) {
        console.error('Error in GoogleStrategy:', error);
        return done(error, null);
      }
    },
  ),
);

// Serialize user
passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id); // Debug: log the user being serialized
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    console.log('Deserializing user ID:', id); // Debug: log the user ID being deserialized
    const user = await User.findById(id);
    if (!user) {
      console.log('Error: User not found');
      return done(new Error('User not found'), null);
    }
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});

module.exports = passport;
