
// Geolocation utility with improved IP parsing and reliable services

export async function getGeolocation(ip: string): Promise<{ country?: string; city?: string }> {
  try {
    // Parse IP from complex string
    const cleanIP = parseIP(ip);
    
    if (!cleanIP) {
      return {};
    }

    // Try primary service first
    try {
      const result = await tryIPAPIService(cleanIP);
      if (result.country || result.city) {
        console.log(`Geolocation success: ${result.country}, ${result.city}`);
        return result;
      }
    } catch (error) {
      // Silently try backup service
    }

    // Try backup service
    try {
      const result = await tryFreeGeoIPService(cleanIP);
      if (result.country || result.city) {
        console.log(`Geolocation success: ${result.country}, ${result.city}`);
        return result;
      }
    } catch (error) {
      // No geolocation available
    }

  } catch (error) {
    // Continue without geolocation
  }
  
  return {};
}

function parseIP(ipString: string): string | null {
  if (!ipString) return null;
  
  // Split by comma and get unique IPs
  const ips = ipString.split(',').map(ip => ip.trim()).filter(Boolean);
  
  // IPv4 regex pattern
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  // Find first valid IPv4 address
  for (const ip of ips) {
    if (ipv4Regex.test(ip)) {
      // Additional validation: check if octets are in valid range (0-255)
      const octets = ip.split('.').map(Number);
      if (octets.every(octet => octet >= 0 && octet <= 255)) {
        return ip;
      }
    }
  }
  
  return null;
}

async function tryIPAPIService(ip: string): Promise<{ country?: string; city?: string }> {
  const response = await fetch(`https://ipapi.co/${ip}/json/`, {
    headers: {
      'User-Agent': 'Supabase-Edge-Function/1.0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`ipapi.co returned status: ${response.status}`);
  }
  
  const data = await response.json();
  
  // ipapi.co returns different field names
  return {
    country: data.country_name || null,
    city: data.city || null
  };
}

async function tryFreeGeoIPService(ip: string): Promise<{ country?: string; city?: string }> {
  const response = await fetch(`https://freegeoip.app/json/${ip}`, {
    headers: {
      'User-Agent': 'Supabase-Edge-Function/1.0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`freegeoip.app returned status: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    country: data.country_name || null,
    city: data.city || null
  };
}
