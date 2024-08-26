"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logWithTrace = logWithTrace;
function logWithTrace(...args) {
    // Create an error to get the stack trace
    const stack = new Error().stack?.split('\n');
    let functionName = 'anonymous';
    let location = '';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLG9DQXVCQztBQXZCRCxTQUFnQixZQUFZLENBQUMsR0FBRyxJQUFXO0lBQ3pDLHlDQUF5QztJQUN6QyxNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0MsSUFBSSxZQUFZLEdBQUcsV0FBVyxDQUFDO0lBQy9CLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUVsQixJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQzlCLGtFQUFrRTtRQUNsRSxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDbEMsTUFBTSxpQkFBaUIsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3RELE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUUxRCxJQUFJLGlCQUFpQixJQUFJLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDOUMsWUFBWSxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFRCxJQUFJLGFBQWEsSUFBSSxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQzlFLFFBQVEsR0FBRyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDM0UsQ0FBQztJQUNILENBQUM7SUFFRCw0REFBNEQ7SUFDNUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLFlBQVksZ0JBQWdCLFFBQVEsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDaEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlxuZXhwb3J0IGZ1bmN0aW9uIGxvZ1dpdGhUcmFjZSguLi5hcmdzOiBhbnlbXSk6IHZvaWQge1xuICAvLyBDcmVhdGUgYW4gZXJyb3IgdG8gZ2V0IHRoZSBzdGFjayB0cmFjZVxuICBjb25zdCBzdGFjayA9IG5ldyBFcnJvcigpLnN0YWNrPy5zcGxpdCgnXFxuJyk7XG4gIGxldCBmdW5jdGlvbk5hbWUgPSAnYW5vbnltb3VzJztcbiAgbGV0IGxvY2F0aW9uID0gJyc7XG5cbiAgaWYgKHN0YWNrICYmIHN0YWNrLmxlbmd0aCA+IDIpIHtcbiAgICAvLyBUaGUgdGhpcmQgbGluZSB1c3VhbGx5IGNvbnRhaW5zIHRoZSBjYWxsZXIgZnVuY3Rpb24gaW5mb3JtYXRpb25cbiAgICBjb25zdCBzdGFja0xpbmUgPSBzdGFja1syXS50cmltKCk7XG4gICAgY29uc3QgZnVuY3Rpb25OYW1lTWF0Y2ggPSBzdGFja0xpbmUubWF0Y2goL2F0IChcXFMrKS8pO1xuICAgIGNvbnN0IGxvY2F0aW9uTWF0Y2ggPSBzdGFja0xpbmUubWF0Y2goLyguKik6KFxcZCspOihcXGQrKS8pO1xuXG4gICAgaWYgKGZ1bmN0aW9uTmFtZU1hdGNoICYmIGZ1bmN0aW9uTmFtZU1hdGNoWzFdKSB7XG4gICAgICBmdW5jdGlvbk5hbWUgPSBmdW5jdGlvbk5hbWVNYXRjaFsxXTtcbiAgICB9XG5cbiAgICBpZiAobG9jYXRpb25NYXRjaCAmJiBsb2NhdGlvbk1hdGNoWzFdICYmIGxvY2F0aW9uTWF0Y2hbMl0gJiYgbG9jYXRpb25NYXRjaFszXSkge1xuICAgICAgbG9jYXRpb24gPSBgJHtsb2NhdGlvbk1hdGNoWzFdfToke2xvY2F0aW9uTWF0Y2hbMl19OiR7bG9jYXRpb25NYXRjaFszXX1gO1xuICAgIH1cbiAgfVxuXG4gIC8vIFByZXBlbmQgdGhlIGZ1bmN0aW9uIG5hbWUgYW5kIGxvY2F0aW9uIHRvIHRoZSBsb2cgbWVzc2FnZVxuICBjb25zb2xlLmxvZyhgW0Z1bmN0aW9uOiAke2Z1bmN0aW9uTmFtZX1dIFtMb2NhdGlvbjogJHtsb2NhdGlvbn1dIC1gLCAuLi5hcmdzKTtcbn0iXX0=