export function logWithTrace(...args: any[]): void {
  // Create an error to get the stack trace
  const stack = new Error().stack?.split("\n");
  let functionName = "anonymous";
  let location = "";

  if (stack && stack.length > 2) {
    // The third line usually contains the caller function information
    const stackLine = stack[2].trim();
    const functionNameMatch = stackLine.match(/at (\S+)/);
    const locationMatch = stackLine.match(/(.*):(\d+):(\d+)/);

    if (functionNameMatch && functionNameMatch[1]) {
      functionName = functionNameMatch[1];
    }

    if (locationMatch && locationMatch[1] && locationMatch[2] && locationMatch[3]) {
      location = `${locationMatch[1]}:${locationMatch[2]}:${locationMatch[3]}`;
    }
  }

  // Prepend the function name and location to the log message
  console.log(`[Function: ${functionName}] [Location: ${location}] -`, ...args);
}
