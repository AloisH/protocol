import { auth } from '../../features/auth/auth-config';

export default defineEventHandler(async (event) => {
  return auth.handler(toWebRequest(event));
});
