import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lucasgrowthguide.app',
  appName: "Luca's Growth Guide",
  webDir: 'www',
  server: {
    url: 'https://dadofluca.github.io/Lucas-Growth-Guide/',
    cleartext: false
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
