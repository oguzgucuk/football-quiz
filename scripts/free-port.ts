import { execSync } from "child_process";

try {
  const output = execSync("netstat -ano | findstr :1999").toString();
  const lines = output.trim().split("\n");
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && !isNaN(Number(pid))) {
      console.log("Killing PID on port 1999:", pid);
      execSync(`taskkill /F /PID ${pid}`);
    }
  }
} catch {
  console.log("No process on port 1999 or already free.");
}
