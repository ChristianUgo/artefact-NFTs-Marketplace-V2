const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
const output = fs.openSync(path.join(root, "v2-dev.out.log"), "a");
const errors = fs.openSync(path.join(root, "v2-dev.err.log"), "a");

const processHandle = spawn(process.execPath, [nextCli, "dev", "--webpack", "-p", "3005"], {
  cwd: root,
  detached: true,
  stdio: ["ignore", output, errors],
  windowsHide: true,
});

processHandle.unref();
console.log(`Version 2 started with process ${processHandle.pid}`);
console.log("Open http://localhost:3005");
