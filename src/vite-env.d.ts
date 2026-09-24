// src/vite-env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_QWEN_API_KEY: string;
  readonly VITE_QWEN_MODEL: string;
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}