Zoho refresh response: {
  access_token: '1000.be3d6f677994536b7eeb7fe82cb221db.e1fb08b6e31f590935da882d605890c9',
  scope: 'ZohoInventory.fullaccess.all',
  api_domain: 'https://www.zohoapis.in',
  token_type: 'Bearer',
  expires_in: 3600
}
Zoho token initialized successfully
[Nest] 17280  - 12/03/2026, 5:28:08 pm     LOG [NestApplication] Nest application successfully started +618ms
Starting Zoho product sync...
Fetched page 1 items: 0
Zoho product sync completed
Starting Zoho product sync...
Fetched page 1 items: 0
Zoho product sync completed
Starting Zoho product sync...
Zoho refresh response: {
  access_token: '1000.cbdab4b34e4f0a5033037cceeb2618e6.00cf3299b2040b0b6ced7b70d0751d9a',
  scope: 'ZohoInventory.fullaccess.all',
  api_domain: 'https://www.zohoapis.in',
  token_type: 'Bearer',
  expires_in: 3600
}
Zoho product sync failed: TypeError: fetch failed
    at node:internal/deps/undici/undici:13510:13
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async ProductsService.syncZohoProducts (C:\Users\HP\Downloads\TCBT\Server\src\products\products.service.ts:33:26)  
    at async CronJob.<anonymous> (C:\Users\HP\Downloads\TCBT\Server\node_modules\@nestjs\schedule\dist\schedule.explorer.js:119:17) {
  [cause]: Error: getaddrinfo ENOTFOUND www.zohoapis.in
      at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26) {
    errno: -3008,
    code: 'ENOTFOUND',
    syscall: 'getaddrinfo',
    hostname: 'www.zohoapis.in'
  }
}

api is working fine but no data is showing when I hit this api http://localhost:3000/products

