import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./e2e',workers:1,timeout:45000,use:{baseURL:process.env.E2E_BASE_URL||'http://127.0.0.1:3100',channel:'chrome',headless:true,actionTimeout:10000,navigationTimeout:20000,trace:'retain-on-failure'},reporter:'list'});
