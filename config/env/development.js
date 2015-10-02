/**
 * Development environment settings
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
    secret: '0832b6e8c615489e87c45a9c3a9a98e4',

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
      user: 'djdxes@hotmail.com',
      pass: 'nBm0g1f1'
    },
    templateDir:  'views/email',
    from: 'noreply@la-canchita.com',
    testMode: true
  },

  jobs: {
    "jobsDirectory": "api/jobs",

    "db": {
      "address"    : "localhost:27017/jobs",
      "collection" : "agendaJobs"
    },
    
    "name": "process name",
    "processEvery": "10 seconds",
    "maxConcurrency": 20,
    "defaultConcurrency": 5,
    "defaultLockLifetime": 10000
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
        consumerKey: 'RGhiVGXOQJAuR4OFDbtcQ',
        consumerSecret: '6hGT8OipIyBjjYedTF4hQMDRWaGiYqG2W2jBlh1dz0'
      }
    },

    facebook: {
      name: 'Facebook',
      protocol: 'oauth2',
      strategy: require('passport-facebook').Strategy,
      options: {
        clientID: '816845671761489',
        clientSecret: '1e2945591b264d70516297603429b312',
        scope: ['email']
      }
    },

    google: {
      name: 'Google',
      protocol: 'oauth2',
      strategy: require('passport-google-oauth').OAuth2Strategy,
      options: {
        clientID: '688294781590-ufgr2p2tmja0go4iq2ma8n0eqpivdicq.apps.googleusercontent.com',
        clientSecret: 'FKeHZK0b1r4NS0QeRPJvpCi8',
        scope: [
          'https://www.googleapis.com/auth/plus.login',
          'https://www.googleapis.com/auth/plus.profile.emails.read'
        ]
      }
    }

  }


};
