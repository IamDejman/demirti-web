import useSWR from 'swr';

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((res) => {
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
});

export function useFetch(key, options = {}) {
  return useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
    ...options,
  });
}
