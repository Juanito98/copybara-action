import * as core from "@actions/core";
import { context } from "@actions/github";
import { CopybaraAction } from "./copybaraAction";
import { exit } from "./exit";

const action = new CopybaraAction({
  // Credentials
  accessToken: core.getInput("access_token"),

  // Common config
  sot: {
    repo: core.getInput("sot_repo"),
    branch: core.getInput("sot_branch"),
  },
  destination: {
    repo: core.getInput("destination_repo"),
    branch: core.getInput("destination_branch"),
  },
  committer: core.getInput("committer"),

  // Push config
  push: {
    origin_include: core.getInput("origin_include").split(" "),
    origin_exclude: core.getInput("origin_exclude").split(" "),
    destination_include: core.getInput("destination_include").split(" "),
    destination_exclude: core.getInput("destination_exclude").split(" "),
    move: core.getInput("move").split(/\r?\n/),
    replace: core.getInput("replace").split(/\r?\n/),
    assignees: [context.actor],
  },

  // Advanced config
  customConfig: core.getInput("custom_config"),
  workflow: core.getInput("workflow"),
  copybaraOptions: core.getInput("copybara_options").split(" "),
  knownHosts: core.getInput("ssh_known_hosts"),
  prNumber: core.getInput("pr_number"),
  createRepo: core.getInput("create_repo") == "yes" ? true : false,

  // Docker
  image: {
    name: core.getInput("copybara_image"),
    tag: core.getInput("copybara_image_tag"),
  },
});

if (!core.isDebug()) {
  // Action fails gracefully on 'throw'
  process.on("unhandledRejection", (err) => exit(53, err as string));
  action.run().then(exit).catch(exit);
} else {
  core.debug("BEWARE: Debug mode is on, this could result in this action succeeding while it didn't. Check the logs.");
  action.run().then(exit);
}
