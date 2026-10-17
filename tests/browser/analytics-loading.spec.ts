import {test,expect} from '@playwright/test';

test('native analytics needs no Studio chunk; keyboard activation defers the large module and preserves records',async({page,request})=>{
  await request.post('/api/workspace',{data:{type:'reset'}});
  await request.post('/api/workspace',{data:{type:'seedOverdue'}});
  const before=await(await request.get('/api/workspace')).json();
  const requested:string[]=[],writes:string[]=[],scripts:Promise<{url:string;bytes:number}>[]=[];
  page.on('request',req=>{requested.push(req.url());if(req.method()!=='GET')writes.push(req.method());});
  page.on('response',response=>{if(new URL(response.url()).pathname.endsWith('.js'))scripts.push(response.body().then(body=>({url:response.url(),bytes:body.length})));});
  const initial=new Set<string>();let holding=false;let release=()=>{};
  const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/_next/static/**',async route=>{
    if(holding && new URL(route.request().url()).pathname.endsWith('.js') && !initial.has(route.request().url()))await gate;
    await route.continue();
  });
  await page.goto('/analytics');
  const load=page.getByRole('button',{name:'Load interactive reports',exact:true});
  await expect(load).toHaveAttribute('aria-expanded','false');
  await expect(page.getByRole('region',{name:'AG Studio report builder'})).toHaveCount(0);
  await page.getByText('Read complete snapshot as tables',{exact:true}).click();
  await expect(page.getByRole('table',{name:'Invoice records · USD'})).toContainText('$800.00');
  requested.forEach(url=>initial.add(url));holding=true;
  await load.focus();await page.keyboard.press('Enter');
  const enabled=page.getByRole('button',{name:'Interactive reports enabled',exact:true});
  try {
    await expect(enabled).toBeFocused();await expect(enabled).toHaveAttribute('aria-expanded','true');
    await expect(page.getByRole('status').filter({hasText:'Loading interactive reports. The snapshot tables remain available.'})).toBeVisible();
    await expect(page.getByRole('table',{name:'Invoice records · USD'})).toBeVisible();
  } finally {release();}
  await expect(page.locator('.ag-studio-layout-widget').first()).toBeVisible({timeout:30000});
  const large=(await Promise.all(scripts)).filter(script=>script.bytes>1000000);
  expect(large.length).toBeGreaterThan(0);expect(large.every(script=>!initial.has(script.url))).toBe(true);
  await page.getByRole('button',{name:'Edit report layout',exact:true}).click();
  await expect(page.getByRole('button',{name:'Finish editing layout',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Refresh local snapshot',exact:true}).click();
  await expect(page.getByRole('button',{name:'Finish editing layout',exact:true})).toBeVisible();
  expect(await(await request.get('/api/workspace')).json()).toEqual(before);expect(writes).toEqual([]);
});

test('failed deferred report download keeps tables and offers a genuine reload retry',async({page,request})=>{
  await request.post('/api/workspace',{data:{type:'reset'}});
  const before=await(await request.get('/api/workspace')).json();
  let fail=false;const initial=new Set<string>();
  await page.route('**/_next/static/**',route=>{
    const url=route.request().url();
    if(fail && new URL(url).pathname.endsWith('.js') && !initial.has(url))return route.abort('failed');
    initial.add(url);return route.continue();
  });
  await page.goto('/analytics');await expect(page.getByRole('button',{name:'Load interactive reports',exact:true})).toBeVisible();
  fail=true;await page.getByRole('button',{name:'Load interactive reports',exact:true}).click();
  await expect(page.getByRole('region',{name:'AG Studio report builder'}).getByRole('alert')).toContainText('Interactive reports could not load.');
  await page.getByText('Read complete snapshot as tables',{exact:true}).click();
  await expect(page.getByRole('table',{name:'Invoice records · USD'})).toBeVisible();
  fail=false;await page.getByRole('link',{name:'Reload page to retry reports',exact:true}).click();
  await expect(page.getByRole('button',{name:'Load interactive reports',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Load interactive reports',exact:true}).click();
  await expect(page.locator('.ag-studio-layout-widget').first()).toBeVisible({timeout:30000});
  expect(await(await request.get('/api/workspace')).json()).toEqual(before);
});
