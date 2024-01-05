import { copyBaraSky } from "./copy.bara.sky";
import { exec } from "@actions/exec";
import { exitCodes } from "./exit";
import { hostConfig } from "./hostConfig";

export class CopyBara {
  constructor(readonly image: DockerConfig) {}

  public async download(): Promise<number> {
    return exec("docker", ["pull", `${this.image.name}:${this.image.tag}`]);
  }

  public async run(workflow: string, copybaraOptions: string[], ref: string | number = ""): Promise<number> {
    switch (workflow) {
      case "init":
        return this.exec(
          ["-e", "COPYBARA_WORKFLOW=push"],
          ["--force", "--init-history", "--ignore-noop", ...copybaraOptions],
        );

      case "pr":
        return this.exec(
          ["-e", "COPYBARA_WORKFLOW=pr", "-e", `COPYBARA_SOURCEREF=${ref}`],
          ["--ignore-noop", ...copybaraOptions],
        );

      default:
        return this.exec(["-e", `COPYBARA_WORKFLOW=${workflow}`], ["--ignore-noop", ...copybaraOptions]);
    }
  }

  public static getConfig(workflow: string, config: CopybaraConfig): string {
    this.validateConfig(config, workflow);
    return copyBaraSky({
      sotRepo: `https://github.com/${config.sot.repo}.git`,
      sotBranch: config.sot.branch,
      destinationRepo: `https://github.com/${config.destination.repo}.git`,
      destinationBranch: config.destination.branch,
      committer: config.committer,
      originFilesInclude: this.generateInExcludes(config.push.origin_include),
      originFilesExclude: this.generateInExcludes(config.push.origin_exclude),
      destinationFilesInclude: this.generateInExcludes(config.push.destination_include),
      destinationFilesExclude: this.generateInExcludes(config.push.destination_exclude),
      transformations: this.generateTransformations(config.push.move, config.push.replace, config.workflow),
    });
  }

  private async exec(dockerParams: string[] = [], copybaraOptions: string[] = []): Promise<number> {
    const cbOptions = !copybaraOptions.length ? [] : [`-e`, `COPYBARA_OPTIONS`];

    const execExitCode = await exec(
      `docker`,
      [
        "run",
        `-v`,
        `${process.cwd()}:/usr/src/app`,
        `-v`,
        `${hostConfig.cbConfigPath}:/root/copy.bara.sky`,
        `-v`,
        `${hostConfig.gitConfigPath}:/root/.gitconfig`,
        `-e`,
        `COPYBARA_CONFIG=/root/copy.bara.sky`,
        ...dockerParams,
        ...cbOptions,
        this.image.name,
        "copybara",
      ],
      {
        ignoreReturnCode: true,
        env: { COPYBARA_OPTIONS: copybaraOptions.join(" ") },
      },
    );

    const exitCode = exitCodes[execExitCode];

    if (exitCode && exitCode.ns == "copybara") {
      // success/warning
      if (exitCode.type == "success" || exitCode.type == "warning") return execExitCode;
      // known errors
      else throw execExitCode;
    } // unknown error
    else throw 52;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static validateConfig(config: CopybaraConfig, workflow: string) {
    if (!config.committer) throw 'You need to set a value for "committer".';
    if (!config.image.name) throw 'You need to set a value for "copybara_image".';
    if (!config.image.tag) throw 'You need to set a value for "copybara_image_tag".';
    if (!config.push.origin_include.length) throw 'You need to set a value for "origin_include".';
    if (!config.sot.repo || !config.destination.repo)
      throw 'You need to set values for "sot_repo" & "destination_repo" or set a value for "custom_config".';
  }

  private static generateInExcludes(inExcludesArray: string[]) {
    const inExcludeGlobs = inExcludesArray.filter((v) => v);
    let inExcludeString = "";

    if (inExcludeGlobs.length) inExcludeString = `"${inExcludeGlobs.join('","')}"`;
    return inExcludeString;
  }

  private static generateTransformations(moves: string[], replacements: string[], workflow: string) {
    const move = this.transformer(moves, "move");
    const replace = this.transformer(replacements, "replace");

    return workflow == "push"
      ? // Move first then replace for push
        move.concat(replace)
      : // Replace first then move for PR
        replace.concat(move);
  }

  private static transformer(list: string[], method: string) {
    let transformation = "";

    list.forEach((item) => {
      if (item) {
        const [from, to = "", path] = item.split("||");
        const glob = path ? path : "**";

        transformation = transformation.concat(`
        core.${method}("${from}", "${to}", paths = glob(["${glob}"])),`);
      }
    });

    return transformation;
  }
}

export type CopybaraConfig = {
  // Common config
  sot: RepoConfig;
  destination: RepoConfig;
  committer: string;

  // Push config
  push: WorkflowConfig;

  // Advanced config
  customConfig: string;
  workflow: string;
  copybaraOptions: string[];
  knownHosts: string;
  prNumber: string | number;
  createRepo: boolean;
  image: DockerConfig;
};

export type RepoConfig = {
  repo: string;
  branch: string;
};

export type DockerConfig = {
  name: string;
  tag: string;
};

export type WorkflowConfig = {
  origin_include: string[];
  origin_exclude: string[];
  destination_include: string[];
  destination_exclude: string[];
  move: string[];
  replace: string[];
};
