const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function getToken(isAccessToken = true) {
  return localStorage.getItem(isAccessToken ? ACCESS_TOKEN_KEY : REFRESH_TOKEN_KEY);
}

export function setToken(token, isAccessToken = true) {
  return localStorage.setItem(isAccessToken ? ACCESS_TOKEN_KEY : REFRESH_TOKEN_KEY, token);
}

export function removeToken(isAccessToken = true) {
  return localStorage.removeItem(isAccessToken ? ACCESS_TOKEN_KEY : REFRESH_TOKEN_KEY);
}
