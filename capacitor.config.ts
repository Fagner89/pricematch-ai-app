import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.0080dc04cb13464f8daa3444401890dd',
  appName: 'pricematch-ai-app',
  webDir: 'dist',
  // Configurações para persistência nativa
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;