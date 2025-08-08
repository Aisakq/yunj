import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.example.yunjarchive",
  appName: "Yunj Archive",
  webDir: ".next",
  server: {
    // 원격 배포 URL을 사용하면 iOS 앱이 그 URL을 로드합니다.
    // 예: https://your-app.onrender.com
    url: process.env.CAP_SERVER_URL || "http://localhost:3000",
    cleartext: true, // http 개발용 허용
  },
};

export default config;
