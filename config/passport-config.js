const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const pool = require('../db-config');

module.exports = function(passport) {
    passport.use(new LocalStrategy(
        { usernameField: 'email' },
        async (email, password, done) => {
            try {
                // Check if user exists
                const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
                const user = result.rows[0];

                if (!user) {
                    return done(null, false, { message: 'No user with that email' });
                }

                // Check password
                const isMatch = await bcrypt.compare(password, user.password);

                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Password incorrect' });
                }
            } catch (error) {
                return done(error);
            }
        }
    ));
};
