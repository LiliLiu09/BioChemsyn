import Link from "@/components/LocaleLink";
import { AdminShell } from "@/components/AdminShell";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getPageViewStats } from "@/lib/analytics";
import { getLocale } from "@/lib/locale-server";
import { localizePath, translate } from "@/lib/i18n";
import { redirect } from "next/navigation";

export default async function AdminAnalyticsPage() {
  const locale = await getLocale();
  const t = (zh: string, en: string) => translate(locale, zh, en);
  if (!(await isAdminAuthed())) {
    redirect(localizePath("/admin/login", locale));
  }

  const stats = await getPageViewStats();
  const maxDailyViews = Math.max(...stats.daily.map((item) => item.views), 1);

  return (
    <AdminShell>
      <div className="toolbar">
        <div>
          <h1>{t("网站浏览量", "Website analytics")}</h1>
          <p className="admin-subtitle">{t("按页面和日期汇总，不保存访客 IP 或其他个人信息。", "Aggregated by page and date. No visitor IP addresses or personal data are stored.")}</p>
        </div>
      </div>

      <div className="stats analytics-stats">
        <div className="stat"><b>{stats.today.toLocaleString()}</b><span>{t("今日浏览量", "Today")}</span></div>
        <div className="stat"><b>{stats.last7Days.toLocaleString()}</b><span>{t("近 7 天", "Last 7 days")}</span></div>
        <div className="stat"><b>{stats.last30Days.toLocaleString()}</b><span>{t("近 30 天", "Last 30 days")}</span></div>
        <div className="stat"><b>{stats.total.toLocaleString()}</b><span>{t("累计浏览量", "All time")}</span></div>
      </div>

      <section className="panel admin-panel analytics-panel">
        <h2>{t("最近 30 天趋势", "Last 30 days")}</h2>
        {stats.daily.length === 0 ? (
          <p className="empty-state">{t("部署新版本后将开始记录浏览量。", "Page views will appear after this version is deployed.")}</p>
        ) : (
          <div className="analytics-bars" aria-label={t("最近 30 天每日浏览量", "Daily page views over the last 30 days")}>
            {stats.daily.map((item) => (
              <div className="analytics-bar-item" key={item.date} title={`${item.date}: ${item.views}`}>
                <b>{item.views}</b>
                <span className="analytics-bar" style={{ height: `${Math.max(4, Math.round((item.views / maxDailyViews) * 150))}px` }} />
                <time dateTime={item.date}>{item.date.slice(5)}</time>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel admin-panel analytics-panel">
        <h2>{t("近 30 天热门页面", "Top pages in the last 30 days")}</h2>
        {stats.topPaths.length === 0 ? (
          <p className="empty-state">{t("暂无浏览数据。", "No page-view data yet.")}</p>
        ) : (
          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead><tr><th>{t("页面", "Page")}</th><th>{t("浏览量", "Views")}</th></tr></thead>
              <tbody>
                {stats.topPaths.map((item) => (
                  <tr key={item.path}>
                    <td><Link href={item.path}>{item.path}</Link></td>
                    <td>{item.views.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
