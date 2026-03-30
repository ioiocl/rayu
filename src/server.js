const dotenv = require("dotenv");
const { bootstrapApp, closeResources } = require("./infrastructure/bootstrap");

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const STARTUP_RETRIES = Number(process.env.STARTUP_RETRIES || 20);
const STARTUP_RETRY_DELAY_MS = Number(process.env.STARTUP_RETRY_DELAY_MS || 3000);

let shutdownFn = closeResources;

bootstrapApp({
  port: PORT,
  startupRetries: STARTUP_RETRIES,
  startupRetryDelayMs: STARTUP_RETRY_DELAY_MS,
})
  .then(({ shutdown }) => {
    shutdownFn = shutdown;
  })
  .catch(async (error) => {
    console.error("No se pudo iniciar la app:", error.message);
    await closeResources();
    process.exit(1);
  });

async function handleShutdown(signal) {
  try {
    await shutdownFn();
  } finally {
    process.exit(signal ? 0 : 1);
  }
}

process.on("SIGINT", () => {
  handleShutdown("SIGINT");
});

process.on("SIGTERM", () => {
  handleShutdown("SIGTERM");
});
