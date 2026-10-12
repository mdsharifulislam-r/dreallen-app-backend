import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

const spacesConfigWarnings: string[] = [];

const readSpacesEnv = (name: string): string | undefined => {
  const rawValue = process.env[name];
  if (rawValue === undefined) return undefined;

  let value = rawValue;
  if (value !== value.trim()) {
    spacesConfigWarnings.push(
      `${name} contains surrounding whitespace; it was trimmed.`
    );
    value = value.trim();
  }

  const firstCharacter = value[0];
  const lastCharacter = value[value.length - 1];
  if (firstCharacter === '"' || firstCharacter === "'") {
    if (lastCharacter !== firstCharacter || value.length < 2) {
      spacesConfigWarnings.push(
        `${name} contains unmatched surrounding quotes; check its environment value.`
      );
    } else {
      spacesConfigWarnings.push(
        `${name} contains surrounding quotes; they were removed.`
      );
      value = value.slice(1, -1).trim();
    }
  }

  return value;
};

const spacesRegion = readSpacesEnv('SPACES_REGION');

const config = {
  ip_address: process.env.IP_ADDRESS,
  database_url: process.env.DATABASE_URL,
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  front_end_app_url: process.env.FRONTEND_URL,  
  jwt: {
    jwt_secret: process.env.JWT_SECRET,
    jwt_expire_in: process.env.JWT_EXPIRE_IN,
  },
  email: {
    from: process.env.EMAIL_FROM,
    user: process.env.EMAIL_USER,
    port: process.env.EMAIL_PORT,
    host: process.env.EMAIL_HOST,
    pass: process.env.EMAIL_PASS,
  },
  super_admin: {
    email: process.env.SUPER_ADMIN_EMAIL,
    password: process.env.SUPER_ADMIN_PASSWORD,
  },
  stripe: {
    public_key: process.env.STRIPE_PUBLIC_KEY,
    secret_key: process.env.STRIPE_SECREAT_KEY,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  shopify: {
    domain: process.env.SHOPIFY_DOMAIN,
    storefront_access_token: process.env.SHOPIFY_STORE_FRONT_ACCESS_TOKEN,
    admin_access_token: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  },
  aws:{
    access_key_id: process.env.AWS_ACCESS_KEY_ID,
    secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    s3_bucket: process.env.S3_BUCKET_NAME
  },
  spaces: {
    access_key_id: readSpacesEnv('SPACES_ACCESS_KEY_ID'),
    secret_access_key: readSpacesEnv('SPACES_SECRET_ACCESS_KEY'),
    region: spacesRegion,
    endpoint: readSpacesEnv('SPACES_ENDPOINT'),
    bucket: readSpacesEnv('SPACES_BUCKET'),
  },
  spaces_config_warnings: spacesConfigWarnings,
};

export const validateSpacesConfig = (): string[] => {
  const { access_key_id, secret_access_key, bucket, region, endpoint } =
    config.spaces;
  const missing = [
    !access_key_id && 'SPACES_ACCESS_KEY_ID',
    !secret_access_key && 'SPACES_SECRET_ACCESS_KEY',
    !bucket && 'SPACES_BUCKET',
    !region && 'SPACES_REGION',
    !endpoint && 'SPACES_ENDPOINT',
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `DigitalOcean Spaces configuration is missing: ${missing.join(', ')}`
    );
  }

  if (config.spaces_config_warnings.some((warning) => warning.includes('unmatched'))) {
    throw new Error(
      'DigitalOcean Spaces environment values contain unmatched quotes; correct the listed variables.'
    );
  }

  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint!);
  } catch {
    throw new Error('SPACES_ENDPOINT must be a valid HTTPS URL.');
  }

  if (
    endpointUrl.protocol !== 'https:' ||
    endpointUrl.hostname !== `${region}.digitaloceanspaces.com` ||
    endpointUrl.username !== '' ||
    endpointUrl.password !== '' ||
    (endpointUrl.port !== '' && endpointUrl.port !== '443') ||
    endpointUrl.pathname !== '/' ||
    endpointUrl.search !== '' ||
    endpointUrl.hash !== ''
  ) {
    throw new Error(
      'SPACES_ENDPOINT must match the Spaces region (for example, https://nyc3.digitaloceanspaces.com).'
    );
  }

  if (
    !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/i.test(bucket!) ||
    bucket!.includes('..')
  ) {
    throw new Error('SPACES_BUCKET must be a valid bucket name.');
  }

  return config.spaces_config_warnings;
};

export default config;
