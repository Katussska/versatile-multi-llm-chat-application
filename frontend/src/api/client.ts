import type { paths } from './generated/schema';
import createFetchClient from 'openapi-fetch';
import createClient from 'openapi-react-query';

const baseUrl = import.meta.env.VITE_API_BASE_URL;

if (!baseUrl) {
  throw new Error(
    'VITE_API_BASE_URL is not defined. Set it to your backend API base URL, e.g. http://localhost:3000.',
  );
}

const fetchClient = createFetchClient<paths>({
  baseUrl,
  credentials: 'include',
});

export const $api = createClient(fetchClient);
