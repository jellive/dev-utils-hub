import { useState, useEffect } from 'react';
import type { QueryParam } from '../components/QueryParamsEditor';

export function useQueryParamsSync(externalUrl: string) {
  const [url, setUrl] = useState(externalUrl);
  const [params, setParams] = useState<QueryParam[]>([]);

  // Sync with external URL changes
  useEffect(() => {
    if (externalUrl !== url) {
      setUrl(externalUrl);
    }
  }, [externalUrl]);

  // Parse query parameters from URL
  const parseParamsFromUrl = (urlString: string): QueryParam[] => {
    if (!urlString) return [];

    try {
      // Handle URLs without protocol
      const urlToParse = urlString.startsWith('http')
        ? urlString
        : `https://${urlString}`;

      const urlObj = new URL(urlToParse);
      const searchParams = new URLSearchParams(urlObj.search);

      const parsedParams: QueryParam[] = [];
      searchParams.forEach((value, key) => {
        parsedParams.push({ key, value });
      });

      return parsedParams;
    } catch (error) {
      // If URL parsing fails, try to extract query string manually
      const queryStart = urlString.indexOf('?');
      if (queryStart === -1) return [];

      const queryString = urlString.substring(queryStart + 1);
      const searchParams = new URLSearchParams(queryString);

      const parsedParams: QueryParam[] = [];
      searchParams.forEach((value, key) => {
        parsedParams.push({ key, value });
      });

      return parsedParams;
    }
  };

  // Build URL from base URL and params
  const buildUrlFromParams = (baseUrl: string, queryParams: QueryParam[]): string => {
    if (!baseUrl) return '';

    try {
      // Handle URLs without protocol
      const urlToParse = baseUrl.startsWith('http')
        ? baseUrl
        : `https://${baseUrl}`;

      const urlObj = new URL(urlToParse);

      // Clear existing search params
      urlObj.search = '';

      // Filter out params with empty keys and add valid ones
      const validParams = queryParams.filter(p => p.key.trim() !== '');

      if (validParams.length > 0) {
        const searchParams = new URLSearchParams();
        validParams.forEach(param => {
          searchParams.append(param.key, param.value);
        });
        urlObj.search = searchParams.toString();
      }

      return urlObj.toString();
    } catch (error) {
      // If URL parsing fails, build manually
      const baseWithoutQuery = baseUrl.split('?')[0];

      const validParams = queryParams.filter(p => p.key.trim() !== '');
      if (validParams.length === 0) return baseWithoutQuery;

      const searchParams = new URLSearchParams();
      validParams.forEach(param => {
        searchParams.append(param.key, param.value);
      });

      return `${baseWithoutQuery}?${searchParams.toString()}`;
    }
  };

  // Update params when URL changes (URL → Params)
  useEffect(() => {
    const newParams = parseParamsFromUrl(url);
    setParams(newParams);
  }, [url]);

  // Custom setParams that also updates URL (Params → URL)
  const updateParams = (newParams: QueryParam[]) => {
    setParams(newParams);
    const newUrl = buildUrlFromParams(url, newParams);
    setUrl(newUrl);
  };

  return {
    url,
    setUrl,
    params,
    setParams: updateParams
  };
}
