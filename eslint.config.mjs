// ESLint 9 flat config for Next.js 16
// Since eslint-config-next doesn't fully support ESLint 9 flat config yet,
// we use a basic config that works with Next.js patterns

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "*.config.js",
      "*.config.mjs",
    ],
  },
  {
    files: ["scripts/**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    rules: { "no-console": "off" },
  },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Node.js globals
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        URL: "readonly",
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        FileReader: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestIdleCallback: "readonly",
        cancelIdleCallback: "readonly",
        alert: "readonly",
        confirm: "readonly",
        URLSearchParams: "readonly",
        CustomEvent: "readonly",
        crypto: "readonly",
        Blob: "readonly",
        // React globals
        React: "readonly",
      },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_|^(Navbar|AdminNavbar|AdminLayoutShell|AdminSidebar|AdminPageHeader|AdminCard|AdminFormField|AdminButton|AdminMessage|AdminEmptyState|AdminTable|ChatPanel|Link|Image|ApplicationForm|ContactForm|SponsoredApplicationForm|Script|ToastProvider|Suspense|PaymentFailedContent|PaymentSuccessContent|LineChart|Line|XAxis|YAxis|CartesianGrid|Tooltip|ResponsiveContainer|PieChart|Pie|Cell|BarChart|Bar|Legend|PushToggle|PwaRegister|LmsCard|LmsEmptyState|LmsLayoutShell|LmsSidebar|LmsPageHeader|LmsBadge|AdminStatsGrid|AdminNavigationLoader|ImpersonateContent|AuditPageViewTracker)$",
          ignoreRestSiblings: true,
        },
      ],
      "no-console": "off", // Prefer logger from @/lib/logger for server-side code; allow console for debug/CLI
      "no-undef": "error",
    },
  },
];
