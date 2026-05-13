/**
 * Utility to build clean URLs without double slashes or duplicated domains.
 */
export function buildPublicUrl(relativePath: string): string {
  if (!relativePath) return '';

  // If it's already an absolute URL, return it as is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    // Check if the domain is duplicated (e.g. https://domain.comhttps://domain.com or https://domain.com/https://domain.com)
    const baseUrl = process.env.API_BASE_URL || '';
    if (baseUrl) {
      // Remove protocol from baseUrl for matching
      const baseUrlNoProtocol = baseUrl.replace(/^https?:\/\//, '');
      const pattern = new RegExp(`(https?://)?${baseUrlNoProtocol}/?(https?://)?${baseUrlNoProtocol}`, 'g');
      
      if (pattern.test(relativePath)) {
        // Ensure baseUrl has protocol for replacement
        const fullBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
        const cleanBaseUrl = fullBaseUrl.endsWith('/') ? fullBaseUrl.slice(0, -1) : fullBaseUrl;
        
        // This is a bit complex, simpler way: if it starts with the duplication, fix it
        if (relativePath.includes(`${cleanBaseUrl}${cleanBaseUrl}`)) {
            return relativePath.replace(`${cleanBaseUrl}${cleanBaseUrl}`, cleanBaseUrl);
        }
        if (relativePath.includes(`${cleanBaseUrl}/${cleanBaseUrl}`)) {
            return relativePath.replace(`${cleanBaseUrl}/${cleanBaseUrl}`, cleanBaseUrl);
        }
      }
    }
    return relativePath;
  }

  let baseUrl = process.env.API_BASE_URL || '';
  
  if (!baseUrl) {
    return relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  }

  // Ensure baseUrl has protocol
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }

  // Ensure baseUrl doesn't have a trailing slash
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // Ensure relativePath starts with a slash
  const cleanRelativePath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  return `${cleanBaseUrl}${cleanRelativePath}`;
}
