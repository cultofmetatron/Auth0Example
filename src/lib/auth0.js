import Auth0 from 'react-native-auth0';

const AUTH0_DOMAIN = 'auth0-login-example.auth0.com';
const CLIENT_ID = 'cZXbmzjn5vnMjZzwxhFc4foDWU1Wq4AA';

const auth0 = new Auth0({
  domain: `${AUTH0_DOMAIN}`,
  clientId: `${CLIENT_ID}` 
});

export {
  auth0,
  AUTH0_DOMAIN,
  CLIENT_ID
};