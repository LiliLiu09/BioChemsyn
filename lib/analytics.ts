import { dbQuery, hasDatabaseUrl } from "./db";

const siteDate = "(now() at time zone 'Australia/Perth')::date";

export type PageViewDaily = {
  date: string;
  views: number;
};

export type PageViewPath = {
  path: string;
  views: number;
};

export type PageViewStats = {
  total: number;
  today: number;
  last7Days: number;
  last30Days: number;
  daily: PageViewDaily[];
  topPaths: PageViewPath[];
};

const emptyStats: PageViewStats = {
  total: 0,
  today: 0,
  last7Days: 0,
  last30Days: 0,
  daily: [],
  topPaths: []
};

export async function recordPageView(path: string) {
  if (!hasDatabaseUrl()) return false;

  await dbQuery(
    `insert into public.page_views_daily (view_date, path, views, updated_at)
     values (${siteDate}, $1, 1, now())
     on conflict (view_date, path) do update set
       views = public.page_views_daily.views + 1,
       updated_at = now()`,
    [path]
  );
  return true;
}

export async function getPageViewStats(): Promise<PageViewStats> {
  if (!hasDatabaseUrl()) return emptyStats;

  const [summaryRows, dailyRows, pathRows] = await Promise.all([
    dbQuery<{ total: string; today: string; last_7_days: string; last_30_days: string }>(
      `select
         coalesce(sum(views), 0)::bigint as total,
         coalesce(sum(views) filter (where view_date = ${siteDate}), 0)::bigint as today,
         coalesce(sum(views) filter (where view_date >= ${siteDate} - 6), 0)::bigint as last_7_days,
         coalesce(sum(views) filter (where view_date >= ${siteDate} - 29), 0)::bigint as last_30_days
       from public.page_views_daily`
    ),
    dbQuery<{ date: string | Date; views: string }>(
      `select view_date as date, sum(views)::bigint as views
       from public.page_views_daily
       where view_date >= ${siteDate} - 29
       group by view_date
       order by view_date asc`
    ),
    dbQuery<{ path: string; views: string }>(
      `select path, sum(views)::bigint as views
       from public.page_views_daily
       where view_date >= ${siteDate} - 29
       group by path
       order by views desc, path asc
       limit 20`
    )
  ]);

  const summary = summaryRows[0];
  return {
    total: Number(summary?.total || 0),
    today: Number(summary?.today || 0),
    last7Days: Number(summary?.last_7_days || 0),
    last30Days: Number(summary?.last_30_days || 0),
    daily: dailyRows.map((row) => ({
      date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date).slice(0, 10),
      views: Number(row.views || 0)
    })),
    topPaths: pathRows.map((row) => ({ path: row.path, views: Number(row.views || 0) }))
  };
}
