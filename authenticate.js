const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const FacebookPassportStrategy = require('passport-facebook-token');

const config = require('./config');
const User = require('./models/user');

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = (user) => {
  return jwt.sign(user, config.secretKey, {expiresIn: 3600});
};

let opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
  console.log('jwt_payload: ', jwt_payload);
  User.findOne({_id: jwt_payload._id}, (err, user) => {
    if(err){
      return done(err, false);
    } else if(user){
      return done(null, user);
    } else {
      return done(null, false);
    }
  });
}));

exports.verifyUser = passport.authenticate('jwt', {session: false});

exports.verifyAdmin = function(req, res, next) {
  console.log();
    if (req.user.admin){
      return next();
    } else {
      let err = new Error('Only administrators are authorized to perform this operation.');
      err.status = 403;
      return next(err);
    }
};

exports.FacebookPassport = passport.use(new FacebookPassportStrategy({
  clientID: config.facebook.clientId,
  clientSecret: config.facebook.clientSecret
}, (accessToken, refreshToken, profile, done) => {
  User.findOne({facebookId: profile.id}, (err, user) => {
    if(err){
      return done(err, false);
    } else if(!err && user !== null){
      return done(null, user)
    } else {
      user = new User({username: profile.displayName});
      user.facebookId = profile.id
      user.firstname = profile.name.givenName;
      user.lastname = profile.name.familyName;
      user.save((err, user) => {
        if(err){
          return done(err, false);
        } else {
          return done(null, user);
        }
      });
    }
  });
}));