import { test, expect } from '@playwright/test';

test.describe('PWA Core Features', () => {
  
  test('PWA manifest.json is accessible and valid', async ({ request }) => {
    const response = await request.get('/manifest.json');
    expect(response.status()).toBe(200);
    
    const manifest = await response.json();
    
    // Validate required PWA manifest fields
    expect(manifest.name).toBe('BITZ Club');
    expect(manifest.short_name).toBe('BITZ Club');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.background_color).toBe('#0F0F10');
    expect(manifest.theme_color).toBe('#D4AF37');
    
    // Validate icons exist
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(1);
    
    // Check for required icon sizes for PWA installability
    const iconSizes = manifest.icons.map((icon: any) => icon.sizes);
    expect(iconSizes).toContain('192x192');
    expect(iconSizes).toContain('512x512');
  });

  test('Service worker file is accessible', async ({ request }) => {
    const response = await request.get('/sw.js');
    expect(response.status()).toBe(200);
    
    const swContent = await response.text();
    
    // Verify service worker contains essential code
    expect(swContent).toContain('CACHE_NAME');
    expect(swContent).toContain('addEventListener');
    expect(swContent).toContain('fetch');
  });

  test('PWA icons are accessible', async ({ request }) => {
    // Test key icon files
    const icons = [
      '/icons/icon-72x72.png',
      '/icons/icon-96x96.png',
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png',
      '/icons/apple-touch-icon.png'
    ];

    for (const icon of icons) {
      const response = await request.get(icon);
      expect(response.status(), `Icon ${icon} should be accessible`).toBe(200);
      expect(response.headers()['content-type']).toContain('image/png');
    }
  });

  test('HTML has correct PWA meta tags', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Check theme-color meta tag
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBe('#D4AF37');
    
    // Check manifest link
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestLink).toContain('manifest.json');
    
    // Check apple-mobile-web-app-capable
    const appleMobileCapable = await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content');
    expect(appleMobileCapable).toBe('yes');
    
    // Check apple-mobile-web-app-title
    const appleTitle = await page.locator('meta[name="apple-mobile-web-app-title"]').getAttribute('content');
    expect(appleTitle).toBe('BITZ Club');
  });

  test('Service worker registration works in browser', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Wait for SW registration (give it time to register)
    await page.waitForTimeout(3000);
    
    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);
  });
});
