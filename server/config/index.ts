interface Config {
  port: number;
  jwt: {
    secret: string;
    expiresIn: string | number;
  };
  msg91: {
    authKey: string;
    templateId: string;
    emailDomain: string;
  };
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

export const config: Config = {
  port: Number(process.env.PORT?.trim() || 3001),
  jwt: {
    secret: process.env.JWT_SECRET?.trim() || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN?.trim() || '7d',
  },
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY?.trim() || '',
    templateId: process.env.MSG91_TEMPLATE_ID?.trim() || '',
    emailDomain: process.env.MSG91_EMAIL_DOMAIN?.trim() || '',
  },
  supabase: {
    url: process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim() || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '',
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
  },
};
