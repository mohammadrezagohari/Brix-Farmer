'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main dir="rtl"><h1>بارگذاری این صفحه انجام نشد</h1><p>لطفاً دوباره تلاش کنید.</p><button onClick={reset}>تلاش دوباره</button><a href="/"> بازگشت به خانه</a></main>;}
