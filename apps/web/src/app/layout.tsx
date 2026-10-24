import './globals.css';
import '@fontsource-variable/vazirmatn';
import './workspace.css';
import type {Metadata} from 'next';
const siteUrl=process.env.NEXT_PUBLIC_SITE_URL;
export const metadata:Metadata = {
 metadataBase:siteUrl?new URL(siteUrl):undefined,
 title:{default:'AgriTrade | ارتباط کشاورزان، تأمین‌کنندگان و تجار',template:'%s | AgriTrade'},
 description:'محصول کشاورزی خود را معرفی کنید، موجودی را مدیریت کنید و تأمین‌کنندگان تأییدشده را پیدا کنید. فضای کاری کشاورزان و تجار در AgriTrade.',
 applicationName:'AgriTrade',
 ...(siteUrl?{alternates:{canonical:'/'}}:{}),
 openGraph:{type:'website',locale:'fa_IR',siteName:'AgriTrade',title:'AgriTrade | از زمین تا فرصت‌های تازه',description:'فضای کاری کشاورزان و تجار برای معرفی محصول، مدیریت موجودی و یافتن تأمین‌کنندگان تأییدشده.',...(siteUrl?{url:siteUrl}:{})},
 twitter:{card:'summary_large_image',title:'AgriTrade | Agriculture & opportunity',description:'A shared workspace for farmers and traders.'},
};
export default function Layout({children}:{children:React.ReactNode}) {
  // Browser extensions can add root attributes before React hydrates.
  // Suppression applies only to this element; child hydration checks remain enabled.
  return <html lang="fa" dir="rtl" suppressHydrationWarning><body>{children}</body></html>;
}
