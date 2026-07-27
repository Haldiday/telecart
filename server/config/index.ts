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
  port: Number(process.env.PORT || 3001),
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: '7d',
  },
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY || '',
    templateId: process.env.MSG91_TEMPLATE_ID || '',
    emailDomain: process.env.MSG91_EMAIL_DOMAIN || '',
  },
  supabase: {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
  },
};
