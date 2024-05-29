export const Logger = {
  info: (...message) => {
    console.log(...message);
  },
  error: (...message) => {
    if (message.length === 1 && message[0] instanceof Error) {
      const err = message[0];

      // Log the error using console.log
      console.log("[ERROR]", err);

      const errorMessage = `-\n\n\n:warning::warning::warning:\n\n*ERROR NAME*\n${
        err.name
      } on API\n\n*MESSAGE*\n${err.message}\n\n*STACK TRACE*\n${
        err.stack
      }\n\n*TIME*\n${new Date()}\n-`;
    } else {
      // Log the error arguments using iteratorLog
      console.error("[ERROR]", ...message);

      const errorMessage = message.map(String).join(" ");
    }
  },
  warn: (...message) => console.log("[WARN]", ...message),
  debug: (...message) =>
    process.env.DEBUG ? console.log("[DEBUG]", ...message) : null,
};
