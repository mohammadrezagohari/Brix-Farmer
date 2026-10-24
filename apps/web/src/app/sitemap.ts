import type {MetadataRoute} from 'next';
export default function sitemap():MetadataRoute.Sitemap {
 const base=process.env.NEXT_PUBLIC_SITE_URL;
 return base?[{url:new URL('/',base).href,changeFrequency:'monthly',priority:1}]:[];
}
