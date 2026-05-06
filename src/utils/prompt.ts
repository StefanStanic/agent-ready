import { createInterface } from "node:readline";

export async function prompt(message: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  return new Promise<string>((resolve) => {
    rl.question(`${message}${suffix}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || "");
    });
  });
}
