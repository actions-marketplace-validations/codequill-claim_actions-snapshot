import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as path from "node:path";
import * as fs from "node:fs";
import stringArgv from "string-argv";

function req(name: string): string {
    return String(core.getInput(name, { required: true }) || "").trim();
}
function opt(name: string, def = ""): string {
    const v = String(core.getInput(name, { required: false }) ?? "").trim();
    return v.length ? v : def;
}

function ensureDir(p: string) {
    if (!fs.existsSync(p)) throw new Error(`working_directory does not exist: ${p}`);
    if (!fs.statSync(p).isDirectory()) throw new Error(`working_directory is not a directory: ${p}`);
}

async function installCli(cliVersion: string) {
    const pkg = cliVersion ? `codequill@${cliVersion}` : "codequill";
    core.info(`Installing CodeQuill CLI: ${pkg}`);
    await exec.exec("npm", ["i", "-g", pkg]);
    try { await exec.exec("codequill", ["--version"]); } catch { /* ignore */ }
}

async function runCli(args: string[], env: Record<string,string>) {
    core.info(`Running: codequill ${args.join(" ")}`);
    return await exec.getExecOutput("codequill", args, { env: { ...process.env, ...env } as Record<string, string> });
}

async function run() {
    try {
        const token = req("token");
        const githubId = req("github_id");
        const apiBase = opt("api_base_url", "");
        const cliVersion = opt("cli_version", "");
        const wd = opt("working_directory", ".");
        const extraArgs = opt("extra_args", "");
        const extra = extraArgs ? stringArgv(extraArgs) : [];

        const wdAbs = path.resolve(process.cwd(), wd);
        ensureDir(wdAbs);
        process.chdir(wdAbs);

        await installCli(cliVersion);

        const env: Record<string,string> = {
            CODEQUILL_TOKEN: token,
            CODEQUILL_GITHUB_ID: githubId
        };
        if (apiBase) env.CODEQUILL_API_BASE_URL = apiBase;

        await runCli(["snapshot"], env);
        
        const publishOutput = await runCli(["publish", "--no-confirm", "--json", "--no-wait"], env);
        let txHash = "";
        try {
            const res = JSON.parse(publishOutput.stdout);
            txHash = res.tx_hash;
            if (res.explorer_url) {
                core.info(`View transaction on explorer: ${res.explorer_url}`);
            }
        } catch (e) {
            core.warning("Failed to parse publish output as JSON. Transaction hash not found.");
        }

        if (txHash) {
            core.info(`Waiting for transaction: ${txHash}`);
            await runCli(["wait", txHash, ...extra], env);
        } else {
            core.warning("No transaction hash found, skipping wait.");
        }

        core.info("Done.");
    } catch (e: any) {
        core.setFailed(e?.message ? String(e.message) : String(e));
    }
}

run();