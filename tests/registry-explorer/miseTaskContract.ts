import { execFileSync } from "node:child_process";
import { z } from "zod";

const taskSchema = z.object({
  name: z.string(),
  run: z.array(z.union([z.string(), z.object({ task: z.string() }).transform(({ task }) => task)])),
});

const tasks = new Map(
  z
    .array(taskSchema)
    .parse(JSON.parse(execFileSync("mise", ["tasks", "ls", "--json"], { encoding: "utf8" })))
    .map((task) => [task.name, task]),
);

export function taskNames(): string[] {
  return [...tasks.keys()];
}

export function taskSteps(name: string): string[] {
  const task = tasks.get(name);

  if (!task) throw Error(`Missing Mise task: ${name}`);

  return task.run;
}
