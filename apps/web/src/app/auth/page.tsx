import type {Metadata} from 'next';
import AuthForm from './auth-form';
export const metadata:Metadata={title:'ورود و ثبت‌نام',robots:{index:false,follow:false},alternates:{canonical:null}};
export default function AuthPage(){return <AuthForm/>;}
