import config, { validateSpacesConfig } from '../config';
import { checkSpacesUpload } from '../shared/uploadToSpaces';

const run = async (): Promise<void> => {
  const warnings = validateSpacesConfig();
  warnings.forEach((warning) => console.warn(warning));
  console.log(
    `Checking Spaces access: bucket=${config.spaces.bucket}, region=${config.spaces.region}, endpoint=${config.spaces.endpoint}`
  );
  await checkSpacesUpload();
  console.log('DigitalOcean Spaces upload and cleanup check succeeded.');
};

run().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
