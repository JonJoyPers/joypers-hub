import PQueue from 'p-queue';

const DEPUTY_BASE_URL = process.env.DEPUTY_BASE_URL!;
const DEPUTY_TOKEN = process.env.DEPUTY_TOKEN!;
const PAGE_SIZE = 500;

// Rate limit: 200 req/min → 1 request per 300ms
const queue = new PQueue({ concurrency: 1, interval: 300, intervalCap: 1 });

interface QueryOptions {
  search?: Record<string, any>;
  sort?: Record<string, 'asc' | 'desc'>;
  start?: number;
  max?: number;
}

async function request(method: string, path: string, body?: any): Promise<any> {
  const url = `${DEPUTY_BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${DEPUTY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Deputy API ${res.status}: ${text} (${method} ${path})`);
  }

  return res.json();
}

export async function queryResource(
  resource: string,
  options: QueryOptions = {},
): Promise<any[]> {
  return queue.add(async () => {
    const body: any = {};
    if (options.search) body.search = options.search;
    if (options.sort) body.sort = options.sort;
    if (options.start !== undefined) body.start = options.start;
    body.max = options.max ?? PAGE_SIZE;

    return request('POST', `/resource/${resource}/QUERY`, body);
  }) as Promise<any[]>;
}

export async function fetchAllPages(
  resource: string,
  search?: Record<string, any>,
): Promise<any[]> {
  const all: any[] = [];
  let start = 0;

  while (true) {
    const page = await queryResource(resource, { search, start, max: PAGE_SIZE });
    if (!page || page.length === 0) break;
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    start += PAGE_SIZE;
  }

  console.log(`  Fetched ${all.length} ${resource} records`);
  return all;
}

export async function getResource(resource: string, id: number): Promise<any> {
  return queue.add(() => request('GET', `/resource/${resource}/${id}`));
}
