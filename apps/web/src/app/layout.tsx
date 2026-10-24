import './globals.css';
import '@fontsource-variable/vazirmatn';
import './workspace.css';
export const metadata = {title:'BRICS AgriTrade | تجارت کشاورزی',description:'Private agricultural inventory workspace'};
export default function Layout({children}:{children:React.ReactNode}) {
  // Browser extensions can add root attributes before React hydrates.
  // Suppression applies only to this element; child hydration checks remain enabled.
  return <html lang="fa" dir="rtl" suppressHydrationWarning><body>{children}</body></html>;
}
