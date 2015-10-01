/**
 * Base file for environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

  // Rename this file into the environment name (like development).
  // And set the configs

  log: {
    level: 'verbose'
  },

  connections : {
     mongo: {
      adapter: 'sails-mongo',
      host: 'localhost',
      port: 27017,
      database: 'lacanchita'
    },
  },

  models: {
    connection: 'mongo',
    migrate: 'alter'
  },

  session: {
    secret: 'xxxxxxxx',

    adapter: 'mongo',
    host: 'localhost',
    port: 27017,
    db: 'lacanchita-sessions',
    collection: 'sessions'
  },

  sockets: {
    // check config/sockets.js for more options
    //transports: ["polling", "websocket"]
  },

  email: {
    service: 'Hotmail',
    auth: {
      user: 'test@hotmail.com',
      pass: 'password'
    },
    templateDir:  'views/email',
    from: 'noreply@la-canchita.com',
    testMode: true
  },

  passport: {

    local: {
      strategy: require('passport-local').Strategy
    },

    twitter: {
      name: 'Twitter',
      protocol: 'oauth',
      strategy: require('passport-twitter').Strategy,
      options: {
        consumerKey: 'your-customer-key',
        consumerSecret: 'your-customer-secret'
      }
    },

    github: {
      name: 'GitHub',
      protocol: 'oauth2',
      strategy: require('passport-github').Strategy,
      options: {
        clientID: 'your-client-id',
        clientSecret: 'your-client-secret'
      }
    },

    facebook: {
      name: 'Facebook',
      protocol: 'oauth2',
      strategy: require('passport-facebook').Strategy,
      options: {
        clientID: 'your-client-id',
        clientSecret: 'your-client-secret'
        scope: ['email'] // email is necessary for login behavior
      }
    },

    google: {
      name: 'Google',
      protocol: 'oauth2',
      strategy: require('passport-google-oauth').OAuth2Strategy,
      options: {
        clientID: 'your-client-id',
        clientSecret: 'your-client-secret'
        scope: [
          'https://www.googleapis.com/auth/plus.login',
          'https://www.googleapis.com/auth/plus.profile.emails.read'
        ]
      }
    }

  }


};
