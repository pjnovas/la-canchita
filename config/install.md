
npm install sails -g

** if asks for newer npm
npm install -g npm

sails new project_name
cd project_name
sails lift

check if is ok at browser

npm install sails-mongo --save


npm install sails-generate-auth --save
sails generate auth

** more at https://github.com/kasperisager/sails-generate-auth

--------------
at config/routes.js

'get /login': 'AuthController.login',
'get /logout': 'AuthController.logout',
'get /register': 'AuthController.register',

'post /auth/local': 'AuthController.callback',
'post /auth/local/:action': 'AuthController.callback',

'get /auth/:provider': 'AuthController.provider',
'get /auth/:provider/callback': 'AuthController.callback',
'get /auth/:provider/:action': 'AuthController.callback',

--------------
at config/bootstrap.js

sails.services.passport.loadStrategies();

--------------
at config/policies.js

'*': ['passport', 'sessionAuth'],

'auth': {
  '*': ['passport']
}

--------------

npm install passport bcryptjs validator passport-local passport-http-bearer passport-twitter passport-facebook --save

sails lift
